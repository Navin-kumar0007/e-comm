'use server'

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function toggleUserSubscriptionAction(id: string, newStatus: 'ACTIVE' | 'CANCELLED') {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub || sub.userId !== user.id) throw new Error("Subscription not found or unauthorized");

  await prisma.subscription.update({
    where: { id },
    data: { status: newStatus }
  });

  revalidatePath('/account/subscriptions');
  return { success: true };
}
