'use server';

import { audit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import { adjustStock } from '@/lib/inventory';
import { isValidGstin } from '@/lib/gst';
import { purchaseTotals, round3 } from '@/lib/wms-core';
import { createPackLot, getSellableUnits, nextDocNumber, receiveMaterial, updatePackCost } from '@/lib/wms';

async function who() {
  await requirePermission('purchases.manage');
  return staffActor();
}

const clean = (s: unknown, max = 200) => (typeof s === 'string' ? s.trim().slice(0, max) : '') || null;
const asDate = (s: unknown) => (typeof s === 'string' && s ? new Date(`${s.slice(0, 10)}T00:00:00+05:30`) : null);

// ───────────── Suppliers ─────────────

export async function getSuppliers() {
  await requirePermission('purchases.manage');
  const suppliers = await prisma.supplier.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: { purchases: { where: { status: { not: 'CANCELLED' } }, select: { total: true, paidAmount: true, orderDate: true } } },
  });
  return suppliers.map((s: any) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    purchases: undefined,
    poCount: s.purchases.length,
    spend: s.purchases.reduce((a: number, p: any) => a + p.total, 0),
    due: s.purchases.reduce((a: number, p: any) => a + Math.max(0, p.total - p.paidAmount), 0),
    lastOrder: s.purchases.length ? new Date(Math.max(...s.purchases.map((p: any) => p.orderDate.getTime()))).toISOString() : null,
  }));
}

export interface SupplierInput {
  id?: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  state?: string;
  leadDays?: number;
  notes?: string;
  isActive?: boolean;
}

export async function saveSupplierAction(input: SupplierInput) {
  await who();
  const name = clean(input.name, 120);
  if (!name) return { error: 'Enter the supplier name.' };
  const gstin = clean(input.gstin, 15)?.toUpperCase() ?? null;
  if (gstin && !isValidGstin(gstin)) return { error: 'GSTIN should be 15 characters, like 29ABCDE1234F1Z5.' };
  const phone = input.phone ? input.phone.replace(/[^\d+]/g, '').slice(0, 15) || null : null;
  const email = clean(input.email, 120);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Email looks wrong.' };
  const data = {
    name, gstin, phone, email,
    contactName: clean(input.contactName, 80),
    address: clean(input.address, 300),
    state: clean(input.state, 40),
    leadDays: Math.max(0, Math.min(120, Math.round(Number(input.leadDays ?? 7)) || 0)),
    notes: clean(input.notes, 500),
    isActive: input.isActive ?? true,
  };
  const saved = input.id ? await prisma.supplier.update({ where: { id: input.id }, data }) : await prisma.supplier.create({ data });
  revalidatePath('/admin/suppliers');
  await audit({ action: 'supplier.save', entity: 'Supplier', entityId: saved.id, summary: `${input.id ? 'Edited' : 'Added'} supplier ${name}` });
  return { success: true, id: saved.id };
}

// ───────────── Purchase orders ─────────────

export async function getPurchaseOrders() {
  await requirePermission('purchases.manage');
  const pos = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { supplier: { select: { name: true } }, lines: { select: { qty: true, receivedQty: true } } },
  });
  return pos.map((p: any) => ({
    id: p.id, number: p.number, status: p.status, supplier: p.supplier.name,
    orderDate: p.orderDate.toISOString(), expectedDate: p.expectedDate?.toISOString() ?? null,
    total: p.total, paidAmount: p.paidAmount, lines: p.lines.length,
    receivedPct: (() => {
      const q = p.lines.reduce((s: number, l: any) => s + l.qty, 0);
      return q ? Math.round((p.lines.reduce((s: number, l: any) => s + Math.min(l.qty, l.receivedQty), 0) / q) * 100) : 0;
    })(),
    supplierInvoiceNo: p.supplierInvoiceNo,
  }));
}

export async function getPurchaseFormData() {
  await requirePermission('purchases.manage');
  const [suppliers, materials, units] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, gstin: true, leadDays: true } }),
    prisma.material.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, unit: true, avgCost: true, gstRate: true, stockQty: true } }),
    getSellableUnits(),
  ]);
  return { suppliers, materials, units: units.map((u) => ({ key: u.key, productId: u.productId, variantId: u.variantId, name: u.name, pack: u.pack, costPrice: u.costPrice, stock: u.stock })) };
}

export async function getPurchaseOrder(id: string) {
  await requirePermission('purchases.manage');
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      lines: { orderBy: { id: 'asc' } },
      lots: { orderBy: { receivedAt: 'asc' }, select: { id: true, lotNumber: true, kind: true, qtyIn: true, qtyLeft: true, unitCost: true, expiryDate: true, receivedAt: true, materialId: true, productId: true, variantId: true } },
    },
  });
  return po ? JSON.parse(JSON.stringify(po)) : null;
}

export interface PurchaseLineInput {
  kind: 'MATERIAL' | 'PACK';
  materialId?: string | null;
  productId?: string | null;
  variantId?: string | null;
  qty: number;
  rate: number;
  gstRate: number;
}

export interface PurchaseInput {
  id?: string;
  supplierId: string;
  expectedDate?: string | null;
  notes?: string | null;
  freight?: number;
  status: 'DRAFT' | 'ORDERED';
  lines: PurchaseLineInput[];
}

/** Creates or edits a purchase order (only before anything has been received). */
export async function savePurchaseOrderAction(input: PurchaseInput) {
  const actor = await who();
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) return { error: 'Choose a supplier.' };
  const lines = (input.lines || []).filter((l) => Number(l.qty) > 0);
  if (!lines.length) return { error: 'Add at least one item with a quantity.' };

  const materialIds = lines.filter((l) => l.kind === 'MATERIAL').map((l) => l.materialId!).filter(Boolean);
  const productIds = lines.filter((l) => l.kind === 'PACK').map((l) => l.productId!).filter(Boolean);
  const [materials, products] = await Promise.all([
    prisma.material.findMany({ where: { id: { in: materialIds } }, select: { id: true, name: true, unit: true } }),
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, weight: true, variants: { select: { id: true, label: true } } } }),
  ]);
  const rows: Array<{ materialId: string | null; productId: string | null; variantId: string | null; description: string; unit: string; qty: number; rate: number; gstRate: number }> = [];
  for (const l of lines) {
    const qty = Number(l.qty);
    const rate = Number(l.rate);
    const gstRate = Number(l.gstRate) || 0;
    if (!(rate >= 0)) return { error: 'Rates must be zero or more.' };
    if (gstRate < 0 || gstRate > 40) return { error: 'GST must be between 0 and 40%.' };
    if (l.kind === 'MATERIAL') {
      const m = materials.find((x: any) => x.id === l.materialId);
      if (!m) return { error: 'Choose the bulk item for every line.' };
      rows.push({ materialId: m.id, productId: null, variantId: null, description: m.name, unit: m.unit, qty: round3(qty), rate, gstRate });
    } else {
      const p: any = products.find((x: any) => x.id === l.productId);
      if (!p) return { error: 'Choose the product for every line.' };
      const v = l.variantId ? p.variants.find((x: any) => x.id === l.variantId) : null;
      if (l.variantId && !v) return { error: `Pack size not found for ${p.name}.` };
      if (!Number.isInteger(qty)) return { error: `Packs of ${p.name} must be a whole number.` };
      rows.push({ materialId: null, productId: p.id, variantId: v?.id ?? null, description: `${p.name} ${v?.label ?? p.weight ?? ''}`.trim(), unit: 'pcs', qty, rate, gstRate });
    }
  }
  const freight = Math.max(0, Number(input.freight) || 0);
  const t = purchaseTotals(rows, freight, !!supplier.gstin);
  const data = {
    supplierId: supplier.id,
    expectedDate: asDate(input.expectedDate) ?? (input.status === 'ORDERED' ? new Date(Date.now() + supplier.leadDays * 864e5) : null),
    notes: clean(input.notes, 500),
    freight,
    subtotal: t.subtotal,
    taxTotal: t.taxTotal,
    total: t.total,
    status: input.status,
  };

  const po = await prisma.$transaction(async (tx: any) => {
    if (input.id) {
      const existing = await tx.purchaseOrder.findUnique({ where: { id: input.id }, include: { lines: true } });
      if (!existing) throw new Error('Purchase order not found');
      if (!['DRAFT', 'ORDERED'].includes(existing.status) || existing.lines.some((l: any) => l.receivedQty > 0)) {
        return { error: 'Goods have already been received on this order, so it can no longer be edited.' };
      }
      await tx.purchaseLine.deleteMany({ where: { poId: existing.id } });
      return tx.purchaseOrder.update({ where: { id: existing.id }, data: { ...data, lines: { create: rows } } });
    }
    const number = await nextDocNumber(tx, 'PO');
    return tx.purchaseOrder.create({ data: { ...data, number, createdBy: actor, lines: { create: rows } } });
  });
  if ('error' in po) return po as { error: string };
  revalidatePath('/admin/purchases');
  revalidatePath('/admin/warehouse');
  await audit({ action: 'purchase.save', entity: 'PurchaseOrder', entityId: po.id, summary: `${input.id ? 'Edited' : 'Created'} ${po.number} (${input.status.toLowerCase()}), total ₹${t.total}` });
  return { success: true, id: po.id, number: po.number };
}

export async function setPurchaseStatusAction(id: string, status: 'ORDERED' | 'CANCELLED') {
  await who();
  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { lines: true } });
  if (!po) return { error: 'Purchase order not found.' };
  if (status === 'CANCELLED' && po.lines.some((l: any) => l.receivedQty > 0)) return { error: 'Some goods were already received. Receive the rest or leave it part-received.' };
  if (status === 'ORDERED' && po.status !== 'DRAFT') return { error: 'Only a draft can be marked as ordered.' };
  await prisma.purchaseOrder.update({ where: { id }, data: { status } });
  revalidatePath('/admin/purchases');
  revalidatePath(`/admin/purchases/${id}`);
  await audit({ action: 'purchase.status', entity: 'PurchaseOrder', entityId: id, summary: `${po.number} → ${status}` });
  return { success: true };
}

export interface ReceiveInput {
  poId: string;
  supplierInvoiceNo?: string | null;
  supplierInvoiceDate?: string | null;
  lines: Array<{ lineId: string; qty: number; expiryDate?: string | null; mfgDate?: string | null; lotNumber?: string | null }>;
}

/**
 * Goods receipt: adds the stock, creates a batch per line (with expiry), and updates average cost.
 * Cost per unit includes a share of freight, and GST when it can't be claimed back.
 */
export async function receivePurchaseAction(input: ReceiveInput) {
  const actor = await who();
  const po = await prisma.purchaseOrder.findUnique({ where: { id: input.poId }, include: { lines: { orderBy: { id: 'asc' } }, supplier: true } });
  if (!po) return { error: 'Purchase order not found.' };
  if (!['DRAFT', 'ORDERED', 'PARTIAL'].includes(po.status)) return { error: 'This order is closed.' };
  const t = purchaseTotals(po.lines, po.freight, !!po.supplier.gstin);

  // Check every line before touching stock.
  const todo: Array<{ line: any; qty: number; unitCost: number; expiryDate: Date | null; mfgDate: Date | null; lotNumber: string | null }> = [];
  const codes = new Set<string>();
  for (const r of input.lines) {
    const qty = Number(r.qty);
    if (!(qty > 0)) continue;
    const idx = po.lines.findIndex((l: any) => l.id === r.lineId);
    const line: any = po.lines[idx];
    if (!line) return { error: 'Line not found.' };
    const remaining = round3(line.qty - line.receivedQty);
    if (qty > remaining + 1e-6) return { error: `${line.description}: only ${remaining} ${line.unit} left to receive.` };
    if (line.productId && !Number.isInteger(qty)) return { error: `${line.description}: packs must be a whole number.` };
    if (!line.productId && !line.materialId) return { error: `${line.description}: the item was deleted, so it can't be received.` };
    const lotNumber = clean(r.lotNumber, 30);
    if (lotNumber) {
      if (codes.has(lotNumber) || (await prisma.stockLot.findUnique({ where: { lotNumber } }))) return { error: `Batch code ${lotNumber} is already used.` };
      codes.add(lotNumber);
    }
    todo.push({ line, qty, unitCost: t.landed[idx], expiryDate: asDate(r.expiryDate), mfgDate: asDate(r.mfgDate), lotNumber });
  }
  if (!todo.length) return { error: 'Enter the quantity received.' };

  // One transaction per line keeps each well inside the database time limit;
  // a line is either fully received (stock + batch + cost) or not at all.
  const lots: string[] = [];
  for (const { line, qty, unitCost, expiryDate, mfgDate, lotNumber } of todo) {
    try {
      const lotNo = await prisma.$transaction(async (tx: any) => {
        const fresh = await tx.purchaseLine.findUnique({ where: { id: line.id } });
        if (!fresh || qty > fresh.qty - fresh.receivedQty + 1e-6) throw new UserError(`${line.description} was already received.`);
        let lot;
        if (line.materialId) {
          lot = await receiveMaterial(tx, {
            materialId: line.materialId, qty, unitCost, reason: 'PURCHASE', actor, refId: po.id, supplierId: po.supplierId, poId: po.id,
            expiryDate, mfgDate, lotNumber, note: `Received on ${po.number}`,
          });
        } else {
          const before = line.variantId
            ? (await tx.productVariant.findUnique({ where: { id: line.variantId }, select: { stock: true } }))?.stock ?? 0
            : (await tx.product.findUnique({ where: { id: line.productId }, select: { stock: true } }))?.stock ?? 0;
          await adjustStock(tx, { productId: line.productId, variantId: line.variantId, delta: qty, reason: 'RESTOCK', actor, note: `Received on ${po.number}` });
          lot = await createPackLot(tx, {
            productId: line.productId, variantId: line.variantId, qty, unitCost, source: 'PURCHASE', actor,
            supplierId: po.supplierId, poId: po.id, expiryDate, mfgDate, lotNumber, note: `Received on ${po.number}`,
          });
          await updatePackCost(tx, { productId: line.productId, variantId: line.variantId, addQty: qty, addCost: unitCost, stockBefore: before });
        }
        await tx.purchaseLine.update({ where: { id: line.id }, data: { receivedQty: { increment: qty } } });
        return lot.lotNumber as string;
      }, { timeout: 15000, maxWait: 5000 });
      lots.push(lotNo);
    } catch (e) {
      await refreshPoStatus(po.id, input);
      if (e instanceof UserError) return { error: lots.length ? `${e.message} (${lots.length} line(s) were received.)` : e.message };
      throw e;
    }
  }
  await refreshPoStatus(po.id, input);
  revalidatePath('/admin/purchases');
  revalidatePath(`/admin/purchases/${input.poId}`);
  revalidatePath('/admin/warehouse');
  revalidatePath('/admin/inventory');
  revalidatePath('/admin/batches');
  await audit({ action: 'purchase.receive', entity: 'PurchaseOrder', entityId: po.id, summary: `Received goods on ${po.number}: batches ${lots.join(', ')}` });
  return { success: true, lots };
}

async function refreshPoStatus(poId: string, input: ReceiveInput) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId }, include: { lines: true } });
  if (!po) return;
  const complete = po.lines.every((l: any) => l.receivedQty + 1e-6 >= l.qty);
  const any = po.lines.some((l: any) => l.receivedQty > 0);
  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      status: complete ? 'RECEIVED' : any ? 'PARTIAL' : po.status,
      receivedAt: complete ? new Date() : null,
      supplierInvoiceNo: clean(input.supplierInvoiceNo, 40) ?? po.supplierInvoiceNo,
      supplierInvoiceDate: asDate(input.supplierInvoiceDate) ?? po.supplierInvoiceDate,
    },
  });
}

class UserError extends Error {}
