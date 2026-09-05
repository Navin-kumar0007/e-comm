'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';

export async function awardPointsAction(userId: string, points: number) {
  await requireAdmin();
  
  await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: points } }
  });

  revalidatePath('/admin/points');
  return { success: true };
}
