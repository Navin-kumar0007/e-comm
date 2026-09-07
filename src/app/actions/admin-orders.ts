'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';
import { sendOrderShipped, sendOrderDelivered, sendOrderCancelled } from '@/lib/email';

function mapPrismaStatusToUI(status: string) {
  const m: Record<string, string> = {
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'CONFIRMED': 'Confirmed',
    'SHIPPED': 'Shipped',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
    'PAID': 'Confirmed'
  };
  return m[status.toUpperCase()] || 'Pending';
}

export async function getAdminOrders() {
  await requireAdmin();
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

  // If cancelling, restore stock for each order item
  if (upperStatus === 'CANCELLED') {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (order && order.status !== 'CANCELLED') {
      // Restore stock atomically
      await prisma.$transaction(async (tx: any) => {
        for (const item of order.items) {
          if (item.productId && !item.productId.startsWith('custom-')) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
          }
        }
        await tx.order.update({
          where: { id },
          data: { status: 'CANCELLED' }
        });
      });

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
  total: number;
  items: Array<{ productId: string; quantity: number; price: number; weight: string }>;
}) {
  await requireAdmin();

  // Resolve product names for the audit trail
  const productIds = data.items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const nameById = new Map(products.map(p => [p.id, p.name]));

  const order = await prisma.order.create({
    data: {
      total: data.total,
      status: "CONFIRMED",
      paymentMethod: "COD",
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingAddress: data.shippingAddress,
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

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return order;
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
