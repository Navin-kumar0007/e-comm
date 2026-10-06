'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import type { Permission } from '@/lib/permissions';
import { adjustStock, getStockHistory, StockError, type StockReason } from '@/lib/inventory';

async function actor(permission: Permission) {
  await requirePermission(permission);
  return staffActor();
}

export async function getInventory() {
  await requirePermission('inventory.manage');
  const products = await prisma.product.findMany({
    where: { status: { in: ['ACTIVE', 'DRAFT'] } },
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, status: true, stock: true, price: true, salePrice: true, costPrice: true, weight: true, lowStockThreshold: true,
      variants: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }], select: { id: true, label: true, stock: true, price: true, salePrice: true, costPrice: true } },
    },
  });
  return products;
}

const ADMIN_REASONS: StockReason[] = ['RESTOCK', 'DAMAGE', 'CORRECTION'];

export async function adjustInventoryAction(input: { productId: string; variantId?: string | null; delta: number; reason: StockReason; note?: string }) {
  const who = await actor('inventory.manage');
  const delta = Math.round(Number(input.delta));
  if (!ADMIN_REASONS.includes(input.reason)) return { error: 'Choose Restock, Damage or Correction.' };
  if (!delta) return { error: 'Enter a quantity.' };
  if (input.reason === 'RESTOCK' && delta < 0) return { error: 'Restock must add stock.' };
  if (input.reason === 'DAMAGE' && delta > 0) return { error: 'Damage must remove stock.' };
  try {
    const res = await prisma.$transaction((tx: any) =>
      adjustStock(tx, { productId: input.productId, variantId: input.variantId, delta, reason: input.reason, note: input.note, actor: who })
    );
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/products');
    return { success: true, balance: res?.balance };
  } catch (e) {
    if (e instanceof StockError) return { error: "Can't remove more than what's in stock." };
    throw e;
  }
}

export async function updateLowStockThresholdAction(productId: string, threshold: number) {
  await requirePermission('inventory.manage');
  await prisma.product.update({ where: { id: productId }, data: { lowStockThreshold: Math.max(0, Math.round(threshold)) } });
  revalidatePath('/admin/inventory');
  return { success: true };
}

export async function getStockHistoryAction(productId: string) {
  await requirePermission('inventory.manage');
  const rows = await getStockHistory(productId, 50);
  return rows.map((r: any) => ({ ...r, createdAt: r.createdAt.toISOString(), size: r.variant?.label ?? null }));
}
