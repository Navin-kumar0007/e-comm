'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';

export async function getDietaryTags() {
  return prisma.dietaryTag.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createDietaryTag(data: { name: string; slug: string; description?: string }) {
  await requireAdmin();
  const tag = await prisma.dietaryTag.create({
    data
  });
  revalidatePath('/admin/dietary');
  revalidatePath('/admin/products/new');
  return tag;
}

export async function deleteDietaryTag(id: string) {
  await requireAdmin();
  await prisma.dietaryTag.delete({
    where: { id }
  });
  revalidatePath('/admin/dietary');
}
