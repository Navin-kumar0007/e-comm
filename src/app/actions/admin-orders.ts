'use server'

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
import { splitGst } from '@/lib/gst';

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

export async function getAdminOrders(opts: { page?: number; q?: string; status?: string } = {}) {
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
  const where = { status: rawStatus ? rawStatus : { not: 'DELETED' }, ...search };

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
  return res.ok ? { success: true } : { error: res.error };
}

export async function deleteOrderAction(id: string) {
  const actor = await adminActor('orders.delete');
  // Soft-delete only closed orders (cancelled / expired / returned); keeps the audit trail.
  const res = await transitionOrder(id, 'DELETED', { actor });
  revalidateOrder(id);
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
  items: Array<{ productId: string; quantity: number; price: number; weight: string }>;
}) {
  const actor = await adminActor('orders.create');

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
    });

    revalidatePath('/admin/orders');
    revalidatePath('/admin');
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
