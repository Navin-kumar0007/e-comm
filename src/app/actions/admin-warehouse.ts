'use server';

import { audit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getStaffContext, requirePermission, staffActor } from '@/lib/auth-guard';
import { adjustStock, StockError } from '@/lib/inventory';
import { parseGrams, repackPlan, round2, round3 } from '@/lib/wms-core';
import {
  consumeMaterial, createPackLot, getSellableUnits, getWarehouseOverview, MaterialShortError, nextDocNumber, receiveMaterial, updatePackCost,
} from '@/lib/wms';

async function who() {
  await requirePermission('inventory.manage');
  return staffActor();
}

const clean = (s: unknown, max = 200) => (typeof s === 'string' ? s.trim().slice(0, max) : '') || null;
const asDate = (s: unknown) => (typeof s === 'string' && s ? new Date(`${s.slice(0, 10)}T00:00:00+05:30`) : null);
const json = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
class UserError extends Error {}

function fail(e: unknown) {
  if (e instanceof UserError || e instanceof MaterialShortError) return { error: e.message };
  if (e instanceof StockError) return { error: e.message };
  throw e;
}

function touch(...paths: string[]) {
  for (const p of ['/admin/warehouse', '/admin/inventory', ...paths]) revalidatePath(p);
}

// ───────────── Overview ─────────────

export async function getWarehouseOverviewAction() {
  await requirePermission('inventory.manage');
  return json(await getWarehouseOverview());
}

// ───────────── Bulk materials ─────────────

export async function getMaterials() {
  await requirePermission('inventory.manage');
  const materials = await prisma.material.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: {
      product: { select: { id: true, name: true } },
      lots: { where: { qtyLeft: { gt: 0 } }, select: { id: true, lotNumber: true, qtyLeft: true, expiryDate: true, unitCost: true }, orderBy: { expiryDate: 'asc' } },
    },
  });
  const products = await prisma.product.findMany({ where: { status: { in: ['ACTIVE', 'DRAFT'] } }, orderBy: { name: 'asc' }, select: { id: true, name: true, hsnCode: true, gstRate: true } });
  return json({ materials, products });
}

export interface MaterialInput {
  id?: string;
  name: string;
  unit?: string;
  productId?: string | null;
  reorderLevel?: number;
  hsnCode?: string | null;
  gstRate?: number | null;
  isActive?: boolean;
}

export async function saveMaterialAction(input: MaterialInput) {
  await who();
  const name = clean(input.name, 100);
  if (!name) return { error: 'Enter a name, e.g. "Almonds (bulk)".' };
  const hsn = clean(input.hsnCode, 8);
  if (hsn && !/^\d{4,8}$/.test(hsn)) return { error: 'HSN code is 4 to 8 digits.' };
  const dupe = await prisma.material.findFirst({ where: { name, ...(input.id ? { NOT: { id: input.id } } : {}) } });
  if (dupe) return { error: 'A bulk item with this name already exists.' };
  const data = {
    name,
    unit: input.unit === 'pcs' ? 'pcs' : 'kg',
    productId: input.productId || null,
    reorderLevel: Math.max(0, Number(input.reorderLevel) || 0),
    hsnCode: hsn,
    gstRate: input.gstRate === null || input.gstRate === undefined || (input.gstRate as any) === '' ? null : Number(input.gstRate),
    isActive: input.isActive ?? true,
  };
  const saved = input.id ? await prisma.material.update({ where: { id: input.id }, data }) : await prisma.material.create({ data });
  touch('/admin/materials');
  await audit({ action: 'material.save', entity: 'Material', entityId: saved.id, summary: `${input.id ? 'Edited' : 'Added'} bulk item ${name}` });
  return { success: true, id: saved.id };
}

export interface MaterialAdjustInput {
  materialId: string;
  kind: 'OPENING' | 'WASTAGE' | 'ADD' | 'REMOVE';
  qty: number;
  unitCost?: number;
  expiryDate?: string | null;
  lotNumber?: string | null;
  note?: string | null;
}

/** Opening stock, wastage (spoiled, spilled) or a correction for bulk material. */
export async function adjustMaterialAction(input: MaterialAdjustInput) {
  const actor = await who();
  const qty = round3(Number(input.qty));
  if (!(qty > 0)) return { error: 'Enter a quantity.' };
  try {
    await prisma.$transaction(async (tx: any) => {
      const m = await tx.material.findUnique({ where: { id: input.materialId } });
      if (!m) throw new UserError('Bulk item not found.');
      const note = clean(input.note, 300);
      if (input.kind === 'OPENING' || input.kind === 'ADD') {
        const unitCost = input.kind === 'OPENING' ? Number(input.unitCost) : m.avgCost;
        if (input.kind === 'OPENING' && !(unitCost >= 0)) throw new UserError('Enter the cost per kg.');
        const lotNumber = clean(input.lotNumber, 30);
        if (lotNumber && (await tx.stockLot.findUnique({ where: { lotNumber } }))) throw new UserError(`Batch code ${lotNumber} is already used.`);
        await receiveMaterial(tx, {
          materialId: m.id, qty, unitCost: unitCost || 0, reason: input.kind === 'OPENING' ? 'OPENING' : 'CORRECTION', actor,
          expiryDate: asDate(input.expiryDate), lotNumber, note,
        });
      } else {
        await consumeMaterial(tx, { materialId: m.id, qty, reason: input.kind === 'WASTAGE' ? 'WASTAGE' : 'CORRECTION', actor, note });
      }
    }, { timeout: 15000, maxWait: 5000 });
  } catch (e) {
    return fail(e);
  }
  touch('/admin/materials', '/admin/batches');
  await audit({ action: 'material.adjust', entity: 'Material', entityId: input.materialId, summary: `Bulk ${input.kind.toLowerCase()} ${qty}${input.note ? `: ${input.note}` : ''}` });
  return { success: true };
}

export async function getMaterialHistoryAction(materialId: string) {
  await requirePermission('inventory.manage');
  const rows = await prisma.materialMovement.findMany({ where: { materialId }, orderBy: { createdAt: 'desc' }, take: 50 });
  return json(rows);
}

// ───────────── Repacking ─────────────

export async function getRepackData() {
  await requirePermission('inventory.manage');
  const [materials, units, runs] = await Promise.all([
    prisma.material.findMany({ where: { isActive: true, unit: 'kg' }, orderBy: { name: 'asc' }, select: { id: true, name: true, stockQty: true, avgCost: true, productId: true } }),
    getSellableUnits(),
    prisma.repackRun.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { material: { select: { name: true } } } }),
  ]);
  const variantGrams = await prisma.productVariant.findMany({ where: { isActive: true }, select: { id: true, weightGrams: true } });
  const gramsBy = new Map(variantGrams.map((v: any) => [v.id, v.weightGrams]));
  return json({
    materials,
    units: units.map((u) => ({ key: u.key, productId: u.productId, variantId: u.variantId, name: u.name, pack: u.pack, grams: (u.variantId ? gramsBy.get(u.variantId) : null) || parseGrams(u.pack), stock: u.stock })),
    runs,
  });
}

export interface RepackInput {
  materialId: string;
  inputQty: number;
  packingCost?: number;
  expiryDate?: string | null;
  notes?: string | null;
  outputs: Array<{ productId: string; variantId: string | null; packs: number }>;
}

/** Bulk → packs: takes bulk stock out (oldest expiry first), adds packs as a new batch with cost per pack. */
export async function createRepackAction(input: RepackInput) {
  const actor = await who();
  const inputQty = round3(Number(input.inputQty));
  const packingCost = Math.max(0, Number(input.packingCost) || 0);
  const outputs = (input.outputs || []).filter((o) => Number(o.packs) > 0);
  if (outputs.some((o) => !Number.isInteger(Number(o.packs)))) return { error: 'Packs must be whole numbers.' };
  if (outputs.length > 6) return { error: 'Record at most 6 pack sizes per run.' };

  // Pack weights, from the size's weight or its label ("250g").
  const productIds = [...new Set(outputs.map((o) => o.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, weight: true, variants: { select: { id: true, label: true, weightGrams: true } } } });
  const lines: Array<{ productId: string; variantId: string | null; name: string; label: string; grams: number; packs: number }> = [];
  for (const o of outputs) {
    const p: any = products.find((x: any) => x.id === o.productId);
    if (!p) return { error: 'Product not found.' };
    const v = o.variantId ? p.variants.find((x: any) => x.id === o.variantId) : null;
    const label = v?.label ?? p.weight ?? '';
    const grams = v?.weightGrams || parseGrams(label);
    if (!grams) return { error: `Can't tell the weight of ${p.name} ${label}. Name the size like "250g".` };
    lines.push({ productId: p.id, variantId: v?.id ?? null, name: p.name, label, grams, packs: Number(o.packs) });
  }

  let result: { number: string; lots: string[]; wastageKg: number } | null = null;
  try {
    await prisma.$transaction(async (tx: any) => {
      const m = await tx.material.findUnique({ where: { id: input.materialId } });
      if (!m) throw new UserError('Bulk item not found.');
      const number = await nextDocNumber(tx, 'RP');
      const used = await consumeMaterial(tx, { materialId: m.id, qty: inputQty, reason: 'REPACK', actor, refId: number, note: `Repacking ${number}` });
      // Cost of what went in: the batches actually used, average cost for anything not in a batch.
      const covered = used.used.reduce((s, u) => s + u.qty, 0);
      const costPerKg = inputQty > 0 ? (used.used.reduce((s, u) => s + u.qty * (u.unitCost || m.avgCost), 0) + Math.max(0, inputQty - covered) * m.avgCost) / inputQty : 0;
      const plan = repackPlan({ inputKg: inputQty, costPerKg, packingCost, outputs: lines });
      if (plan.error) throw new UserError(plan.error);
      const expiryDate = asDate(input.expiryDate) ?? used.earliestExpiry;

      const run = await tx.repackRun.create({
        data: { number, materialId: m.id, inputQty, outputQty: plan.outputKg, wastageQty: plan.wastageKg, costPerKg: round2(costPerKg), packingCost, outputs: '[]', notes: clean(input.notes, 500), actor },
      });
      const out = [];
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const before = l.variantId
          ? (await tx.productVariant.findUnique({ where: { id: l.variantId }, select: { stock: true } }))?.stock ?? 0
          : (await tx.product.findUnique({ where: { id: l.productId }, select: { stock: true } }))?.stock ?? 0;
        await adjustStock(tx, { productId: l.productId, variantId: l.variantId, delta: l.packs, reason: 'REPACK', actor, note: `${number} from ${m.name}` });
        const lot = await createPackLot(tx, {
          productId: l.productId, variantId: l.variantId, qty: l.packs, unitCost: plan.packCosts[i], source: 'REPACK', actor,
          repackRunId: run.id, mfgDate: new Date(), expiryDate, note: `${number}: ${inputQty} kg ${m.name}${used.used.length ? ` (bulk batch ${used.used.map((u) => u.lotNumber).join(', ')})` : ''}`,
        });
        await updatePackCost(tx, { productId: l.productId, variantId: l.variantId, addQty: l.packs, addCost: plan.packCosts[i], stockBefore: before });
        out.push({ ...l, lotId: lot.id, lotNumber: lot.lotNumber, unitCost: plan.packCosts[i] });
      }
      await tx.repackRun.update({ where: { id: run.id }, data: { outputs: JSON.stringify({ items: out, bulkLots: used.used }) } });
      result = { number, lots: out.map((o) => o.lotNumber), wastageKg: plan.wastageKg };
    }, { timeout: 15000, maxWait: 5000 });
  } catch (e) {
    return fail(e);
  }
  touch('/admin/repack', '/admin/materials', '/admin/batches');
  const done = result as unknown as { number: string; lots: string[]; wastageKg: number };
  await audit({ action: 'repack.create', entity: 'RepackRun', summary: `Packing run ${done.number}: ${inputQty} kg, batches ${done.lots.join(', ')}` });
  return { success: true as const, number: done.number, lots: done.lots, wastageKg: done.wastageKg };
}

// ───────────── Batches (lots) ─────────────

export async function getLots() {
  await requirePermission('inventory.manage');
  const [lots, units] = await Promise.all([
    prisma.stockLot.findMany({
      orderBy: [{ receivedAt: 'desc' }],
      take: 500,
      include: {
        product: { select: { name: true } }, variant: { select: { label: true } }, material: { select: { name: true, unit: true } },
        supplier: { select: { name: true } }, po: { select: { id: true, number: true } },
        _count: { select: { allocations: true } },
      },
    }),
    getSellableUnits(),
  ]);
  // Packs not yet assigned to any batch (stock from before batches were tracked).
  const inLots = new Map<string, number>();
  for (const l of lots as any[]) {
    if (l.kind !== 'PACK') continue;
    const k = l.variantId ? `${l.productId}:${l.variantId}` : l.productId;
    inLots.set(k, (inLots.get(k) ?? 0) + l.qtyLeft);
  }
  const unassigned = units
    .map((u) => ({ ...u, unassigned: Math.max(0, u.stock - (inLots.get(u.key) ?? 0)) }))
    .filter((u) => u.unassigned > 0);
  return json({ lots, unassigned });
}

/** Who received units from a batch: for a recall, or a customer complaint. */
export async function traceLotAction(lotId: string) {
  const ctx = await getStaffContext();
  if (!ctx || !ctx.can('inventory.manage') || !ctx.can('orders.view')) return { error: 'Not allowed.' };
  const lot = await prisma.stockLot.findUnique({
    where: { id: lotId },
    include: { allocations: { where: { qty: { gt: 0 } }, orderBy: { createdAt: 'desc' } }, product: { select: { name: true } }, variant: { select: { label: true } }, supplier: { select: { name: true } } },
  });
  if (!lot) return { error: 'Batch not found.' };
  const orderIds = [...new Set(lot.allocations.map((a: any) => a.orderId).filter(Boolean))] as string[];
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, customerName: true, customerPhone: true, shippingAddress: true, status: true, createdAt: true },
  });
  const byId = new Map(orders.map((o: any) => [o.id, o]));
  const rows = lot.allocations.map((a: any) => {
    const o: any = a.orderId ? byId.get(a.orderId) : null;
    return { qty: a.qty, at: a.createdAt, orderId: a.orderId, ref: a.orderId ? `NW-${a.orderId.slice(-8).toUpperCase()}` : null, customer: o?.customerName ?? null, phone: o?.customerPhone ?? null, status: o?.status ?? null };
  });
  return json({ lot, rows, units: rows.reduce((s: number, r: any) => s + r.qty, 0), customers: orderIds.length });
}

export interface OpeningLotInput {
  productId: string;
  variantId: string | null;
  qty: number;
  expiryDate?: string | null;
  mfgDate?: string | null;
  unitCost?: number | null;
  lotNumber?: string | null;
}

/** Puts packs already on the shelf into a batch with its expiry. Stock count does not change. */
export async function createOpeningLotAction(input: OpeningLotInput) {
  const actor = await who();
  const qty = Number(input.qty);
  if (!(qty > 0) || !Number.isInteger(qty)) return { error: 'Enter a whole number of packs.' };
  try {
    await prisma.$transaction(async (tx: any) => {
      const stock = input.variantId
        ? (await tx.productVariant.findUnique({ where: { id: input.variantId }, select: { stock: true, costPrice: true } }))
        : (await tx.product.findUnique({ where: { id: input.productId }, select: { stock: true, costPrice: true } }));
      if (!stock) throw new UserError('Product not found.');
      const agg = await tx.stockLot.aggregate({ where: { kind: 'PACK', productId: input.productId, variantId: input.variantId }, _sum: { qtyLeft: true } });
      const free = stock.stock - (agg._sum.qtyLeft ?? 0);
      if (qty > free) throw new UserError(`Only ${Math.max(0, free)} packs are not yet in a batch.`);
      const lotNumber = clean(input.lotNumber, 30);
      if (lotNumber && (await tx.stockLot.findUnique({ where: { lotNumber } }))) throw new UserError(`Batch code ${lotNumber} is already used.`);
      await createPackLot(tx, {
        productId: input.productId, variantId: input.variantId, qty, unitCost: Number(input.unitCost) || stock.costPrice || 0, source: 'OPENING', actor,
        expiryDate: asDate(input.expiryDate), mfgDate: asDate(input.mfgDate), lotNumber, note: 'Stock already on hand',
      });
    }, { timeout: 15000, maxWait: 5000 });
  } catch (e) {
    return fail(e);
  }
  touch('/admin/batches');
  await audit({ action: 'lot.opening', entity: 'Product', entityId: input.productId, summary: `Gave ${qty} packs a batch${input.expiryDate ? `, best before ${input.expiryDate}` : ''}` });
  return { success: true };
}

/** Removes (part of) a batch: expired, damaged, spoiled. */
export async function writeOffLotAction(input: { lotId: string; qty?: number; note?: string }) {
  const actor = await who();
  try {
    await prisma.$transaction(async (tx: any) => {
      const lot = await tx.stockLot.findUnique({ where: { id: input.lotId }, include: { material: true } });
      if (!lot) throw new UserError('Batch not found.');
      const qty = round3(input.qty ? Number(input.qty) : lot.qtyLeft);
      if (!(qty > 0) || qty > lot.qtyLeft + 1e-6) throw new UserError(`Enter up to ${lot.qtyLeft}.`);
      const note = `Batch ${lot.lotNumber} written off${input.note ? `: ${clean(input.note, 200)}` : ''}`;
      if (lot.kind === 'PACK') {
        if (!Number.isInteger(qty)) throw new UserError('Packs must be a whole number.');
        await adjustStock(tx, { productId: lot.productId, variantId: lot.variantId, delta: -qty, reason: 'DAMAGE', actor, note, lotId: lot.id, force: true });
      } else {
        const m = lot.material;
        await tx.stockLot.update({ where: { id: lot.id }, data: { qtyLeft: { decrement: qty } } });
        const stockQty = round3(m.stockQty - qty);
        await tx.material.update({ where: { id: m.id }, data: { stockQty } });
        await tx.materialMovement.create({ data: { materialId: m.id, lotId: lot.id, delta: -qty, balanceAfter: stockQty, reason: 'WASTAGE', note, actor } });
      }
    }, { timeout: 15000, maxWait: 5000 });
  } catch (e) {
    return fail(e);
  }
  touch('/admin/batches', '/admin/materials');
  await audit({ action: 'lot.write_off', entity: 'StockLot', entityId: input.lotId, summary: `Wrote off ${input.qty ?? 'all'} from a batch${input.note ? `: ${input.note}` : ''}` });
  return { success: true };
}

// ───────────── Stock counts ─────────────

export async function getStockCounts() {
  await requirePermission('inventory.manage');
  const counts = await prisma.stockCount.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { lines: { select: { expected: true, counted: true, unitCost: true } } } });
  return json(counts.map((c: any) => ({
    id: c.id, number: c.number, status: c.status, notes: c.notes, createdBy: c.createdBy, createdAt: c.createdAt, postedAt: c.postedAt,
    lines: c.lines.length,
    counted: c.lines.filter((l: any) => l.counted !== null).length,
    varianceValue: round2(c.lines.reduce((s: number, l: any) => s + (l.counted === null ? 0 : (l.counted - l.expected) * l.unitCost), 0)),
  })));
}

export async function createStockCountAction(input: { scope: 'ALL' | 'PACKS' | 'MATERIALS'; notes?: string }) {
  const actor = await who();
  const [units, materials] = await Promise.all([
    input.scope === 'MATERIALS' ? [] : getSellableUnits(),
    input.scope === 'PACKS' ? [] : prisma.material.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);
  const lines = [
    ...units.map((u) => ({ kind: 'PACK', productId: u.productId, variantId: u.variantId, materialId: null, name: `${u.name} · ${u.pack}`, unit: 'pcs', expected: u.stock, unitCost: u.costPrice ?? 0 })),
    ...(materials as any[]).map((m) => ({ kind: 'MATERIAL', productId: null, variantId: null, materialId: m.id, name: `${m.name} (bulk)`, unit: m.unit, expected: m.stockQty, unitCost: m.avgCost })),
  ];
  if (!lines.length) return { error: 'Nothing to count.' };
  const count = await prisma.$transaction(async (tx: any) => {
    const number = await nextDocNumber(tx, 'SC');
    return tx.stockCount.create({ data: { number, notes: clean(input.notes, 300), createdBy: actor, lines: { create: lines } } });
  });
  revalidatePath('/admin/stock-counts');
  return { success: true, id: count.id };
}

export async function getStockCount(id: string) {
  await requirePermission('inventory.manage');
  const c = await prisma.stockCount.findUnique({ where: { id }, include: { lines: { orderBy: [{ kind: 'desc' }, { name: 'asc' }] } } });
  return c ? json(c) : null;
}

export async function saveCountLinesAction(countId: string, lines: Array<{ id: string; counted: number | null }>) {
  await who();
  const c = await prisma.stockCount.findUnique({ where: { id: countId }, select: { status: true } });
  if (!c || c.status !== 'OPEN') return { error: 'This count is closed.' };
  await prisma.$transaction(
    lines.map((l) =>
      prisma.stockCountLine.updateMany({
        where: { id: l.id, countId },
        data: { counted: l.counted === null || Number.isNaN(Number(l.counted)) ? null : Math.max(0, round3(Number(l.counted))) },
      })
    )
  );
  return { success: true };
}

/**
 * Sets stock to what was counted; differences are recorded as "Stock count" movements.
 * Each item is its own small transaction. Setting an absolute number is safe to repeat,
 * so if anything stops half-way, posting again finishes the job.
 */
export async function postStockCountAction(countId: string) {
  const actor = await who();
  const c = await prisma.stockCount.findUnique({ where: { id: countId }, include: { lines: true } });
  if (!c || c.status !== 'OPEN') return { error: 'This count is closed.' };
  let changed = 0;
  for (const l of c.lines as any[]) {
    if (l.counted === null) continue;
    try {
      const did = await prisma.$transaction(async (tx: any) => {
        if (l.kind === 'PACK') {
          const cur = l.variantId
            ? (await tx.productVariant.findUnique({ where: { id: l.variantId }, select: { stock: true } }))?.stock
            : (await tx.product.findUnique({ where: { id: l.productId }, select: { stock: true } }))?.stock;
          if (cur === undefined || cur === null) return false;
          const delta = Math.round(l.counted) - cur;
          if (delta === 0) return false;
          await adjustStock(tx, { productId: l.productId, variantId: l.variantId, delta, reason: 'COUNT', actor, note: c.number, force: true });
          return true;
        }
        if (!l.materialId) return false;
        const m = await tx.material.findUnique({ where: { id: l.materialId } });
        if (!m) return false;
        const delta = round3(l.counted - m.stockQty);
        if (Math.abs(delta) < 1e-6) return false;
        if (delta > 0) await receiveMaterial(tx, { materialId: m.id, qty: delta, unitCost: m.avgCost, reason: 'CORRECTION', actor, refId: c.id, note: c.number });
        else await consumeMaterial(tx, { materialId: m.id, qty: -delta, reason: 'CORRECTION', actor, refId: c.id, note: c.number, allowShort: true });
        return true;
      }, { timeout: 15000, maxWait: 5000 });
      if (did) changed++;
    } catch (e) {
      const r = fail(e);
      return { error: `${l.name}: ${r.error}. ${changed} item(s) were updated; post again to finish.` };
    }
  }
  await prisma.stockCount.update({ where: { id: c.id }, data: { status: 'POSTED', postedAt: new Date(), postedBy: actor } });
  touch('/admin/stock-counts', `/admin/stock-counts/${countId}`, '/admin/materials', '/admin/batches');
  await audit({ action: 'count.post', entity: 'StockCount', entityId: countId, summary: `Posted ${c.number}: ${changed} items changed` });
  return { success: true, changed };
}

export async function cancelStockCountAction(countId: string) {
  await who();
  await prisma.stockCount.updateMany({ where: { id: countId, status: 'OPEN' }, data: { status: 'CANCELLED' } });
  revalidatePath('/admin/stock-counts');
  return { success: true };
}

export interface BulkOpeningInput {
  mfgDate: string; // packed on, YYYY-MM-DD
  items: Array<{ productId: string; variantId: string | null; qty: number; shelfLifeMonths: number; unitCost?: number | null }>;
}

/** Best-before = packed date + months (same day of month, capped at month end). */
function addMonths(d: Date, months: number) {
  const r = new Date(d);
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + months);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
}

/**
 * Gives every selected product's shelf stock a batch in one go (one batch per product / pack size).
 * Stock numbers don't change. Each item is its own small transaction.
 */
export async function createBulkOpeningLotsAction(input: BulkOpeningInput) {
  const actor = await who();
  const mfg = asDate(input.mfgDate);
  if (!mfg) return { error: 'Choose the packed date.' };
  if (mfg.getTime() > Date.now() + 864e5) return { error: 'Packed date is in the future.' };
  const items = (input.items || []).filter((i) => Number(i.qty) > 0);
  if (!items.length) return { error: 'Tick at least one product.' };
  if (items.some((i) => !(Number(i.shelfLifeMonths) >= 1 && Number(i.shelfLifeMonths) <= 36))) return { error: 'Shelf life should be 1 to 36 months.' };

  const created: Array<{ id: string; lotNumber: string; qty: number }> = [];
  const skipped: string[] = [];
  for (const it of items) {
    const qty = Math.floor(Number(it.qty));
    try {
      const lot = await prisma.$transaction(async (tx: any) => {
        const stock = it.variantId
          ? await tx.productVariant.findUnique({ where: { id: it.variantId }, select: { stock: true, costPrice: true } })
          : await tx.product.findUnique({ where: { id: it.productId }, select: { stock: true, costPrice: true } });
        if (!stock) throw new UserError('Product not found.');
        const agg = await tx.stockLot.aggregate({ where: { kind: 'PACK', productId: it.productId, variantId: it.variantId }, _sum: { qtyLeft: true } });
        const free = Math.max(0, stock.stock - (agg._sum.qtyLeft ?? 0));
        const take = Math.min(qty, free);
        if (take <= 0) return null;
        return createPackLot(tx, {
          productId: it.productId, variantId: it.variantId, qty: take, unitCost: Number(it.unitCost) || stock.costPrice || 0, source: 'OPENING', actor,
          mfgDate: mfg, expiryDate: addMonths(mfg, Number(it.shelfLifeMonths)), note: 'Stock already on hand (bulk)',
        });
      }, { timeout: 15000, maxWait: 5000 });
      if (lot) created.push({ id: lot.id, lotNumber: lot.lotNumber, qty: lot.qtyIn });
      else skipped.push(it.productId);
    } catch (e) {
      const r = fail(e);
      return { error: `${r.error} ${created.length} batches were created before this; run again to finish.` };
    }
  }
  await audit({ action: 'lot.opening_bulk', entity: 'StockLot', summary: `Gave shelf stock batches: ${created.length} products, packed ${input.mfgDate}`, data: { lots: created.map((c) => c.lotNumber) } });
  touch('/admin/batches');
  return { success: true as const, created: created.length, skipped: skipped.length, lots: created };
}
