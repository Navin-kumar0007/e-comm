'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { transitionOrder } from '@/lib/order-status';
import { CUSTOMER_CANCELLABLE, RETURN_REASONS, type OrderStatus } from '@/lib/order-status-rules';
import { getStoreSettings } from '@/lib/store-settings';
import { logOrderEvent } from '@/lib/order-events';
import { sendReturnUpdate, notifyAdminReturnRequest } from '@/lib/email';

async function ownOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: 'Please sign in.' } as const;
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, email: true } });
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shipments: true, returnRequests: true } });
  if (!user || !order || order.userId !== user.id) return { error: 'Order not found.' } as const;
  return { user, order } as const;
}

export async function cancelMyOrderAction(orderId: string, reason: string) {
  const res = await ownOrder(orderId);
  if ('error' in res) return { error: res.error };
  const { user, order } = res;

  if (!CUSTOMER_CANCELLABLE.includes(order.status as OrderStatus)) {
    return { error: 'This order has already been shipped and can no longer be cancelled.' };
  }
  const pickedUp = order.shipments.some((s: any) => s.type === 'FORWARD' && !['CREATED', 'PICKUP_SCHEDULED', 'CANCELLED'].includes(s.status));
  if (pickedUp) return { error: 'This order has already been handed to the courier and can no longer be cancelled.' };

  const result = await transitionOrder(orderId, 'CANCELLED', {
    actor: `customer:${user.email}`,
    reason: `Cancelled by customer${reason.trim() ? `: ${reason.trim().slice(0, 200)}` : ''}`,
  });
  revalidatePath('/account/orders');
  return result.ok ? { success: true } : { error: result.error };
}

function isAllowedPhoto(url: unknown): url is string {
  return typeof url === 'string' && (/^\/uploads\/reviews\/review-[\w-]+\.(jpg|png|webp)$/.test(url) || url.startsWith('https://res.cloudinary.com/'));
}

export async function requestReturnAction(input: { orderId: string; reason: string; details: string; images?: string[] }) {
  const res = await ownOrder(input.orderId);
  if ('error' in res) return { error: res.error };
  const { user, order } = res;

  if (order.status !== 'DELIVERED') return { error: 'Returns can be requested only for delivered orders.' };
  if (!(input.reason in RETURN_REASONS)) return { error: 'Please choose a reason.' };
  const details = input.details.trim().slice(0, 1000);
  if (details.length < 10) return { error: 'Please describe the problem (at least 10 characters).' };
  const images = (input.images ?? []).filter(isAllowedPhoto).slice(0, 4);
  if (['DAMAGED', 'WRONG_ITEM', 'QUALITY'].includes(input.reason) && images.length === 0) {
    return { error: 'Please add at least one photo of the product and packaging.' };
  }

  const { returnWindowHours } = await getStoreSettings();
  const deliveredAt = order.deliveredAt ?? order.updatedAt;
  if (Date.now() - new Date(deliveredAt).getTime() > returnWindowHours * 60 * 60 * 1000) {
    return { error: `Return requests must be raised within ${returnWindowHours} hours of delivery. Please contact support.` };
  }
  if (order.returnRequests.some((r: any) => ['REQUESTED', 'APPROVED'].includes(r.status))) {
    return { error: 'You already have an open return request for this order.' };
  }

  await prisma.returnRequest.create({
    data: { orderId: order.id, userId: user.id, reason: input.reason, details, images: JSON.stringify(images) },
  });
  const label = RETURN_REASONS[input.reason as keyof typeof RETURN_REASONS];
  await logOrderEvent(null, { orderId: order.id, type: 'RETURN', message: `Return requested: ${label}`, actor: `customer:${user.email}` });

  try {
    await sendReturnUpdate(order.customerEmail, order.id, 'REQUESTED');
    await notifyAdminReturnRequest(order.id, order.customerName, label, details);
  } catch (e) {
    console.error('Return emails failed:', e);
  }

  revalidatePath('/account/orders');
  return { success: true };
}
