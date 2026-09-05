'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';

export async function markSubscriptionDeliveredAction(id: string) {
  await requireAdmin();
  
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) throw new Error("Subscription not found");

  // Push the next delivery date forward by 1 month
  const nextDate = new Date(subscription.nextDeliveryDate);
  nextDate.setMonth(nextDate.getMonth() + 1);

  await prisma.subscription.update({
    where: { id },
    data: { nextDeliveryDate: nextDate }
  });

  revalidatePath('/admin/subscriptions');
  return { success: true };
}

export async function cancelSubscriptionAction(id: string) {
  await requireAdmin();
  await prisma.subscription.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
  revalidatePath('/admin/subscriptions');
  return { success: true };
}
