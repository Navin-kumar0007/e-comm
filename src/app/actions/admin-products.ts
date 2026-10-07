'use server';

import { sendWhatsAppMessage, buildPriceDropWhatsAppMessage } from "@/lib/whatsapp";

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import type { Permission } from '@/lib/permissions';
import { adjustStock, setStockLevel, syncProductFromVariants } from '@/lib/inventory';

async function adminActor(permission: Permission) {
  await requirePermission(permission);
  return staffActor();
}

export async function getAdminProducts() {
  await requirePermission('catalog.manage');
  return await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function deleteProductAction(id: string) {
  await requirePermission('catalog.manage');
  
  // Protect customer order history and tax records
  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
  
  if (orderItemCount > 0) {
    // Soft Archive: product remains in past orders, but is removed from catalog & set to 0 stock
    await prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED', stock: 0 }
    });
  } else {
    // No past orders: safe hard delete
    await prisma.$transaction(async (tx: any) => {
      await tx.review.deleteMany({ where: { productId: id } });
      await tx.priceAlert.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });
  }

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { success: true };
}

export async function bulkDeleteProductsAction(ids: string[]) {
  await requirePermission('catalog.manage');

  for (const id of ids) {
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      await prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED', stock: 0 }
      });
    } else {
      await prisma.$transaction(async (tx: any) => {
        await tx.review.deleteMany({ where: { productId: id } });
        await tx.priceAlert.deleteMany({ where: { productId: id } });
        await tx.product.delete({ where: { id } });
      });
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { success: true };
}

export async function updateProductStatusAction(id: string, status: string) {
  await requirePermission('catalog.manage');
  await prisma.product.update({
    where: { id },
    data: { status }
  });
  revalidatePath('/admin/products');
  return { success: true };
}

export async function bulkUpdateProductStatusAction(ids: string[], status: string) {
  await requirePermission('catalog.manage');
  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { status }
  });
  revalidatePath('/admin/products');
  return { success: true };
}

export async function createProductAction(data: any) {
  const actor = await adminActor('catalog.manage');
  const { dietaryTagIds, labelSettings, stock: openingStock, ...restData } = data;

  const product = await prisma.$transaction(async (tx: any) => {
   const created = await tx.product.create({
    data: {
      ...restData,
      stock: 0,
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
   if (Number(openingStock) > 0) {
     await adjustStock(tx, { productId: created.id, delta: Math.round(Number(openingStock)), reason: 'OPENING', actor });
   }
   return created;
  });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return product;
}

export async function updateProductAction(id: string, data: any) {
  const actor = await adminActor('catalog.manage');
  const { dietaryTagIds, labelSettings, stock: newStock, ...restData } = data;
  if (restData.hsnCode != null && restData.hsnCode !== "" && !/^\d{4,8}$/.test(String(restData.hsnCode))) {
    throw new Error("HSN code must be 4 to 8 digits");
  }
  if (restData.gstRate != null && !(Number(restData.gstRate) >= 0 && Number(restData.gstRate) <= 40)) {
    throw new Error("GST rate must be between 0 and 40%");
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { price: true, salePrice: true, name: true, slug: true, _count: { select: { variants: { where: { isActive: true } } } } },
  });
  const hasSizes = (existing?._count?.variants ?? 0) > 0;

  // Products with sizes take price/sale/MRP/weight from their default size.
  const { price, salePrice, mrp, weight, ...otherData } = restData;
  const priceFields = hasSizes
    ? {}
    : { price, salePrice: salePrice || null, mrp: mrp ? parseFloat(mrp) : null, weight: weight || null };

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...otherData,
      ...priceFields,
      images: JSON.stringify(restData.images || []),
      tags: restData.tags ? restData.tags.join(',') : '',
      labelSettings: labelSettings ? JSON.stringify(labelSettings) : null,
      dietaryTags: {
        set: [],
        connect: dietaryTagIds?.map((id: string) => ({ id })) || []
      }
    }
  });

  await prisma.$transaction(async (tx: any) => {
    if (hasSizes) {
      // Price & stock of products with sizes are managed per size.
      await syncProductFromVariants(tx, id);
    } else if (newStock !== undefined && Number.isFinite(Number(newStock))) {
      await setStockLevel(tx, { productId: id, newStock: Number(newStock), reason: 'CORRECTION', actor, note: 'Edited on product form' });
    }
  });

  // Automated WhatsApp Price Drop Notification Trigger
  if (existing) {
    const oldPrice = existing.salePrice || existing.price;
    const newPrice = product.salePrice || product.price;

    if (newPrice < oldPrice) {
      (async () => {
        try {
          const alerts = await prisma.priceAlert.findMany({
            where: { productId: id, active: true },
          });

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spicynuts.in";
          const msg = buildPriceDropWhatsAppMessage({
            productName: product.name,
            oldPrice,
            newPrice,
            productUrl: `${siteUrl}/product/${product.slug}`,
          });

          for (const a of alerts) {
            if (a.phone) {
              await sendWhatsAppMessage({
                to: a.phone,
                message: msg,
                type: "PRICE_UPDATE",
                template: { key: "price_drop", params: [product.name, newPrice, oldPrice, `${siteUrl}/product/${product.slug}`] },
              });
            }
          }
        } catch (e) {
          console.error("Automated WhatsApp Price Drop failed:", e);
        }
      })();
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return product;
}

export async function updateProductQuickAction(id: string, data: { stock: number, salePrice: number | null }) {
  const actor = await adminActor('catalog.manage');
  const sizes = await prisma.productVariant.count({ where: { productId: id, isActive: true } });
  if (sizes > 0) return { error: 'This product has sizes — edit stock and price per size on the product page.' };
  await prisma.$transaction(async (tx: any) => {
    await tx.product.update({ where: { id }, data: { salePrice: data.salePrice } });
    await setStockLevel(tx, { productId: id, newStock: data.stock, reason: 'CORRECTION', actor, note: 'Quick edit' });
  });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { success: true };
}

export async function getProductVariantsAction(productId: string) {
  await requirePermission('catalog.manage');
  return prisma.productVariant.findMany({ where: { productId, isActive: true }, orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }] });
}

/**
 * Saves the pack sizes of a product. Removed sizes that appear in past orders
 * are deactivated (kept for history); others are deleted. Stock changes are
 * logged as corrections. Product price/stock then mirror the default (first) size.
 */
export async function saveProductVariantsAction(
  productId: string,
  rows: Array<{ id?: string; label: string; price: number; salePrice?: number | null; mrp?: number | null; costPrice?: number | null; stock: number; sku?: string | null }>
) {
  const actor = await adminActor('catalog.manage');
  const clean = rows
    .map((r, i) => ({
      ...r,
      label: String(r.label ?? '').trim().slice(0, 40),
      price: Number(r.price),
      salePrice: r.salePrice ? Number(r.salePrice) : null,
      mrp: r.mrp ? Number(r.mrp) : null,
      costPrice: r.costPrice ? Number(r.costPrice) : null,
      stock: Math.max(0, Math.round(Number(r.stock) || 0)),
      sku: r.sku?.trim() || null,
      sortOrder: i,
    }))
    .filter((r) => r.label);
  if (clean.some((r) => !(r.price > 0))) return { error: 'Every size needs a price above ₹0.' };
  if (clean.some((r) => r.salePrice !== null && r.salePrice >= r.price)) return { error: 'Sale price must be lower than the regular price.' };
  if (new Set(clean.map((r) => r.label.toLowerCase())).size !== clean.length) return { error: 'Size labels must be unique.' };

  await prisma.$transaction(async (tx: any) => {
    const existing = await tx.productVariant.findMany({ where: { productId, isActive: true } });
    const keep = new Set(clean.filter((r) => r.id).map((r) => r.id));

    for (const v of existing) {
      if (keep.has(v.id)) continue;
      if (v.stock !== 0) await setStockLevel(tx, { productId, variantId: v.id, newStock: 0, reason: 'CORRECTION', actor, note: `Size ${v.label} removed` });
      const used = await tx.orderItem.count({ where: { variantId: v.id } });
      if (used > 0) await tx.productVariant.update({ where: { id: v.id }, data: { isActive: false } });
      else await tx.productVariant.delete({ where: { id: v.id } });
    }

    const hadSizes = existing.length > 0;
    if (!hadSizes && clean.length > 0) {
      // Switching to per-size stock: the old single stock figure is replaced by the sizes below.
      await setStockLevel(tx, { productId, newStock: 0, reason: 'CORRECTION', actor, note: 'Stock now tracked per size' });
    }
    for (const r of clean) {
      const fields = { label: r.label, price: r.price, salePrice: r.salePrice, mrp: r.mrp, costPrice: r.costPrice, sku: r.sku, sortOrder: r.sortOrder };
      if (r.id && existing.some((v: any) => v.id === r.id)) {
        await tx.productVariant.update({ where: { id: r.id }, data: fields });
        await setStockLevel(tx, { productId, variantId: r.id, newStock: r.stock, reason: 'CORRECTION', actor, note: 'Edited sizes' });
      } else {
        const created = await tx.productVariant.create({ data: { ...fields, productId, stock: 0 } });
        if (r.stock > 0) {
          await adjustStock(tx, { productId, variantId: created.id, delta: r.stock, reason: hadSizes ? 'RESTOCK' : 'OPENING', actor, note: `New size ${r.label}` });
        }
      }
    }

    if (clean.length > 0) {
      await syncProductFromVariants(tx, productId);
    }
  }, { timeout: 15000, maxWait: 5000 });

  revalidatePath(`/admin/products/edit/${productId}`);
  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/shop');
  return { success: true };
}
