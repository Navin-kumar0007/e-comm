'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';

function mapPrismaStatusToUI(status: string) {
  const m: Record<string, string> = {
    'PENDING': 'Pending',
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
    items: o.items.map(item => ({
      name: item.product.name,
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
  const order = await prisma.order.update({
    where: { id },
    data: { status: status.toUpperCase() }
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

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteOrderAction(id: string) {
  await requireAdmin();
  await prisma.order.delete({ where: { id } });
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
  const order = await prisma.order.create({
    data: {
      total: data.total,
      status: "CONFIRMED",
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingAddress: data.shippingAddress,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          weight: item.weight
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
