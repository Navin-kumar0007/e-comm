import { prisma } from "@/lib/db/prisma";
import { BOOKED_STATUSES } from "@/lib/analytics";
import { computeInvoice } from "@/lib/invoice";
import { getStoreSettings } from "@/lib/store-settings";
import { stateCode } from "@/lib/gst";
import {
  r2, monthRange, expenseCost, expenseLabel, buildGstr1, refundTax, itcTotals, type InvoiceForReturn,
} from "@/lib/finance-core";

/** Razorpay's usual domestic fee when the real fee hasn't been fetched yet (before GST on the fee). */
export const ESTIMATED_GATEWAY_RATE = 0.02;
/** Expense categories that are cash only; their cost reaches profit another way. */
const CASH_ONLY_CATEGORIES = new Set(["WALLET"]);

const sameStateAs = (business: string | null, other: string | null | undefined) =>
  !business || !other ? true : business.toLowerCase().replace(/[^a-z]/g, "") === other.toLowerCase().replace(/[^a-z]/g, "");
const gstinState = (gstin: string | null | undefined) => (gstin ? gstin.slice(0, 2) : null);

// ───────────── Profit & loss ─────────────

export interface PnL {
  ym: string;
  orders: number;
  sales: number; // what customers paid, incl. GST
  gstCollected: number;
  refunds: number; // excl. GST
  netRevenue: number;
  cogs: number;
  cogsEstimatedUnits: number; // units costed at the item's average cost, not a batch
  cogsMissingUnits: number; // units with no cost at all
  grossProfit: number;
  shipping: number;
  gatewayFees: number;
  gatewayEstimated: number; // orders whose fee was estimated
  stockLosses: number;
  expenses: Array<{ category: string; label: string; amount: number }>;
  expensesTotal: number;
  netProfit: number;
}

export async function getProfitAndLoss(ym: string): Promise<PnL> {
  const { start, end } = monthRange(ym);
  const [orders, refunds, damage, matLoss, expenses, settings] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end }, status: { in: BOOKED_STATUSES } },
      select: {
        id: true, createdAt: true, status: true, total: true, subtotal: true, discount: true, shippingFee: true, taxAmount: true,
        shippingAddress: true, shippingState: true, invoiceNumber: true,
        paymentMethod: true, paymentFee: true, paymentFeeTax: true, paymentId: true,
        items: { select: { productId: true, variantId: true, quantity: true, price: true, gstRate: true, hsnCode: true } },
        shipments: { where: { status: { not: "CANCELLED" } }, select: { charge: true } },
      },
    }),
    prisma.refund.findMany({
      // Refunds on cancelled orders net to zero with the sale that isn't counted either.
      where: { createdAt: { gte: start, lt: end }, status: { not: "FAILED" }, order: { status: { in: BOOKED_STATUSES } } },
      select: { amount: true, order: { select: { id: true, createdAt: true, status: true, total: true, subtotal: true, discount: true, shippingFee: true, shippingAddress: true, shippingState: true, paymentMethod: true, items: { select: { price: true, quantity: true, gstRate: true } } } } },
    }),
    prisma.stockMovement.findMany({ where: { createdAt: { gte: start, lt: end }, reason: { in: ["DAMAGE", "COUNT"] } }, select: { id: true, productId: true, variantId: true, delta: true } }),
    prisma.materialMovement.findMany({ where: { createdAt: { gte: start, lt: end }, reason: { in: ["WASTAGE", "CORRECTION"] } }, select: { delta: true, material: { select: { avgCost: true } } } }),
    prisma.expense.findMany({ where: { date: { gte: start, lt: end } } }),
    getStoreSettings(),
  ]);
  // GST inside each sale, worked out the same way as on the invoice.
  const taxOf = (o: any) => (o?.items?.length ? computeInvoice(o, settings).taxTotal : 0);

  // Costs per product / size for anything not taken from a batch.
  const ids = [...new Set([...orders.flatMap((o: any) => o.items.map((i: any) => i.productId)), ...damage.map((d: any) => d.productId)].filter(Boolean))] as string[];
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, costPrice: true, variants: { select: { id: true, costPrice: true } } } });
  const costOf = (productId: string | null, variantId: string | null) => {
    const p: any = products.find((x: any) => x.id === productId);
    if (!p) return null;
    const v = variantId ? p.variants.find((x: any) => x.id === variantId) : null;
    return v?.costPrice ?? p.costPrice ?? null;
  };

  const orderIds = orders.map((o: any) => o.id);
  const movementIds = damage.map((d: any) => d.id);
  const allocations = await prisma.lotAllocation.findMany({
    where: { OR: [{ orderId: { in: orderIds } }, { movementId: { in: movementIds } }], qty: { gt: 0 } },
    select: { orderId: true, movementId: true, qty: true, unitCost: true, lot: { select: { productId: true, variantId: true } } },
  });

  // Cost of goods sold: batch cost where known, else average cost.
  let cogs = 0;
  let estimated = 0;
  let missing = 0;
  for (const o of orders as any[]) {
    const allocs = allocations.filter((a: any) => a.orderId === o.id);
    for (const it of o.items) {
      const mine = allocs.filter((a: any) => a.lot.productId === it.productId && (a.lot.variantId ?? null) === (it.variantId ?? null));
      const fromLots = mine.reduce((s: number, a: any) => s + a.qty, 0);
      cogs += mine.reduce((s: number, a: any) => s + a.qty * a.unitCost, 0);
      const rest = Math.max(0, it.quantity - fromLots);
      if (!rest) continue;
      const c = costOf(it.productId, it.variantId);
      if (c === null) missing += rest;
      else { cogs += rest * c; estimated += rest; }
    }
  }

  // Stock written off or lost in counts (a count gain reduces the loss).
  let stockLosses = 0;
  for (const d of damage as any[]) {
    const allocs = allocations.filter((a: any) => a.movementId === d.id);
    const fromLots = allocs.reduce((s: number, a: any) => s + a.qty, 0);
    const unit = costOf(d.productId, d.variantId) ?? 0;
    if (d.delta < 0) stockLosses += allocs.reduce((s: number, a: any) => s + a.qty * a.unitCost, 0) + Math.max(0, -d.delta - fromLots) * unit;
    else stockLosses -= d.delta * unit;
  }
  for (const m of matLoss as any[]) stockLosses -= m.delta * (m.material?.avgCost ?? 0);

  const sales = r2(orders.reduce((s: number, o: any) => s + o.total, 0));
  const gstCollected = r2(orders.reduce((s: number, o: any) => s + taxOf(o), 0));
  const refundNet = r2(refunds.reduce((s: number, r: any) => s + r.amount * (r.order?.total ? 1 - taxOf(r.order) / r.order.total : 1), 0));
  const netRevenue = r2(sales - gstCollected - refundNet);
  const shipping = r2(orders.reduce((s: number, o: any) => s + o.shipments.reduce((a: number, sh: any) => a + (sh.charge ?? 0), 0), 0));

  let gatewayFees = 0;
  let gatewayEstimated = 0;
  for (const o of orders as any[]) {
    if (o.paymentMethod !== "ONLINE" || !o.paymentId) continue;
    if (o.paymentFee !== null && o.paymentFee !== undefined) gatewayFees += o.paymentFee - (o.paymentFeeTax ?? 0);
    else { gatewayFees += o.total * ESTIMATED_GATEWAY_RATE; gatewayEstimated++; }
  }

  const byCat = new Map<string, number>();
  for (const e of expenses as any[]) {
    if (CASH_ONLY_CATEGORIES.has(e.category)) continue;
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + expenseCost(e));
  }
  const expenseRows = [...byCat.entries()].map(([category, amount]) => ({ category, label: expenseLabel(category), amount: r2(amount) })).sort((a, b) => b.amount - a.amount);
  const expensesTotal = r2(expenseRows.reduce((s, e) => s + e.amount, 0));

  const grossProfit = r2(netRevenue - cogs);
  const netProfit = r2(grossProfit - shipping - gatewayFees - stockLosses - expensesTotal);
  return {
    ym, orders: orders.length, sales, gstCollected, refunds: refundNet, netRevenue, cogs: r2(cogs), cogsEstimatedUnits: estimated, cogsMissingUnits: missing,
    grossProfit, shipping, gatewayFees: r2(gatewayFees), gatewayEstimated, stockLosses: r2(stockLosses), expenses: expenseRows, expensesTotal, netProfit,
  };
}

// ───────────── Cash ─────────────

export interface CashMonth {
  ym: string;
  onlineIn: number;
  codIn: number;
  refundsOut: number;
  suppliersOut: number;
  expensesOut: number;
  feesOut: number;
  net: number;
}

export async function getCashMonth(ym: string): Promise<CashMonth> {
  const { start, end } = monthRange(ym);
  const [online, cod, refunds, supplier, expenses] = await Promise.all([
    prisma.order.findMany({ where: { paymentMethod: "ONLINE", paidAt: { gte: start, lt: end }, paymentId: { not: null } }, select: { total: true, paymentFee: true } }),
    prisma.codRemittance.aggregate({ where: { date: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.refund.aggregate({ where: { createdAt: { gte: start, lt: end }, status: "PROCESSED" }, _sum: { amount: true } }),
    prisma.supplierPayment.aggregate({ where: { date: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { paidAt: { gte: start, lt: end }, paidVia: { not: "UNPAID" } }, _sum: { total: true } }),
  ]);
  const onlineIn = r2(online.reduce((s: number, o: any) => s + o.total, 0));
  const feesOut = r2(online.reduce((s: number, o: any) => s + (o.paymentFee ?? o.total * ESTIMATED_GATEWAY_RATE * 1.18), 0));
  const m = {
    ym, onlineIn, codIn: r2(cod._sum.amount ?? 0), feesOut,
    refundsOut: r2(refunds._sum.amount ?? 0), suppliersOut: r2(supplier._sum.amount ?? 0), expensesOut: r2(expenses._sum.total ?? 0),
  };
  return { ...m, net: r2(m.onlineIn + m.codIn - m.feesOut - m.refundsOut - m.suppliersOut - m.expensesOut) };
}

/** Money owed to us and by us right now. */
export async function getPositions() {
  const [unsettled, codDue, pos, unpaidExpenses] = await Promise.all([
    prisma.order.findMany({
      where: { paymentMethod: "ONLINE", paymentId: { not: null }, paidAt: { not: null }, settledAt: null, status: { in: BOOKED_STATUSES } },
      select: { total: true, paymentFee: true, refundedAmount: true, paidAt: true },
    }),
    prisma.order.findMany({ where: { paymentMethod: "COD", status: "DELIVERED", codRemittanceId: null }, select: { total: true, deliveredAt: true } }),
    prisma.purchaseOrder.findMany({ where: { status: { in: ["PARTIAL", "RECEIVED"] } }, include: { lines: { select: { qty: true, rate: true, receivedQty: true } }, supplier: { select: { name: true } } } }),
    prisma.expense.aggregate({ where: { paidVia: "UNPAID" }, _sum: { total: true }, _count: { _all: true } }),
  ]);
  const anySettled = await prisma.order.count({ where: { settledAt: { not: null } } });
  const supplierDue = pos.reduce((s: number, p: any) => s + Math.max(0, receivedValue(p) - p.paidAmount), 0);
  const oldestCod = codDue.reduce<Date | null>((min, o: any) => (!o.deliveredAt ? min : !min || o.deliveredAt < min ? o.deliveredAt : min), null);
  return {
    razorpayUnsettled: r2(unsettled.reduce((s: number, o: any) => s + o.total - (o.paymentFee ?? 0) - (o.refundedAmount ?? 0), 0)),
    razorpayUnsettledOrders: unsettled.length,
    razorpaySynced: anySettled > 0,
    codDue: r2(codDue.reduce((s: number, o: any) => s + o.total, 0)),
    codDueOrders: codDue.length,
    codOldest: oldestCod,
    supplierDue: r2(supplierDue),
    unpaidExpenses: r2(unpaidExpenses._sum.total ?? 0),
    unpaidExpenseCount: unpaidExpenses._count._all,
  };
}

/** What we owe for goods received on a PO (its total, pro rata to what arrived). */
export function receivedValue(po: { total: number; lines: Array<{ qty: number; rate: number; receivedQty: number }> }) {
  const ordered = po.lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const received = po.lines.reduce((s, l) => s + Math.min(l.qty, l.receivedQty) * l.rate, 0);
  return ordered > 0 ? r2((po.total * received) / ordered) : 0;
}

// ───────────── GST ─────────────

export async function getGstReturn(ym: string) {
  const { start, end } = monthRange(ym);
  const settings = await getStoreSettings();
  const businessCode = stateCode(settings.businessState);
  const [orders, refunds, pos, expenses, feeOrders] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end }, status: { in: BOOKED_STATUSES }, invoiceNumber: { not: null } },
      orderBy: { invoiceNumber: "asc" },
      include: { items: true },
    }),
    prisma.refund.findMany({
      where: { createdAt: { gte: start, lt: end }, status: { not: "FAILED" }, order: { invoiceNumber: { not: null }, status: { in: BOOKED_STATUSES } } },
      include: { order: { select: { id: true, invoiceNumber: true, total: true, taxAmount: true, shippingState: true, shippingAddress: true, customerName: true } } },
    }),
    prisma.purchaseOrder.findMany({
      where: { status: { in: ["PARTIAL", "RECEIVED"] }, supplier: { gstin: { not: null } }, OR: [{ supplierInvoiceDate: { gte: start, lt: end } }, { supplierInvoiceDate: null, updatedAt: { gte: start, lt: end } }] },
      include: { supplier: true, lines: { select: { qty: true, rate: true, receivedQty: true } } },
    }),
    prisma.expense.findMany({ where: { date: { gte: start, lt: end }, vendorGstin: { not: null }, gstAmount: { gt: 0 } } }),
    prisma.order.aggregate({ where: { paidAt: { gte: start, lt: end }, paymentFeeTax: { not: null } }, _sum: { paymentFeeTax: true } }),
  ]);

  const invoices: InvoiceForReturn[] = orders.map((o: any) => {
    const inv = computeInvoice(o, settings);
    return {
      invoiceNumber: inv.invoiceNumber, date: o.createdAt, customerName: o.customerName, customerGstin: o.customerGstin ?? null,
      placeOfSupply: inv.placeOfSupply, sameState: inv.sameState, total: o.total,
      lines: inv.lines.map((l, i) => ({ hsnCode: l.hsnCode, description: o.items[i]?.productName ?? "", qty: o.items[i]?.quantity ?? 0, rate: l.rate, taxable: l.taxable, tax: l.tax })),
      shipping: inv.shippingLine,
    };
  });
  const gstr1 = buildGstr1(invoices, settings.businessState);

  const creditNotes = refunds.map((r: any) => {
    const tax = r.order.total ? r2((r.amount * (r.order.taxAmount || 0)) / r.order.total) : 0;
    const state = r.order.shippingState ?? null;
    return { date: r.createdAt, invoice: r.order.invoiceNumber, customer: r.order.customerName, amount: r.amount, taxable: r2(r.amount - tax), tax, sameState: sameStateAs(settings.businessState, state), reason: r.reason };
  });
  const cnTotals = refundTax(refunds.map((r: any) => ({ amount: r.amount, orderTotal: r.order.total, orderTax: r.order.taxAmount || 0, sameState: sameStateAs(settings.businessState, r.order.shippingState) })));

  const itcRows = [
    ...pos.map((p: any) => {
      const share = (() => {
        const ordered = p.lines.reduce((s: number, l: any) => s + l.qty * l.rate, 0);
        const got = p.lines.reduce((s: number, l: any) => s + Math.min(l.qty, l.receivedQty) * l.rate, 0);
        return ordered ? got / ordered : 0;
      })();
      return { source: `${p.number} · ${p.supplier.name}`, gstin: p.supplier.gstin, billNo: p.supplierInvoiceNo, date: p.supplierInvoiceDate ?? p.updatedAt, taxable: r2(p.subtotal * share), tax: r2(p.taxTotal * share), sameState: !businessCode || gstinState(p.supplier.gstin) === businessCode };
    }),
    ...expenses.map((e: any) => ({ source: `${expenseLabel(e.category)} · ${e.vendor ?? e.description}`, gstin: e.vendorGstin, billNo: e.billNo, date: e.date, taxable: e.amount, tax: e.gstAmount, sameState: !businessCode || gstinState(e.vendorGstin) === businessCode })),
  ];
  const razorpayFeeTax = r2(feeOrders._sum.paymentFeeTax ?? 0);
  if (razorpayFeeTax > 0) {
    itcRows.push({ source: "Razorpay payment gateway fees", gstin: "Razorpay", billNo: "Monthly tax invoice", date: end, taxable: r2(razorpayFeeTax / 0.18), tax: razorpayFeeTax, sameState: businessCode === "29" });
  }
  const itc = itcTotals(itcRows.map((r) => ({ tax: r.tax, sameState: r.sameState })));

  const outward = {
    taxable: r2(gstr1.totals.taxable - cnTotals.taxable),
    igst: r2(gstr1.totals.igst - cnTotals.igst),
    cgst: r2(gstr1.totals.cgst - cnTotals.cgst),
    sgst: r2(gstr1.totals.sgst - cnTotals.sgst),
  };
  const payable = { igst: r2(outward.igst - itc.igst), cgst: r2(outward.cgst - itc.cgst), sgst: r2(outward.sgst - itc.sgst) };

  const cancelledInvoices = await prisma.order.findMany({ where: { createdAt: { gte: start, lt: end }, status: { notIn: BOOKED_STATUSES }, invoiceNumber: { not: null } }, select: { invoiceNumber: true }, orderBy: { invoiceNumber: "asc" } });
  const uninvoiced = await prisma.order.aggregate({ where: { createdAt: { gte: start, lt: end }, status: { in: BOOKED_STATUSES }, invoiceNumber: null }, _count: { _all: true }, _sum: { total: true } });
  const missingHsn = orders.reduce((s: number, o: any) => s + o.items.filter((i: any) => !i.hsnCode).length, 0);
  return { ym, gstin: settings.gstin, legalName: settings.legalName, businessState: settings.businessState, gstr1, creditNotes, cnTotals, itcRows, itc, outward, payable, missingHsn, invoiceCount: orders.length, uninvoiced: { count: uninvoiced._count._all, value: r2(uninvoiced._sum.total ?? 0) }, cancelledInvoices: cancelledInvoices.map((o: any) => o.invoiceNumber as string), docsIssued: docsIssued(orders.map((o: any) => o.invoiceNumber), cancelledInvoices.map((o: any) => o.invoiceNumber)) };
}

/** GSTR-1 table 13: the full invoice-number range issued in the month, cancelled ones included. */
function docsIssued(valid: string[], cancelled: string[]) {
  const all = [...valid, ...cancelled].filter(Boolean).sort();
  return { from: all[0] ?? null, to: all[all.length - 1] ?? null, total: all.length, cancelled: cancelled.length };
}
