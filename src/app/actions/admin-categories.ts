'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';

export async function getAdminCategories() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image || null,
    productsCount: c._count.products,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function createCategoryAction(data: {
  name: string;
  slug: string;
  description: string;
  image?: string;
}) {
  await requireAdmin();

  // Ensure slug uniqueness
  const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const existing = await prisma.category.findUnique({ where: { slug: cleanSlug } });
  if (existing) {
    throw new Error('A category with this slug already exists.');
  }

  const category = await prisma.category.create({
    data: {
      name: data.name.trim(),
      slug: cleanSlug,
      description: data.description.trim(),
      image: data.image?.trim() || null,
    }
  });

  revalidatePath('/admin/categories');
  revalidatePath('/shop');
  revalidatePath('/');
  return category;
}

export async function updateCategoryAction(id: string, data: {
  name: string;
  slug: string;
  description: string;
  image?: string;
}) {
  await requireAdmin();

  const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  
  // Check if slug is used by another category
  const existing = await prisma.category.findUnique({ where: { slug: cleanSlug } });
  if (existing && existing.id !== id) {
    throw new Error('A category with this slug already exists.');
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name.trim(),
      slug: cleanSlug,
      description: data.description.trim(),
      image: data.image?.trim() || null,
    }
  });

  revalidatePath('/admin/categories');
  revalidatePath('/shop');
  revalidatePath('/');
  return category;
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();

  // Check if any products belong to this category
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error(`Cannot delete category: it has ${productCount} active product(s) assigned to it. Reassign or delete the products first.`);
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath('/admin/categories');
  revalidatePath('/shop');
  revalidatePath('/');
  return { success: true };
}
