'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';
import { releaseStaleOrders, allocateInvoiceNumber } from '@/lib/orders';
import { getStoreSettings } from '@/lib/store-settings';
import { transitionOrder } from '@/lib/order-status';
import { nextAdminStatuses, ORDER_STATUSES, type OrderStatus } from '@/lib/order-status-rules';
import { logOrderEvent } from '@/lib/order-events';

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

async function adminActor() {
  const session = await requireAdmin();
  return `admin:${session.user?.email ?? 'unknown'}`;
}

function revalidateOrder(id?: string) {
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  if (id) revalidatePath(`/admin/orders/${id}`);
}

export async function getAdminOrders() {
  await requireAdmin();
  // Fallback for when no cron is configured: expire abandoned online checkouts.
  try { await releaseStaleOrders(10); } catch (e) { console.error('Stale order sweep failed:', e); }
  const dbOrders = await prisma.order.findMany({
    where: { status: { not: 'DELETED' } },  // Hide soft-deleted orders
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return dbOrders.map((o: any) => ({
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
}

/** Changes order status through the lifecycle rules (stock, refunds, cashback, notifications). */
export async function updateOrderStatusAction(id: string, status: string, reason?: string) {
  const actor = await adminActor();
  const upper = status.toUpperCase() as OrderStatus;
  if (!ORDER_STATUSES.includes(upper)) return { error: 'Unknown status' };

  const res = await transitionOrder(id, upper, { actor, reason });
  revalidateOrder(id);
  return res.ok ? { success: true } : { error: res.error };
}

export async function deleteOrderAction(id: string) {
  const actor = await adminActor();
  // Soft-delete only closed orders (cancelled / expired / returned); keeps the audit trail.
  const res = await transitionOrder(id, 'DELETED', { actor });
  revalidateOrder(id);
  return res.ok ? { success: true } : { error: 'Only cancelled, expired or returned orders can be deleted.' };
}

export async function addOrderNoteAction(id: string, note: string) {
  const actor = await adminActor();
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
  await requireAdmin();

  if (!data.items.length || data.items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1 || !(i.price >= 0))) {
    return { error: 'Invalid items' };
  }

  // Resolve product names for the audit trail
  const productIds = data.items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const nameById = new Map(products.map((p: any) => [p.id, p.name]));

  // Same rules as storefront checkout: GST-inclusive prices, shipping from settings.
  const settings = await getStoreSettings();
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const subtotal = round2(data.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const shippingFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingRate;
  const total = round2(subtotal + shippingFee);
  const taxAmount = round2((total * settings.gstRate) / (100 + settings.gstRate));

  try {
    const order = await prisma.$transaction(async (tx: any) => {
      for (const item of data.items) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        });
        if (res.count === 0) throw new Error(`STOCK:${nameById.get(item.productId) || 'Product'}`);
      }
      return tx.order.create({
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
              quantity: item.quantity,
              price: item.price,
              weight: item.weight,
              productName: nameById.get(item.productId) || "Product"
            }))
          }
        }
      });
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
  await requireAdmin();
  await prisma.order.update({
    where: { id },
    data: { trackingNumber, trackingUrl }
  });
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { success: true };
}

export async function updateInvoiceNotesAction(id: string, invoiceNotes: string) {
  await requireAdmin();
  await prisma.order.update({
    where: { id },
    data: { invoiceNotes }
  });
  revalidatePath('/admin/orders/invoice/[id]', 'page');
  return { success: true };
}

export async function bulkUpdateOrderStatusAction(ids: string[], status: string) {
  await requireAdmin();
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
