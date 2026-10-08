'use server';

import { audit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import { getRazorpay } from '@/lib/orders';
import { isValidGstin } from '@/lib/gst';
import { EXPENSE_CATEGORIES, PAY_METHODS, lastMonths, monthRange, r2, ymOf } from '@/lib/finance-core';
import { getCashMonth, getGstReturn, getPositions, getProfitAndLoss, receivedValue } from '@/lib/finance';

const json = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const clean = (s: unknown, max = 200) => (typeof s === 'string' ? s.trim().slice(0, max) : '') || null;
const asDate = (s: unknown) => (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s) ? new Date(`${s.slice(0, 10)}T12:00:00+05:30`) : null);
const validYm = (ym?: string) => (ym && /^\d{4}-(0[1-9]|1[0-2])$/.test(ym) ? ym : ymOf(new Date()));

async function manager() {
  await requirePermission('finance.manage');
  return staffActor();
}

function touch() {
  for (const p of ['/admin/finance', '/admin/expenses', '/admin/payments', '/admin/gst']) revalidatePath(p);
}

// ───────────── Reports ─────────────

export async function getFinanceOverview() {
  await requirePermission('reports.view');
  const months = lastMonths(6);
  const [pnl, cash, positions] = await Promise.all([
    Promise.all(months.map((m) => getProfitAndLoss(m))),
    Promise.all(months.map((m) => getCashMonth(m))),
    getPositions(),
  ]);
  return json({ months, pnl, cash, positions });
}

export async function getPnlAction(ym?: string) {
  await requirePermission('reports.view');
  const m = validYm(ym);
  const [cur, prev] = await Promise.all([getProfitAndLoss(m), getProfitAndLoss(prevYm(m))]);
  return json({ cur, prev });
}

function prevYm(ym: string) {
  const [y, mo] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, mo - 2, 1));
  return d.toISOString().slice(0, 7);
}

export async function getGstAction(ym?: string) {
  await requirePermission('reports.view');
  return json(await getGstReturn(validYm(ym)));
}

// ───────────── Expenses ─────────────

export async function getExpenses(ym?: string) {
  await requirePermission('finance.manage');
  const m = validYm(ym);
  const { start, end } = monthRange(m);
  const [rows, unpaid] = await Promise.all([
    prisma.expense.findMany({ where: { date: { gte: start, lt: end } }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }),
    prisma.expense.findMany({ where: { paidVia: 'UNPAID', date: { lt: start } }, orderBy: { date: 'asc' } }),
  ]);
  return json({ ym: m, rows, unpaid });
}

export interface ExpenseInput {
  id?: string;
  date: string;
  category: string;
  description: string;
  vendor?: string | null;
  vendorGstin?: string | null;
  billNo?: string | null;
  amount: number;
  gstAmount?: number;
  paidVia: string;
  notes?: string | null;
}

export async function saveExpenseAction(input: ExpenseInput) {
  const actor = await manager();
  const date = asDate(input.date);
  if (!date) return { error: 'Choose the bill date.' };
  if (!EXPENSE_CATEGORIES.some((c) => c.key === input.category)) return { error: 'Choose a category.' };
  const description = clean(input.description, 200);
  if (!description) return { error: 'Say what the expense was for.' };
  const amount = r2(Number(input.amount));
  const gstAmount = r2(Number(input.gstAmount) || 0);
  if (!(amount > 0)) return { error: 'Enter the amount.' };
  if (gstAmount < 0 || gstAmount > amount) return { error: 'GST looks wrong.' };
  const vendorGstin = clean(input.vendorGstin, 15)?.toUpperCase() ?? null;
  if (vendorGstin && !isValidGstin(vendorGstin)) return { error: 'Vendor GSTIN should be 15 characters, like 29ABCDE1234F1Z5.' };
  if (gstAmount > 0 && !vendorGstin) return { error: "Add the vendor's GSTIN to claim the GST, or put GST as 0 and include it in the amount." };
  const paidVia = input.paidVia === 'UNPAID' || PAY_METHODS.some((p) => p.key === input.paidVia) ? input.paidVia : null;
  if (!paidVia) return { error: 'Choose how it was paid.' };
  const data = {
    date, category: input.category, description, vendor: clean(input.vendor, 100), vendorGstin, billNo: clean(input.billNo, 40),
    amount, gstAmount, total: r2(amount + gstAmount), paidVia, paidAt: paidVia === 'UNPAID' ? null : date, notes: clean(input.notes, 500),
  };
  if (input.id) await prisma.expense.update({ where: { id: input.id }, data });
  else await prisma.expense.create({ data: { ...data, createdBy: actor } });
  touch();
  await audit({ action: 'expense.save', entity: 'Expense', entityId: input.id ?? null, summary: `${input.id ? 'Edited' : 'Added'} expense ₹${data.total}: ${description}` });
  return { success: true };
}

export async function payExpenseAction(id: string, paidVia: string, paidOn?: string) {
  await manager();
  if (!PAY_METHODS.some((p) => p.key === paidVia)) return { error: 'Choose how it was paid.' };
  await prisma.expense.update({ where: { id }, data: { paidVia, paidAt: asDate(paidOn) ?? new Date() } });
  touch();
  await audit({ action: 'expense.paid', entity: 'Expense', entityId: id, summary: `Marked expense paid via ${paidVia}` });
  return { success: true };
}

export async function deleteExpenseAction(id: string) {
  await manager();
  await prisma.expense.delete({ where: { id } });
  touch();
  await audit({ action: 'expense.delete', entity: 'Expense', entityId: id, summary: 'Deleted expense' });
  return { success: true };
}

// ───────────── Supplier payments ─────────────

export async function getPayables() {
  await requirePermission('finance.manage');
  const [suppliers, payments] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: { purchases: { where: { status: { in: ['PARTIAL', 'RECEIVED'] } }, include: { lines: { select: { qty: true, rate: true, receivedQty: true } } }, orderBy: { orderDate: 'asc' } } },
    }),
    prisma.supplierPayment.findMany({ orderBy: { date: 'desc' }, take: 50, include: { supplier: { select: { name: true } }, po: { select: { number: true } } } }),
  ]);
  const rows = suppliers
    .map((s: any) => {
      const pos = s.purchases.map((p: any) => ({ id: p.id, number: p.number, date: p.supplierInvoiceDate ?? p.orderDate, billNo: p.supplierInvoiceNo, owed: receivedValue(p), paid: p.paidAmount }))
        .map((p: any) => ({ ...p, due: r2(Math.max(0, p.owed - p.paid)) }));
      return { id: s.id, name: s.name, phone: s.phone, pos: pos.filter((p: any) => p.due > 0), due: r2(pos.reduce((a: number, p: any) => a + p.due, 0)) };
    })
    .filter((s: any) => s.due > 0);
  const suppliersAll = suppliers.map((s: any) => ({ id: s.id, name: s.name }));
  return json({ rows, payments, suppliers: suppliersAll });
}

export interface SupplierPaymentInput { supplierId: string; poId?: string | null; date: string; amount: number; method: string; reference?: string | null; note?: string | null }

/** Records money paid to a supplier; without a PO, it is applied to the oldest unpaid POs first. */
export async function recordSupplierPaymentAction(input: SupplierPaymentInput) {
  const actor = await manager();
  const amount = r2(Number(input.amount));
  if (!(amount > 0)) return { error: 'Enter the amount paid.' };
  const date = asDate(input.date) ?? new Date();
  if (!PAY_METHODS.some((p) => p.key === input.method)) return { error: 'Choose how it was paid.' };
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) return { error: 'Supplier not found.' };

  await prisma.$transaction(async (tx: any) => {
    const pos = await tx.purchaseOrder.findMany({
      where: { supplierId: supplier.id, status: { in: ['PARTIAL', 'RECEIVED', 'ORDERED'] }, ...(input.poId ? { id: input.poId } : {}) },
      orderBy: { orderDate: 'asc' },
      include: { lines: { select: { qty: true, rate: true, receivedQty: true } } },
    });
    let left = amount;
    const touched: string[] = [];
    for (const p of pos) {
      if (left <= 0) break;
      const due = input.poId ? Math.max(0, p.total - p.paidAmount) : Math.max(0, receivedValue(p) - p.paidAmount);
      const pay = r2(Math.min(due, left));
      if (pay <= 0) continue;
      await tx.purchaseOrder.update({ where: { id: p.id }, data: { paidAmount: { increment: pay } } });
      await tx.supplierPayment.create({ data: { supplierId: supplier.id, poId: p.id, date, amount: pay, method: input.method, reference: clean(input.reference, 60), note: clean(input.note, 300), createdBy: actor } });
      touched.push(p.number);
      left = r2(left - pay);
    }
    // Anything beyond the bills (advance) is kept against the supplier.
    if (left > 0) {
      await tx.supplierPayment.create({ data: { supplierId: supplier.id, poId: null, date, amount: left, method: input.method, reference: clean(input.reference, 60), note: clean(input.note, 300) ?? 'Advance', createdBy: actor } });
    }
  });
  touch();
  revalidatePath('/admin/suppliers');
  revalidatePath('/admin/purchases');
  await audit({ action: 'supplier.payment', entity: 'Supplier', entityId: supplier.id, summary: `Paid ${supplier.name} ₹${amount} via ${input.method}${input.reference ? ` (${input.reference})` : ''}` });
  return { success: true };
}

// ───────────── Cash on delivery ─────────────

export async function getCodOutstanding() {
  await requirePermission('finance.manage');
  const [orders, remittances] = await Promise.all([
    prisma.order.findMany({
      where: { paymentMethod: 'COD', status: 'DELIVERED', codRemittanceId: null },
      orderBy: { deliveredAt: 'asc' },
      select: { id: true, customerName: true, total: true, deliveredAt: true, shipments: { where: { type: 'FORWARD' }, orderBy: { createdAt: 'desc' }, take: 1, select: { awb: true, courierName: true, provider: true } } },
    }),
    prisma.codRemittance.findMany({ orderBy: { date: 'desc' }, take: 30, include: { _count: { select: { orders: true } } } }),
  ]);
  return json({
    orders: orders.map((o: any) => ({
      id: o.id, ref: `NW-${o.id.slice(-8).toUpperCase()}`, customerName: o.customerName, total: o.total, deliveredAt: o.deliveredAt,
      awb: o.shipments[0]?.awb ?? null, courier: o.shipments[0]?.courierName ?? (o.shipments[0]?.provider && o.shipments[0].provider !== 'MANUAL' ? o.shipments[0].provider : 'Self / manual'),
    })),
    remittances,
  });
}

export async function recordCodRemittanceAction(input: { courier: string; date: string; amount: number; reference?: string | null; note?: string | null; orderIds: string[] }) {
  const actor = await manager();
  const amount = r2(Number(input.amount));
  if (!(amount >= 0)) return { error: 'Enter the amount received.' };
  if (!input.orderIds?.length) return { error: 'Tick the orders this payment covers.' };
  const orders = await prisma.order.findMany({ where: { id: { in: input.orderIds }, paymentMethod: 'COD', codRemittanceId: null }, select: { id: true, total: true } });
  if (orders.length !== input.orderIds.length) return { error: 'Some orders were already marked as paid by the courier. Refresh and try again.' };
  const expected = r2(orders.reduce((s: number, o: any) => s + o.total, 0));
  await prisma.codRemittance.create({
    data: {
      courier: clean(input.courier, 60) ?? 'Courier', date: asDate(input.date) ?? new Date(), expected, amount,
      reference: clean(input.reference, 60), note: clean(input.note, 300), createdBy: actor,
      orders: { connect: orders.map((o: any) => ({ id: o.id })) },
    },
  });
  touch();
  await audit({ action: 'cod.remittance', entity: 'CodRemittance', summary: `COD from ${input.courier}: ₹${amount} for ${orders.length} orders (expected ₹${expected})` });
  return { success: true, short: r2(expected - amount) };
}

// ───────────── Razorpay ─────────────

/**
 * Pulls the real gateway fee for paid online orders that don't have it yet, and
 * marks orders that Razorpay has settled into the bank (for this and last month).
 */
export async function syncRazorpayAction() {
  await manager();
  const rzp: any = getRazorpay();
  if (!rzp) return { error: 'Razorpay keys are not set on this server.' };

  let fees = 0;
  const missing = await prisma.order.findMany({
    where: { paymentMethod: 'ONLINE', paymentId: { not: null }, paymentFee: null, paidAt: { gte: new Date(Date.now() - 180 * 864e5) } },
    select: { id: true, paymentId: true },
    orderBy: { paidAt: 'desc' },
    take: 60,
  });
  for (const o of missing) {
    if (!o.paymentId || o.paymentId.startsWith('pay_mock')) continue;
    try {
      const p = await rzp.payments.fetch(o.paymentId);
      if (p?.fee !== undefined && p?.fee !== null) {
        await prisma.order.update({ where: { id: o.id }, data: { paymentFee: Number(p.fee) / 100, paymentFeeTax: Number(p.tax ?? 0) / 100 } });
        fees++;
      }
    } catch (e) {
      console.error('[FINANCE] Razorpay payment fetch failed', o.paymentId, e);
    }
  }

  let settled = 0;
  const months = lastMonths(2);
  for (const ym of months) {
    const [year, month] = ym.split('-').map(Number);
    for (let skip = 0; skip < 5000; skip += 1000) {
      let res: any;
      try {
        res = await rzp.settlements.reports({ year, month, count: 1000, skip });
      } catch (e: any) {
        console.error('[FINANCE] Razorpay settlement report failed', e);
        return { error: `Razorpay settlement report failed: ${e?.error?.description ?? e?.message ?? 'unknown error'}`, fees, settled };
      }
      const items: any[] = res?.items ?? [];
      for (const it of items) {
        if (it.type !== 'payment' || !it.entity_id || !it.settled) continue;
        const r = await prisma.order.updateMany({
          where: { paymentId: it.entity_id, settledAt: null },
          data: {
            settledAt: it.settled_at ? new Date(Number(it.settled_at) * 1000) : new Date(),
            settlementId: it.settlement_id ?? null,
            settlementUtr: it.settlement_utr ?? null,
            ...(it.fee !== undefined && it.fee !== null ? { paymentFee: Number(it.fee) / 100, paymentFeeTax: Number(it.tax ?? 0) / 100 } : {}),
          },
        });
        settled += r.count;
      }
      if (items.length < 1000) break;
    }
  }
  touch();
  return { success: true, fees, settled };
}

export async function getRazorpayStatus() {
  await requirePermission('finance.manage');
  const [unsettled, recent] = await Promise.all([
    prisma.order.findMany({
      where: { paymentMethod: 'ONLINE', paymentId: { not: null }, paidAt: { not: null }, settledAt: null, status: { notIn: ['DELETED'] } },
      orderBy: { paidAt: 'asc' },
      take: 100,
      select: { id: true, customerName: true, total: true, paymentFee: true, refundedAmount: true, paidAt: true, paymentId: true },
    }),
    prisma.order.findMany({
      where: { settledAt: { not: null } },
      orderBy: { settledAt: 'desc' },
      take: 200,
      select: { settledAt: true, settlementId: true, settlementUtr: true, total: true, paymentFee: true, refundedAmount: true },
    }),
  ]);
  const batches = new Map<string, { id: string; utr: string | null; date: string; orders: number; gross: number; fees: number }>();
  for (const o of recent as any[]) {
    const k = o.settlementId ?? o.settledAt.toISOString().slice(0, 10);
    const cur = batches.get(k) ?? { id: k, utr: o.settlementUtr, date: o.settledAt.toISOString(), orders: 0, gross: 0, fees: 0 };
    cur.orders++;
    cur.gross = r2(cur.gross + o.total);
    cur.fees = r2(cur.fees + (o.paymentFee ?? 0));
    batches.set(k, cur);
  }
  return json({
    configured: !!getRazorpay(),
    unsettled: unsettled.map((o: any) => ({ ...o, ref: `NW-${o.id.slice(-8).toUpperCase()}` })),
    settlements: [...batches.values()].slice(0, 20),
  });
}
