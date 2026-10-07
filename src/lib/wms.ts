import { prisma } from "@/lib/db/prisma";
import {
  planFefo, weightedAvgCost, round2, round3, reorderSuggestion, expiryStatus, istParts, formatLotNumber, formatDocNumber,
} from "@/lib/wms-core";

// Every function taking `tx` runs inside the caller's transaction.

/** PO-2026-0001, RP-2026-0001, SC-2026-0001: one running number per prefix per year. */
export async function nextDocNumber(tx: any, prefix: "PO" | "RP" | "SC", now = new Date()) {
  const { year } = istParts(now);
  const id = `${prefix}_${year}`;
  const c = await tx.invoiceCounter.upsert({ where: { id }, create: { id, seq: 1 }, update: { seq: { increment: 1 } } });
  return formatDocNumber(prefix, year, c.seq);
}

/** Batch code for a new lot, e.g. B2610-007 (year-month + running number). */
export async function nextLotNumber(tx: any, now = new Date()) {
  const { year, month } = istParts(now);
  const id = `LOT_${year}${String(month).padStart(2, "0")}`;
  const c = await tx.invoiceCounter.upsert({ where: { id }, create: { id, seq: 1 }, update: { seq: { increment: 1 } } });
  return formatLotNumber(now, c.seq);
}

/** Takes sold / removed packs out of batches, earliest expiry first, and records which batch they came from. */
export async function allocatePackLots(
  tx: any,
  p: { productId: string; variantId: string | null; qty: number; orderId?: string | null; movementId?: string | null; lotId?: string | null }
) {
  const where = { kind: "PACK", productId: p.productId, variantId: p.variantId, qtyLeft: { gt: 0 } };
  let lots = await tx.stockLot.findMany({ where, select: { id: true, qtyLeft: true, expiryDate: true, receivedAt: true, unitCost: true } });
  if (p.lotId) {
    // A chosen batch first (e.g. writing off an expired batch), then the usual order.
    const chosen = lots.filter((l: any) => l.id === p.lotId);
    lots = chosen.length ? [{ ...chosen[0], expiryDate: new Date(0) }, ...lots.filter((l: any) => l.id !== p.lotId)] : lots;
  }
  const { takes } = planFefo(lots, p.qty);
  for (const { lot, take } of takes) {
    const res = await tx.stockLot.updateMany({ where: { id: lot.id, qtyLeft: { gte: take } }, data: { qtyLeft: { decrement: take } } });
    if (res.count === 0) continue; // changed underneath us; the units stay unassigned rather than failing the sale
    await tx.lotAllocation.create({
      data: { lotId: lot.id, orderId: p.orderId ?? null, movementId: p.movementId ?? null, qty: take, unitCost: (lot as any).unitCost ?? 0 },
    });
  }
}

/** Puts units from a cancelled / returned order back into the batches they were taken from. */
export async function returnPackLots(tx: any, p: { productId: string; variantId: string | null; qty: number; orderId: string }) {
  const allocations = await tx.lotAllocation.findMany({
    where: { orderId: p.orderId, qty: { gt: 0 }, lot: { productId: p.productId, variantId: p.variantId } },
    orderBy: { createdAt: "desc" },
  });
  let left = p.qty;
  for (const a of allocations) {
    if (left <= 0) break;
    const back = Math.min(a.qty, left);
    await tx.lotAllocation.update({ where: { id: a.id }, data: { qty: { decrement: back } } });
    await tx.stockLot.update({ where: { id: a.lotId }, data: { qtyLeft: { increment: back } } });
    left -= back;
  }
}

/** Adds bulk material: moves stock, re-averages cost, records a movement and (optionally) a batch. */
export async function receiveMaterial(
  tx: any,
  p: {
    materialId: string; qty: number; unitCost: number; reason: "PURCHASE" | "OPENING" | "CORRECTION"; actor: string;
    refId?: string | null; note?: string | null; supplierId?: string | null; poId?: string | null;
    expiryDate?: Date | null; mfgDate?: Date | null; lotNumber?: string | null;
  }
) {
  const m = await tx.material.findUnique({ where: { id: p.materialId } });
  if (!m) throw new Error("Material not found");
  const stockQty = round3(m.stockQty + p.qty);
  await tx.material.update({ where: { id: m.id }, data: { stockQty, avgCost: weightedAvgCost(m.stockQty, m.avgCost, p.qty, p.unitCost) } });
  const lot = await tx.stockLot.create({
    data: {
      lotNumber: p.lotNumber || (await nextLotNumber(tx)), kind: "MATERIAL", materialId: m.id, supplierId: p.supplierId ?? null, poId: p.poId ?? null,
      qtyIn: p.qty, qtyLeft: p.qty, unitCost: p.unitCost, mfgDate: p.mfgDate ?? null, expiryDate: p.expiryDate ?? null,
      source: p.reason === "PURCHASE" ? "PURCHASE" : "OPENING", note: p.note ?? null, actor: p.actor,
    },
  });
  await tx.materialMovement.create({
    data: { materialId: m.id, lotId: lot.id, delta: p.qty, balanceAfter: stockQty, reason: p.reason, refId: p.refId ?? null, note: p.note ?? null, actor: p.actor },
  });
  return lot;
}

/**
 * Takes bulk material out (repacking, wastage, count correction), earliest expiry first.
 * Returns the batches used and the earliest expiry among them.
 */
export async function consumeMaterial(
  tx: any,
  p: { materialId: string; qty: number; reason: "REPACK" | "WASTAGE" | "CORRECTION"; actor: string; refId?: string | null; note?: string | null; allowShort?: boolean }
) {
  const m = await tx.material.findUnique({ where: { id: p.materialId } });
  if (!m) throw new Error("Material not found");
  if (!p.allowShort && m.stockQty + 1e-6 < p.qty) throw new MaterialShortError(`Only ${round3(m.stockQty)} ${m.unit} of ${m.name} in stock.`);
  const lots = await tx.stockLot.findMany({ where: { kind: "MATERIAL", materialId: m.id, qtyLeft: { gt: 0 } } });
  const { takes } = planFefo(lots, p.qty);
  for (const { lot, take } of takes) {
    await tx.stockLot.update({ where: { id: lot.id }, data: { qtyLeft: { decrement: take } } });
  }
  const stockQty = round3(m.stockQty - p.qty);
  await tx.material.update({ where: { id: m.id }, data: { stockQty } });
  await tx.materialMovement.create({
    data: { materialId: m.id, delta: -p.qty, balanceAfter: stockQty, reason: p.reason, refId: p.refId ?? null, note: p.note ?? null, actor: p.actor },
  });
  const expiries = takes.map((t) => t.lot.expiryDate).filter(Boolean).map((d) => new Date(d as any).getTime());
  return {
    used: takes.map((t) => ({ lotId: t.lot.id, lotNumber: (t.lot as any).lotNumber as string, qty: t.take, unitCost: (t.lot as any).unitCost as number })),
    earliestExpiry: expiries.length ? new Date(Math.min(...expiries)) : null,
    material: m,
  };
}

export class MaterialShortError extends Error {}

/** Creates a batch of finished packs (from a purchase, repacking or opening stock). Does not move the stock count. */
export async function createPackLot(
  tx: any,
  p: {
    productId: string; variantId: string | null; qty: number; unitCost: number; source: "PURCHASE" | "REPACK" | "OPENING"; actor: string;
    supplierId?: string | null; poId?: string | null; repackRunId?: string | null; mfgDate?: Date | null; expiryDate?: Date | null; note?: string | null;
    lotNumber?: string | null;
  }
) {
  return tx.stockLot.create({
    data: {
      lotNumber: p.lotNumber || (await nextLotNumber(tx)), kind: "PACK", productId: p.productId, variantId: p.variantId,
      supplierId: p.supplierId ?? null, poId: p.poId ?? null, repackRunId: p.repackRunId ?? null,
      qtyIn: p.qty, qtyLeft: p.qty, unitCost: p.unitCost, mfgDate: p.mfgDate ?? null, expiryDate: p.expiryDate ?? null,
      source: p.source, note: p.note ?? null, actor: p.actor,
    },
  });
}

/** Re-averages the purchase cost of a product / pack size after new stock arrives. */
export async function updatePackCost(tx: any, p: { productId: string; variantId: string | null; addQty: number; addCost: number; stockBefore: number }) {
  if (p.variantId) {
    const v = await tx.productVariant.findUnique({ where: { id: p.variantId }, select: { costPrice: true } });
    const cost = weightedAvgCost(p.stockBefore, v?.costPrice ?? p.addCost, p.addQty, p.addCost);
    await tx.productVariant.update({ where: { id: p.variantId }, data: { costPrice: cost } });
  } else {
    const prod = await tx.product.findUnique({ where: { id: p.productId }, select: { costPrice: true } });
    const cost = weightedAvgCost(p.stockBefore, prod?.costPrice ?? p.addCost, p.addQty, p.addCost);
    await tx.product.update({ where: { id: p.productId }, data: { costPrice: cost } });
  }
}

export interface SellableUnit {
  key: string; // productId or productId:variantId
  productId: string;
  variantId: string | null;
  name: string;
  pack: string;
  stock: number;
  costPrice: number | null;
  price: number;
  threshold: number;
  status: string;
}

/** Every product / pack size we sell, with stock and cost. */
export async function getSellableUnits(): Promise<SellableUnit[]> {
  const products = await prisma.product.findMany({
    where: { status: { in: ["ACTIVE", "DRAFT"] } },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, weight: true, stock: true, costPrice: true, price: true, salePrice: true, lowStockThreshold: true, status: true,
      variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { price: "asc" }], select: { id: true, label: true, stock: true, costPrice: true, price: true, salePrice: true } },
    },
  });
  const units: SellableUnit[] = [];
  for (const p of products as any[]) {
    if (p.variants.length) {
      for (const v of p.variants) {
        units.push({ key: `${p.id}:${v.id}`, productId: p.id, variantId: v.id, name: p.name, pack: v.label, stock: v.stock, costPrice: v.costPrice ?? p.costPrice, price: v.salePrice ?? v.price, threshold: p.lowStockThreshold, status: p.status });
      }
    } else {
      units.push({ key: p.id, productId: p.id, variantId: null, name: p.name, pack: p.weight || "Standard", stock: p.stock, costPrice: p.costPrice, price: p.salePrice ?? p.price, threshold: p.lowStockThreshold, status: p.status });
    }
  }
  return units;
}

/** Stock value, expiring batches and what to reorder: the warehouse overview. */
export async function getWarehouseOverview(now = new Date()) {
  const since = new Date(now.getTime() - 30 * 864e5);
  const [units, materials, packLots, materialLots, sales, openPOs, recentRepacks, suppliers] = await Promise.all([
    getSellableUnits(),
    prisma.material.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.stockLot.findMany({ where: { kind: "PACK", qtyLeft: { gt: 0 } }, include: { product: { select: { name: true } }, variant: { select: { label: true } } } }),
    prisma.stockLot.findMany({ where: { kind: "MATERIAL", qtyLeft: { gt: 0 } }, include: { material: { select: { name: true, unit: true } } } }),
    prisma.stockMovement.groupBy({ by: ["productId", "variantId"], where: { reason: { in: ["SALE", "ADMIN_ORDER"] }, createdAt: { gte: since } }, _sum: { delta: true } }),
    prisma.purchaseOrder.findMany({ where: { status: { in: ["ORDERED", "PARTIAL"] } }, include: { supplier: { select: { name: true } } }, orderBy: { expectedDate: "asc" } }),
    prisma.repackRun.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { material: { select: { name: true } } } }),
    prisma.supplier.findMany({ where: { isActive: true }, select: { leadDays: true } }),
  ]);

  const soldBy = new Map<string, number>();
  for (const s of sales as any[]) soldBy.set(s.variantId ? `${s.productId}:${s.variantId}` : s.productId, -(s._sum.delta ?? 0));
  const leadDays = suppliers.length ? Math.round(suppliers.reduce((a: number, s: any) => a + s.leadDays, 0) / suppliers.length) : 7;

  // Value: batches at their own cost, stock not yet in a batch at the item's average cost.
  const lotQtyBy = new Map<string, { qty: number; value: number }>();
  for (const l of packLots as any[]) {
    const key = l.variantId ? `${l.productId}:${l.variantId}` : l.productId;
    const cur = lotQtyBy.get(key) ?? { qty: 0, value: 0 };
    cur.qty += l.qtyLeft;
    cur.value += l.qtyLeft * l.unitCost;
    lotQtyBy.set(key, cur);
  }
  let packValue = 0;
  let packUnits = 0;
  let unassigned = 0;
  let noCost = 0;
  const reorder = [];
  for (const u of units) {
    const lots = lotQtyBy.get(u.key) ?? { qty: 0, value: 0 };
    const loose = Math.max(0, u.stock - lots.qty);
    unassigned += loose;
    if (loose > 0 && !u.costPrice) noCost++;
    packValue += lots.value + loose * (u.costPrice ?? 0);
    packUnits += Math.max(0, u.stock);
    if (u.status !== "ACTIVE") continue;
    const sold = soldBy.get(u.key) ?? 0;
    const r = reorderSuggestion({ stock: u.stock, sold, leadDays, threshold: u.threshold });
    if (r.status === "OUT" || r.status === "REORDER") reorder.push({ ...u, sold, ...r });
  }
  reorder.sort((a, b) => (a.daysLeft ?? -1) - (b.daysLeft ?? -1));

  const materialValue = materials.reduce((s: number, m: any) => s + Math.max(0, m.stockQty) * m.avgCost, 0);
  const lowMaterials = materials.filter((m: any) => m.reorderLevel > 0 && m.stockQty <= m.reorderLevel);

  const expiring = [
    ...(packLots as any[]).map((l) => ({ id: l.id, lotNumber: l.lotNumber, name: l.product?.name ?? "—", pack: l.variant?.label ?? "", qtyLeft: l.qtyLeft, unit: "packs", expiryDate: l.expiryDate, value: l.qtyLeft * l.unitCost })),
    ...(materialLots as any[]).map((l) => ({ id: l.id, lotNumber: l.lotNumber, name: l.material?.name ?? "—", pack: "Bulk", qtyLeft: l.qtyLeft, unit: l.material?.unit ?? "kg", expiryDate: l.expiryDate, value: l.qtyLeft * l.unitCost })),
  ]
    .filter((l) => ["EXPIRED", "SOON"].includes(expiryStatus(l.expiryDate, now, 45)))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  return {
    value: { packs: round2(packValue), materials: round2(materialValue), total: round2(packValue + materialValue) },
    packUnits,
    unassigned,
    noCost,
    materialKg: round3(materials.reduce((s: number, m: any) => s + Math.max(0, m.stockQty), 0)),
    reorder,
    lowMaterials,
    expiring,
    openPOs,
    recentRepacks,
    leadDays,
  };
}
