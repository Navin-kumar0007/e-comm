'use server';
import { prisma } from '@/lib/db/prisma';

export async function getProductsByIds(ids: string[]) {
  const rawProducts = await prisma.product.findMany({
    where: { id: { in: ids } }
  });
  return rawProducts.map(p => ({
    ...p,
    images: JSON.parse(p.images),
    tags: p.tags ? p.tags.split(',') : [],
    weight: p.weight || undefined
  }));
}
