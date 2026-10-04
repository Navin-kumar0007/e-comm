'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';
import { sendOrderShipped, sendOrderDelivered, sendOrderCancelled } from '@/lib/email';
import { releaseStaleOrders, allocateInvoiceNumber } from '@/lib/orders';
import { getStoreSettings } from '@/lib/store-settings';

function mapPrismaStatusToUI(status: string) {
  const m: Record<string, string> = {
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'CONFIRMED': 'Confirmed',
    'SHIPPED': 'Shipped',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
    'EXPIRED': 'Expired',
    'PAID': 'Confirmed'
  };
  return m[status.toUpperCase()] || 'Pending';
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

  return dbOrders.map(o => ({
    id: o.id,
    customer: o.customerName,
    email: o.customerEmail,
    phone: o.customerPhone,
    date: o.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    total: o.total,
    status: mapPrismaStatusToUI(o.status) as any,
    paymentMethod: (o as any).paymentMethod || 'ONLINE',
    discount: (o as any).discount || 0,
    couponCode: (o as any).couponCode || null,
    items: o.items.map(item => ({
      name: item.product?.name || (item as any).productName || "Deleted Product",
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

export async function updateOrderStatusAction(id: string, status: string) {
  await requireAdmin();

  const upperStatus = status.toUpperCase();

  // Expired orders already had their stock/points returned and were never paid.
  const current = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (current?.status === 'EXPIRED') {
    throw new Error('Expired orders were never paid and cannot be changed.');
  }

  // If cancelling, restore stock for each order item
  if (upperStatus === 'CANCELLED') {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (order && order.status !== 'CANCELLED') {
      // Claim the cancellation first so a double-click can't restore stock twice.
      const cancelled = await prisma.$transaction(async (tx: any) => {
        const claimed = await tx.order.updateMany({
          where: { id, status: { notIn: ['CANCELLED', 'EXPIRED'] } },
          data: { status: 'CANCELLED' }
        });
        if (claimed.count === 0) return false;

        for (const item of order.items) {
          if (item.productId && !item.productId.startsWith('custom-')) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
          }
        }
        // Return redeemed loyalty points
        if (order.userId && order.pointsUsed > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { points: { increment: order.pointsUsed } }
          });
        }
        return true;
      });
      if (!cancelled) return { success: true };

      // Notify customer
      if (order.userId) {
        await prisma.notification.create({
          data: {
            userId: order.userId,
            title: "Order Cancelled",
            message: `Your order #${order.id.slice(-6).toUpperCase()} has been cancelled.`,
            type: "ORDER",
            link: "/account/orders"
          }
        });
      }

      // Send cancellation email
      try { await sendOrderCancelled(order.customerEmail, order.id); } catch (e) { console.error('Cancel email failed:', e); }

      revalidatePath('/admin/orders');
      revalidatePath('/admin');
      return { success: true };
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: upperStatus }
  });
  
  if (order.userId) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Order Update",
        message: `Your order #${order.id.slice(-6).toUpperCase()} is now ${mapPrismaStatusToUI(status)}.`,
        type: "ORDER",
        link: "/account/orders"
      }
    });
  }

  // Send lifecycle emails
  if (upperStatus === 'SHIPPED') {
    try { await sendOrderShipped(order.customerEmail, order.id, order.trackingNumber || undefined, order.trackingUrl || undefined); } catch (e) { console.error('Shipped email failed:', e); }
  } else if (upperStatus === 'DELIVERED') {
    try { await sendOrderDelivered(order.customerEmail, order.id); } catch (e) { console.error('Delivered email failed:', e); }
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteOrderAction(id: string) {
  await requireAdmin();
  // Soft-delete: set status to DELETED instead of destroying audit trail
  await prisma.order.update({
    where: { id },
    data: { status: 'DELETED' }
  });
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
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
  
  // We can just loop and use the single update function to ensure stock & emails are handled correctly
  for (const id of ids) {
    try {
      await updateOrderStatusAction(id, status);
    } catch (e) {
      console.error("Failed to update order in bulk: ", id, e);
    }
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { success: true };
}
