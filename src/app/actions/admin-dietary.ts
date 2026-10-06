'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth-guard';

export async function getDietaryTags() {
  return prisma.dietaryTag.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createDietaryTag(data: { name: string; slug: string; description?: string }) {
  await requirePermission('catalog.manage');
  const tag = await prisma.dietaryTag.create({
    data
  });
  revalidatePath('/admin/dietary');
  revalidatePath('/admin/products/new');
  return tag;
}

export async function deleteDietaryTag(id: string) {
  await requirePermission('catalog.manage');
  await prisma.dietaryTag.delete({
    where: { id }
  });
  revalidatePath('/admin/dietary');
}
