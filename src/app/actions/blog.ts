'use server';
import { prisma } from '@/lib/db/prisma';

export async function getBlogPosts() {
  return prisma.blogPost.findMany({
    where: { published: true },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getBlogPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: { author: { select: { name: true } } }
  });
}
