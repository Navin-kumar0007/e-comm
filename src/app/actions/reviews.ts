'use server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addReview(productId: string, rating: number, comment: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: 'Unauthorized' };

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: 'User not found' };

    await prisma.review.create({
      data: {
        rating,
        comment,
        productId,
        userId: user.id,
        status: 'APPROVED', // Auto-approving for demo purposes
      }
    });

    revalidatePath(`/product/[slug]`, 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Review error:', error);
    return { error: 'Failed to submit review' };
  }
}

export async function getReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, status: 'APPROVED' },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
}
