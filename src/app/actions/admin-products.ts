'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';

export async function getAdminProducts() {
  await requireAdmin();
  return await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  
  // Clean up relations to avoid foreign key constraint violations
  await prisma.$transaction(async (tx) => {
    // 1. Delete associated order items
    await tx.orderItem.deleteMany({ where: { productId: id } });
    // 2. Clean up any orders that are now completely empty
    await tx.order.deleteMany({ where: { items: { none: {} } } });
    // 3. Delete reviews and price alerts
    await tx.review.deleteMany({ where: { productId: id } });
    await tx.priceAlert.deleteMany({ where: { productId: id } });
    // 4. Finally delete the product
    await tx.product.delete({ where: { id } });
  });

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { success: true };
}

export async function bulkDeleteProductsAction(ids: string[]) {
  await requireAdmin();

  // Clean up relations to avoid foreign key constraint violations
  await prisma.$transaction(async (tx) => {
    // 1. Delete associated order items
    await tx.orderItem.deleteMany({ where: { productId: { in: ids } } });
    // 2. Clean up any orders that are now completely empty
    await tx.order.deleteMany({ where: { items: { none: {} } } });
    // 3. Delete reviews and price alerts
    await tx.review.deleteMany({ where: { productId: { in: ids } } });
    await tx.priceAlert.deleteMany({ where: { productId: { in: ids } } });
    // 4. Finally delete the products
    await tx.product.deleteMany({ where: { id: { in: ids } } });
  });

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { success: true };
}

export async function updateProductStatusAction(id: string, status: string) {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: { status }
  });
  revalidatePath('/admin/products');
  return { success: true };
}

export async function bulkUpdateProductStatusAction(ids: string[], status: string) {
  await requireAdmin();
  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { status }
  });
  revalidatePath('/admin/products');
  return { success: true };
}

export async function createProductAction(data: any) {
  await requireAdmin();
  const { dietaryTagIds, labelSettings, ...restData } = data;
  
  const product = await prisma.product.create({
    data: {
      ...restData,
      salePrice: restData.salePrice || null,
      mrp: restData.mrp ? parseFloat(restData.mrp) : null,
      weight: restData.weight || null,
      images: JSON.stringify(restData.images || []),
      tags: restData.tags ? restData.tags.join(',') : '',
      labelSettings: labelSettings ? JSON.stringify(labelSettings) : null,
      dietaryTags: {
        connect: dietaryTagIds?.map((id: string) => ({ id })) || []
      }
    }
  });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return product;
}

export async function updateProductAction(id: string, data: any) {
  await requireAdmin();
  const { dietaryTagIds, labelSettings, ...restData } = data;
  
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...restData,
      salePrice: restData.salePrice || null,
      mrp: restData.mrp ? parseFloat(restData.mrp) : null,
      weight: restData.weight || null,
      images: JSON.stringify(restData.images || []),
      tags: restData.tags ? restData.tags.join(',') : '',
      labelSettings: labelSettings ? JSON.stringify(labelSettings) : null,
      dietaryTags: {
        set: [],
        connect: dietaryTagIds?.map((id: string) => ({ id })) || []
      }
    }
  });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return product;
}
