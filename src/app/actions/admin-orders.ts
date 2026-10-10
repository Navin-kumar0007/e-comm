'use server'

import { audit } from '@/lib/audit';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import type { Permission } from '@/lib/permissions';
import { releaseStaleOrders, allocateInvoiceNumber } from '@/lib/orders';
import { getStoreSettings } from '@/lib/store-settings';
import { transitionOrder } from '@/lib/order-status';
import { nextAdminStatuses, ORDER_STATUSES, type OrderStatus } from '@/lib/order-status-rules';
import { logOrderEvent } from '@/lib/order-events';
import { adjustStock, StockError } from '@/lib/inventory';
import { splitGst, isValidGstin } from '@/lib/gst';

function mapPrismaStatusToUI(status: string) {
  const m: Record<string, string> = {
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'CONFIRMED': 'Confirmed',
    'SHIPPED': 'Shipped',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
    'EXPIRED': 'Expired',
    'RTO': 'RTO',
    'RETURNED': 'Returned',
    'PAID': 'Confirmed'
  };
  return m[status.toUpperCase()] || 'Pending';
}

async function adminActor(permission: Permission) {
  await requirePermission(permission);
  return staffActor();
}

function revalidateOrder(id?: string) {
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  if (id) revalidatePath(`/admin/orders/${id}`);
}

const ORDERS_PAGE_SIZE = 50; // not exported: "use server" files may only export async functions

export async function getAdminOrders(opts: { page?: number; q?: string; status?: string; channel?: string } = {}) {
  await requirePermission('orders.view');
  // Fallback for when no cron is configured: expire abandoned online checkouts.
  try { await releaseStaleOrders(10); } catch (e) { console.error('Stale order sweep failed:', e); }

  const page = Math.max(1, Math.floor(opts.page || 1));
  const rawStatus = Object.entries({
    Pending: 'PENDING', Processing: 'PROCESSING', Confirmed: 'CONFIRMED', Shipped: 'SHIPPED', Delivered: 'DELIVERED',
    Cancelled: 'CANCELLED', RTO: 'RTO', Returned: 'RETURNED', Expired: 'EXPIRED',
  }).find(([label]) => label === opts.status)?.[1];

  const q = opts.q?.trim().replace(/^NW-/i, '').replace(/^#/, '');
  const search = q
    ? {
        OR: [
          { id: { endsWith: q.toLowerCase() } },
          { id: q },
          { customerName: { contains: q, mode: 'insensitive' as const } },
          { customerEmail: { contains: q, mode: 'insensitive' as const } },
          { customerPhone: { contains: q } },
          { trackingNumber: { contains: q } },
        ],
      }
    : {};
  const channel = ['WEBSITE', 'SHOP', 'WHOLESALE', 'PHONE'].includes(opts.channel ?? '') ? opts.channel : undefined;
  const where = { status: rawStatus ? rawStatus : { not: 'DELETED' }, ...(channel ? { channel } : {}), ...search };

  const [dbOrders, total, grouped] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], where: { status: { not: 'DELETED' }, ...search }, _count: { _all: true } }),
  ]);

  const counts: Record<string, number> = { all: 0 };
  for (const g of grouped as any[]) {
    counts[mapPrismaStatusToUI(g.status)] = (counts[mapPrismaStatusToUI(g.status)] ?? 0) + g._count._all;
    counts.all += g._count._all;
  }

  const orders = dbOrders.map((o: any) => ({
    id: o.id,
    customer: o.customerName,
    email: o.customerEmail,
    phone: o.customerPhone,
    date: o.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    total: o.total,
    status: mapPrismaStatusToUI(o.status) as any,
    rawStatus: o.status as string,
    nextStatuses: nextAdminStatuses(o.status) as string[],
    paymentMethod: o.paymentMethod || 'ONLINE',
    channel: o.channel || 'WEBSITE',
    codPending: o.codStatus === 'PENDING',
    discount: o.discount || 0,
    couponCode: o.couponCode || null,
    items: o.items.map((item: any) => ({
      name: item.product?.name || item.productName || "Deleted Product",
      quantity: item.quantity,
      price: item.price,
      weight: item.weight
    })),
    shippingAddress: o.shippingAddress,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    notes: ''
  }));

  return { orders, total, page, pageSize: ORDERS_PAGE_SIZE, counts };
}

/** Changes order status through the lifecycle rules (stock, refunds, cashback, notifications). */
export async function updateOrderStatusAction(id: string, status: string, reason?: string) {
  const upper = status.toUpperCase() as OrderStatus;
  if (!ORDER_STATUSES.includes(upper)) return { error: 'Unknown status' };
  // Cancelling / RTO returns stock and refunds money, so it needs its own permission.
  const actor = await adminActor(upper === 'CANCELLED' || upper === 'RTO' ? 'orders.cancel' : 'orders.update');

  const res = await transitionOrder(id, upper, { actor, reason });
  revalidateOrder(id);
  if (res.ok) await audit({ action: 'order.status', entity: 'Order', entityId: id, summary: `Order #${id.slice(-8).toUpperCase()} → ${status}${reason ? ` (${reason})` : ''}` });
  return res.ok ? { success: true } : { error: res.error };
}

export async function deleteOrderAction(id: string) {
  const actor = await adminActor('orders.delete');
  // Soft-delete only closed orders (cancelled / expired / returned); keeps the audit trail.
  const res = await transitionOrder(id, 'DELETED', { actor });
  revalidateOrder(id);
  if (res.ok) await audit({ action: 'order.delete', entity: 'Order', entityId: id, summary: `Deleted order #${id.slice(-8).toUpperCase()}` });
  return res.ok ? { success: true } : { error: 'Only cancelled, expired or returned orders can be deleted.' };
}

export async function addOrderNoteAction(id: string, note: string) {
  const actor = await adminActor('orders.update');
  const text = note.trim().slice(0, 1000);
  if (!text) return { error: 'Note is empty' };
  await logOrderEvent(null, { orderId: id, type: 'NOTE', message: text, actor });
  revalidateOrder(id);
  return { success: true };
}

export async function createOrderAction(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  customerGstin?: string | null;
  userId?: string | null;
  items: Array<{ productId: string; quantity: number; price: number; weight: string }>;
}) {
  const actor = await adminActor('orders.create');
  const customerGstin = data.customerGstin?.trim().toUpperCase() || null;
  if (customerGstin && !isValidGstin(customerGstin)) return { error: 'Customer GSTIN is not valid.' };

  if (!data.items.length || data.items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1 || !(i.price >= 0))) {
    return { error: 'Invalid items' };
  }

  // Resolve product names for the audit trail
  const productIds = data.items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } } });
  const nameById = new Map(products.map((p: any) => [p.id, p.name]));
  const productById = new Map<string, any>(products.map((p: any) => [p.id, p]));
  // Products with sizes: use the size matching the weight label, else the default size.
  const variantFor = (productId: string, weight: string) => {
    const variants: any[] = products.find((p: any) => p.id === productId)?.variants ?? [];
    return (variants.find((v) => v.label === weight) ?? variants[0])?.id ?? null;
  };

  // Same rules as storefront checkout: GST-inclusive prices, shipping from settings.
  const settings = await getStoreSettings();
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const subtotal = round2(data.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const shippingFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingRate;
  const total = round2(subtotal + shippingFee);
  const rateFor = (productId: string) => productById.get(productId)?.gstRate ?? settings.gstRate;
  const taxAmount = splitGst({
    lines: data.items.map((i) => ({ amount: i.price * i.quantity, gstRate: rateFor(i.productId) })),
    shipping: shippingFee,
    defaultRate: settings.gstRate,
  }).taxTotal;

  try {
    const order = await prisma.$transaction(async (tx: any) => {
      const created = await tx.order.create({
        data: {
          subtotal,
          shippingFee,
          taxAmount,
          total,
          status: "CONFIRMED",
          paymentMethod: "COD",
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          customerGstin,
          channel: data.userId ? 'WHOLESALE' : 'PHONE',
          ...(data.userId ? { userId: data.userId } : {}),
          invoiceNumber: await allocateInvoiceNumber(tx),
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              variantId: variantFor(item.productId, item.weight),
              quantity: item.quantity,
              price: item.price,
              weight: item.weight,
              hsnCode: productById.get(item.productId)?.hsnCode ?? null,
              gstRate: rateFor(item.productId),
              productName: nameById.get(item.productId) || "Product"
            }))
          }
        }
      });
      for (const item of data.items) {
        try {
          await adjustStock(tx, { productId: item.productId, variantId: variantFor(item.productId, item.weight), delta: -item.quantity, reason: 'ADMIN_ORDER', orderId: created.id, actor });
        } catch (e) {
          if (e instanceof StockError) throw new Error(`STOCK:${nameById.get(item.productId) || 'Product'}`);
          throw e;
        }
      }
      return created;
    }, { timeout: 15000, maxWait: 5000 });

    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    await audit({ action: 'order.create', entity: 'Order', entityId: order.id, summary: `Manual order #${order.id.slice(-8).toUpperCase()} for ${data.customerName}`, actor });
    return { success: true, orderId: order.id };
  } catch (e: any) {
    if (typeof e?.message === 'string' && e.message.startsWith('STOCK:')) {
      return { error: `Not enough stock for ${e.message.slice(6)}` };
    }
    throw e;
  }
}

export async function updateOrderTrackingAction(id: string, trackingNumber: string, trackingUrl: string) {
  await requirePermission('orders.update');
  await prisma.order.update({
    where: { id },
    data: { trackingNumber, trackingUrl }
  });
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { success: true };
}

export async function updateInvoiceNotesAction(id: string, invoiceNotes: string) {
  await requirePermission('orders.update');
  await prisma.order.update({
    where: { id },
    data: { invoiceNotes }
  });
  revalidatePath('/admin/orders/invoice/[id]', 'page');
  return { success: true };
}

export async function bulkUpdateOrderStatusAction(ids: string[], status: string) {
  await requirePermission('orders.update');
  let updated = 0;
  const failed: string[] = [];
  for (const id of ids) {
    const res = await updateOrderStatusAction(id, status);
    if ('error' in res) failed.push(`#${id.slice(-8).toUpperCase()}: ${res.error}`);
    else updated++;
  }
  revalidateOrder();
  return { success: failed.length === 0, updated, failed };
}

// ───────────── COD confirmation ─────────────

/** Staff called the customer and they confirmed the COD order. */
export async function confirmCodAction(orderId: string) {
  const actor = await adminActor('orders.update');
  const { confirmCodOrder } = await import('@/lib/cod');
  const ok = await confirmCodOrder(orderId, actor, 'by staff after calling the customer');
  if (!ok) return { error: 'This order is not waiting for COD confirmation.' };
  await audit({ action: 'order.cod_confirm', entity: 'Order', entityId: orderId, summary: `COD order #${orderId.slice(-8).toUpperCase()} confirmed by staff`, actor });
  revalidateOrder(orderId);
  return { success: true };
}

/** Customer couldn't be reached or doesn't want it: cancel and restock. */
export async function cancelUnconfirmedCodAction(orderId: string) {
  const actor = await adminActor('orders.cancel');
  const { declineCodOrder } = await import('@/lib/cod');
  const ok = await declineCodOrder(orderId, actor, 'cancelled by staff');
  if (!ok) return { error: 'This order is not waiting for COD confirmation.' };
  await audit({ action: 'order.cod_cancel', entity: 'Order', entityId: orderId, summary: `Unconfirmed COD order #${orderId.slice(-8).toUpperCase()} cancelled`, actor });
  revalidateOrder(orderId);
  return { success: true };
}

// ───────────── Editing an order before it ships ─────────────

const EDITABLE = ['PENDING', 'PROCESSING', 'CONFIRMED'];

async function editableOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, shipments: { where: { status: { not: 'CANCELLED' } }, select: { id: true } } } });
  if (!order) return { error: 'Order not found.' } as const;
  if (!EDITABLE.includes(order.status)) return { error: 'Only orders that haven’t shipped can be edited.' } as const;
  if (order.shipments.length) return { error: 'A courier is already booked. Cancel the shipment first, then edit.' } as const;
  return { order } as const;
}

export interface OrderContactInput { customerName: string; customerPhone: string; customerEmail: string; address: string; city: string; state: string; pincode: string; customerGstin?: string | null }

/** Fix the name, phone, email, address or GSTIN on an order that hasn't shipped. */
export async function editOrderContactAction(orderId: string, input: OrderContactInput) {
  const actor = await adminActor('orders.update');
  const found = await editableOrder(orderId);
  if ('error' in found) return { error: found.error };
  const name = input.customerName?.trim();
  const phone = (input.customerPhone || '').replace(/\D/g, '');
  const email = input.customerEmail?.trim().toLowerCase();
  const pincode = (input.pincode || '').trim();
  if (!name) return { error: 'Enter the customer name.' };
  if (phone.length < 10) return { error: 'Phone number should have 10 digits.' };
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Email looks wrong.' };
  if (!/^[1-9]\d{5}$/.test(pincode)) return { error: 'Pincode must be 6 digits.' };
  if (!input.address?.trim() || !input.city?.trim() || !input.state?.trim()) return { error: 'Fill in the full address.' };
  const gstin = input.customerGstin?.trim().toUpperCase() || null;
  if (gstin && !isValidGstin(gstin)) return { error: 'GSTIN is not valid.' };
  const shippingAddress = [input.address.trim(), input.city.trim(), input.state.trim(), pincode].join(', ');
  const before = found.order;
  await prisma.order.update({
    where: { id: orderId },
    data: { customerName: name, customerPhone: phone.length === 10 ? `91${phone}` : phone, customerEmail: email, shippingAddress, shippingState: input.state.trim(), customerGstin: gstin },
  });
  const changed = [
    before.customerName !== name && 'name', before.shippingAddress !== shippingAddress && 'address',
    before.customerPhone.replace(/\D/g, '').slice(-10) !== phone.slice(-10) && 'phone', before.customerEmail !== email && 'email', (before.customerGstin ?? null) !== gstin && 'GSTIN',
  ].filter(Boolean).join(', ');
  await logOrderEvent(null, { orderId, type: 'NOTE', message: `Order details edited: ${changed || 'no change'}`, actor });
  await audit({ action: 'order.edit_contact', entity: 'Order', entityId: orderId, summary: `Edited ${changed || 'nothing'} on #${orderId.slice(-8).toUpperCase()}`, data: { before: { name: before.customerName, phone: before.customerPhone, address: before.shippingAddress } }, actor });
  revalidateOrder(orderId);
  return { success: true };
}

/**
 * Change items and quantities on an unshipped, unpaid order (COD, phone or wholesale).
 * Stock moves by the difference; totals and GST are recalculated; the invoice number stays.
 * Prepaid online orders can't change value here: use a partial refund instead.
 */
export async function editOrderItemsAction(orderId: string, lines: Array<{ productId: string; variantId: string | null; quantity: number }>) {
  const actor = await adminActor('orders.update');
  const found = await editableOrder(orderId);
  if ('error' in found) return { error: found.error };
  const order = found.order;
  if (order.paymentMethod === 'ONLINE' && order.paymentId) return { error: 'This order was paid online. Use a partial refund for removed items instead of editing.' };
  const want = lines.filter((l) => Number(l.quantity) > 0).map((l) => ({ ...l, quantity: Math.floor(Number(l.quantity)) }));
  if (!want.length) return { error: 'An order needs at least one item. Cancel it instead.' };

  const settings = await getStoreSettings();
  const products = await prisma.product.findMany({ where: { id: { in: [...new Set([...want.map((l) => l.productId), ...order.items.map((i: any) => i.productId).filter(Boolean)])] } }, include: { variants: true } });
  const keyOf = (p: string | null, v: string | null) => `${p}|${v ?? ''}`;
  const oldQty = new Map<string, number>();
  for (const i of order.items as any[]) oldQty.set(keyOf(i.productId, i.variantId), (oldQty.get(keyOf(i.productId, i.variantId)) ?? 0) + i.quantity);

  const newItems: Array<{ productId: string; variantId: string | null; quantity: number; price: number; weight: string; hsnCode: string | null; gstRate: number; productName: string }> = [];
  for (const l of want) {
    const p: any = products.find((x: any) => x.id === l.productId);
    if (!p) return { error: 'A product was not found.' };
    const v = l.variantId ? p.variants.find((x: any) => x.id === l.variantId) : null;
    if (l.variantId && !v) return { error: `${p.name}: pack size not found.` };
    // Keep the price the customer was quoted for items already on the order.
    const existing = (order.items as any[]).find((i) => i.productId === p.id && (i.variantId ?? null) === (v?.id ?? null));
    const price = existing ? existing.price : (v ? v.salePrice ?? v.price : p.salePrice ?? p.price);
    newItems.push({ productId: p.id, variantId: v?.id ?? null, quantity: l.quantity, price, weight: v?.label ?? p.weight ?? '', hsnCode: p.hsnCode ?? null, gstRate: p.gstRate ?? settings.gstRate, productName: p.name });
  }
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const subtotal = r2(newItems.reduce((s, i) => s + i.price * i.quantity, 0));
  const discount = Math.min(order.discount || 0, subtotal);
  const shippingFee = order.shippingFee || 0;
  const total = r2(subtotal - discount + shippingFee);
  const taxAmount = splitGst({ lines: newItems.map((i) => ({ amount: i.price * i.quantity, gstRate: i.gstRate })), discount, shipping: shippingFee, defaultRate: settings.gstRate }).taxTotal;

  try {
    await prisma.$transaction(async (tx: any) => {
      const newQty = new Map<string, number>();
      for (const i of newItems) newQty.set(keyOf(i.productId, i.variantId), (newQty.get(keyOf(i.productId, i.variantId)) ?? 0) + i.quantity);
      for (const k of new Set([...oldQty.keys(), ...newQty.keys()])) {
        const [productId, variantId] = k.split('|');
        const delta = (oldQty.get(k) ?? 0) - (newQty.get(k) ?? 0); // + puts stock back, − takes more
        if (delta && productId && productId !== 'null') {
          await adjustStock(tx, { productId, variantId: variantId || null, delta, reason: delta > 0 ? 'CANCEL_RESTOCK' : 'ADMIN_ORDER', orderId, actor, note: 'Order edited' });
        }
      }
      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.update({ where: { id: orderId }, data: { subtotal, total, taxAmount, discount, items: { create: newItems } } });
    }, { timeout: 15000, maxWait: 5000 });
  } catch (e) {
    if (e instanceof StockError) return { error: 'Not enough stock for the new quantity.' };
    throw e;
  }
  const summary = newItems.map((i) => `${i.productName} ${i.weight}×${i.quantity}`).join(', ');
  await logOrderEvent(null, { orderId, type: 'NOTE', message: `Items changed: ${summary}. New total ₹${total.toFixed(2)} (was ₹${order.total.toFixed(2)}).`, actor });
  await audit({ action: 'order.edit_items', entity: 'Order', entityId: orderId, summary: `Items changed on #${orderId.slice(-8).toUpperCase()}: ₹${order.total} → ₹${total}`, data: { before: order.items.map((i: any) => ({ name: i.productName, qty: i.quantity, price: i.price })), after: newItems.map((i) => ({ name: i.productName, qty: i.quantity, price: i.price })) }, actor });
  revalidateOrder(orderId);
  return { success: true, total };
}

/** Products and sizes to pick from when editing an order. */
export async function getOrderEditCatalog() {
  await requirePermission('orders.update');
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' }, orderBy: { name: 'asc' },
    select: { id: true, name: true, weight: true, price: true, salePrice: true, stock: true, variants: { where: { isActive: true }, select: { id: true, label: true, price: true, salePrice: true, stock: true } } },
  });
  return products.flatMap((p: any) => (p.variants.length
    ? p.variants.map((v: any) => ({ productId: p.id, variantId: v.id, label: `${p.name} · ${v.label}`, price: v.salePrice ?? v.price, stock: v.stock }))
    : [{ productId: p.id, variantId: null, label: `${p.name}${p.weight ? ` · ${p.weight}` : ''}`, price: p.salePrice ?? p.price, stock: p.stock }]));
}
