'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth-guard';

export async function getAdminReviews(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' = 'PENDING') {
  await requirePermission('reviews.moderate');
  const [rows, counts] = await Promise.all([
    prisma.review.findMany({
      where: status === 'ALL' ? {} : { status },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } } },
    }),
    prisma.review.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  return {
    reviews: rows.map((r: any) => ({
      ...r,
      images: (() => { try { return JSON.parse(r.images || '[]'); } catch { return []; } })(),
    })),
    counts: Object.fromEntries(counts.map((c: any) => [c.status, c._count._all])) as Record<string, number>,
  };
}

async function touchProduct(reviewId: string) {
  const r = await prisma.review.findUnique({ where: { id: reviewId }, select: { product: { select: { slug: true } } } });
  if (r?.product?.slug) revalidatePath(`/product/${r.product.slug}`);
  revalidatePath('/admin/reviews');
}

export async function setReviewStatusAction(id: string, status: 'APPROVED' | 'REJECTED') {
  await requirePermission('reviews.moderate');
  await prisma.review.update({ where: { id }, data: { status } });
  await touchProduct(id);
  return { success: true };
}

export async function deleteReviewAction(id: string) {
  await requirePermission('reviews.moderate');
  await touchProduct(id);
  await prisma.review.delete({ where: { id } });
  return { success: true };
}
