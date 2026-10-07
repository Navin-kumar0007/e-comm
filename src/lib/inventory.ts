import { prisma } from "@/lib/db/prisma";
import { allocatePackLots, returnPackLots } from "@/lib/wms";

import type { StockReason } from "@/lib/inventory-labels";
export { STOCK_REASON_LABELS, type StockReason } from "@/lib/inventory-labels";

/** Message is safe to show to customers/admins. */
export class StockError extends Error {}

export interface StockChange {
  productId: string;
  variantId?: string | null;
  delta: number;
  reason: StockReason;
  actor: string;
  orderId?: string | null;
  note?: string | null;
  /** Allow going below zero (e.g. re-reserving for a late payment). */
  force?: boolean;
  /** Take from this batch first (e.g. writing off an expired batch). */
  lotId?: string | null;
}

const RETURN_REASONS = new Set<StockReason>(["RELEASE", "CANCEL_RESTOCK", "RTO_RESTOCK"]);

export interface StockResult {
  productId: string;
  variantId: string | null;
  name: string;
  balance: number;
  threshold: number;
  crossedLow: boolean;
}

/**
 * Applies one stock change inside a transaction and records it.
 * Decrements are guarded so stock can't go negative (two buyers, one unit).
 * For products with sizes, the variant and the product total move together.
 */
export async function adjustStock(tx: any, change: StockChange): Promise<StockResult | null> {
  const { productId, delta } = change;
  if (!productId || productId.startsWith("custom-") || delta === 0) return null;
  const variantId = change.variantId || null;
  const guard = delta < 0 && !change.force;

  if (variantId) {
    const res = await tx.productVariant.updateMany({
      where: { id: variantId, productId, ...(guard ? { stock: { gte: -delta } } : {}) },
      data: { stock: { increment: delta } },
    });
    if (res.count === 0) throw new StockError("Not enough stock for this size.");
    await tx.product.update({ where: { id: productId }, data: { stock: { increment: delta } } });
  } else {
    const res = await tx.product.updateMany({
      where: { id: productId, ...(guard ? { stock: { gte: -delta } } : {}) },
      data: { stock: { increment: delta } },
    });
    if (res.count === 0) throw new StockError("Not enough stock.");
  }

  const product = await tx.product.findUnique({ where: { id: productId }, select: { name: true, stock: true, lowStockThreshold: true } });
  const variant = variantId ? await tx.productVariant.findUnique({ where: { id: variantId }, select: { label: true, stock: true } }) : null;
  const balance = variant ? variant.stock : product.stock;

  const movement = await tx.stockMovement.create({
    data: {
      productId,
      variantId,
      delta,
      balanceAfter: balance,
      reason: change.reason,
      orderId: change.orderId ?? null,
      note: change.note?.slice(0, 300) ?? null,
      actor: change.actor,
    },
  });

  // Batches: units out come from the earliest-expiring batch; units returned go back where they came from.
  if (delta < 0) {
    await allocatePackLots(tx, { productId, variantId, qty: -delta, orderId: change.orderId, movementId: movement.id, lotId: change.lotId });
  } else if (change.orderId && RETURN_REASONS.has(change.reason)) {
    await returnPackLots(tx, { productId, variantId, qty: delta, orderId: change.orderId });
  }

  const threshold = product.lowStockThreshold ?? 10;
  return {
    productId,
    variantId,
    name: variant ? `${product.name} (${variant.label})` : product.name,
    balance,
    threshold,
    crossedLow: delta < 0 && balance <= threshold && balance - delta > threshold,
  };
}

/** Sets an absolute stock level (admin edits), recording the difference. */
export async function setStockLevel(
  tx: any,
  params: { productId: string; variantId?: string | null; newStock: number; reason: StockReason; actor: string; note?: string }
) {
  const target = Math.max(0, Math.round(params.newStock));
  const current = params.variantId
    ? (await tx.productVariant.findUnique({ where: { id: params.variantId }, select: { stock: true } }))?.stock
    : (await tx.product.findUnique({ where: { id: params.productId }, select: { stock: true } }))?.stock;
  if (current === undefined || current === null) return null;
  return adjustStock(tx, { ...params, delta: target - current, force: true });
}

/** Keeps Product.price/salePrice/mrp/weight/stock in line with its default size. */
export async function syncProductFromVariants(tx: any, productId: string) {
  const variants = await tx.productVariant.findMany({
    where: { productId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
  });
  if (variants.length === 0) return;
  const d = variants[0];
  await tx.product.update({
    where: { id: productId },
    data: {
      price: d.price,
      salePrice: d.salePrice,
      mrp: d.mrp,
      weight: d.label,
      stock: variants.reduce((sum: number, v: any) => sum + v.stock, 0),
    },
  });
}

/** Emails the admin about items that just dropped to/below their low-stock level. */
export async function notifyLowStock(results: Array<StockResult | null>) {
  const low = results.filter((r): r is StockResult => !!r && r.crossedLow);
  if (low.length === 0) return;
  try {
    const { notifyAdminLowStock } = await import("@/lib/email");
    await notifyAdminLowStock(low.map((l) => ({ name: l.name, stock: l.balance, threshold: l.threshold })));
  } catch (e) {
    console.error("[INVENTORY] Low stock alert failed:", e);
  }
}

export async function getStockHistory(productId: string, take = 50) {
  return prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take,
    include: { variant: { select: { label: true } } },
  });
}
