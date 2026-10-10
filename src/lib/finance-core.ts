// Money maths: periods, expenses, GST return summaries, CSV. Pure — safe for client components and tests.

import { stateCode } from "./gst";

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const EXPENSE_CATEGORIES = [
  { key: "PACKAGING", label: "Packaging (jars, labels, boxes, tape)" },
  { key: "COURIER", label: "Courier & delivery (not booked in admin)" },
  { key: "WALLET", label: "Courier wallet top-up (cash only)" },
  { key: "SALARY", label: "Salaries & wages" },
  { key: "RENT", label: "Rent" },
  { key: "UTILITIES", label: "Electricity, water, internet, phone" },
  { key: "MARKETING", label: "Ads & marketing" },
  { key: "SOFTWARE", label: "Website, apps & software" },
  { key: "FEES", label: "Bank & payment charges" },
  { key: "TRAVEL", label: "Travel & transport" },
  { key: "REPAIRS", label: "Repairs & maintenance" },
  { key: "PROFESSIONAL", label: "CA, legal & licences (FSSAI, GST)" },
  { key: "OFFICE", label: "Office & shop supplies" },
  { key: "OTHER", label: "Other" },
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["key"];
export const expenseLabel = (k: string) => EXPENSE_CATEGORIES.find((c) => c.key === k)?.label.split(" (")[0] ?? k;

export const PAY_METHODS = [
  { key: "UPI", label: "UPI" },
  { key: "BANK", label: "Bank transfer" },
  { key: "CASH", label: "Cash" },
  { key: "CARD", label: "Card" },
  { key: "CHEQUE", label: "Cheque" },
] as const;

/** GST on a bill counts as cost unless the vendor is GST registered (then it is claimed back). */
export const expenseCost = (e: { amount: number; total: number; vendorGstin?: string | null }) => (e.vendorGstin ? e.amount : e.total);

// ── Periods (India time) ──

const IST = 5.5 * 36e5;
export const ymOf = (d: Date | string) => new Date(new Date(d).getTime() + IST).toISOString().slice(0, 7);

/** "2026-10" → [1 Oct 00:00 IST, 1 Nov 00:00 IST). */
export function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - IST);
  const end = new Date(Date.UTC(y, m, 1) - IST);
  return { start, end };
}

/** The last `n` months, oldest first, ending with the month of `now`. */
export function lastMonths(n: number, now = new Date()) {
  const cur = ymOf(now);
  const [y, m] = cur.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

export const monthLabel = (ym: string, long = false) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-IN", { month: long ? "long" : "short", year: "numeric", timeZone: "UTC" });
};

/** GST return period code, e.g. "102026" for October 2026. */
export const gstPeriod = (ym: string) => `${ym.slice(5, 7)}${ym.slice(0, 4)}`;

// ── GST returns ──

export interface InvoiceForReturn {
  invoiceNumber: string;
  date: Date | string;
  customerName: string;
  customerGstin: string | null;
  placeOfSupply: string | null; // state name
  sameState: boolean | null;
  total: number;
  lines: Array<{ hsnCode: string | null; description: string; qty: number; rate: number; taxable: number; tax: number }>;
  shipping: { taxable: number; tax: number; rate: number };
}

export interface TaxSplit { taxable: number; igst: number; cgst: number; sgst: number }

const split = (taxable: number, tax: number, intra: boolean): TaxSplit =>
  intra ? { taxable, igst: 0, cgst: r2(tax / 2), sgst: r2(tax - r2(tax / 2)) } : { taxable, igst: tax, cgst: 0, sgst: 0 };

const add = (a: TaxSplit, b: TaxSplit): TaxSplit => ({ taxable: r2(a.taxable + b.taxable), igst: r2(a.igst + b.igst), cgst: r2(a.cgst + b.cgst), sgst: r2(a.sgst + b.sgst) });
const ZERO: TaxSplit = { taxable: 0, igst: 0, cgst: 0, sgst: 0 };

/** Lines of an invoice with shipping folded into the main item (composite supply). */
function withShipping(inv: InvoiceForReturn) {
  const lines = inv.lines.map((l) => ({ ...l }));
  if (inv.shipping.taxable || inv.shipping.tax) {
    const main = lines.reduce((best, l, i) => (l.taxable > (lines[best]?.taxable ?? -1) ? i : best), 0);
    if (lines[main]) {
      lines[main].taxable = r2(lines[main].taxable + inv.shipping.taxable);
      lines[main].tax = r2(lines[main].tax + inv.shipping.tax);
    }
  }
  return lines;
}

/** B2C invoices to another state above this value are reported one by one (B2CL). */
export const B2CL_LIMIT = 100000;

/**
 * GSTR-1 tables for a month: B2B invoice-wise, B2C large, B2C small by state and rate,
 * HSN summary and documents issued. Unknown customer state is treated as within the state.
 */
export function buildGstr1(invoices: InvoiceForReturn[], businessState: string | null) {
  const b2b: Array<{ gstin: string; name: string; invoice: string; date: string; value: number; pos: string; rate: number } & TaxSplit> = [];
  const b2cl: Array<{ invoice: string; date: string; value: number; pos: string; rate: number } & TaxSplit> = [];
  const b2cs = new Map<string, { pos: string; rate: number; type: "Intra-state" | "Inter-state" } & TaxSplit>();
  type HsnRow = { hsn: string; description: string; qty: number; rate: number; value: number } & TaxSplit;
  const hsn = new Map<string, HsnRow>();
  // GSTR-1 table 12 is reported separately for sales to registered buyers (B2B) and consumers (B2C).
  const hsnB2b = new Map<string, HsnRow>();
  const hsnB2c = new Map<string, HsnRow>();
  const posName = (s: string | null) => {
    const name = s || businessState || "";
    const code = stateCode(name);
    return code ? `${code}-${name}` : name;
  };

  for (const inv of invoices) {
    const intra = inv.sameState !== false;
    const date = new Date(inv.date).toISOString().slice(0, 10);
    const lines = withShipping(inv);
    const byRate = new Map<number, { taxable: number; tax: number }>();
    for (const l of lines) {
      const cur = byRate.get(l.rate) ?? { taxable: 0, tax: 0 };
      byRate.set(l.rate, { taxable: r2(cur.taxable + l.taxable), tax: r2(cur.tax + l.tax) });
      const key = `${l.hsnCode ?? "—"}|${l.rate}`;
      const part = split(l.taxable, l.tax, intra);
      for (const m of [hsn, inv.customerGstin ? hsnB2b : hsnB2c]) {
        const h = m.get(key) ?? { hsn: l.hsnCode ?? "—", description: l.description, qty: 0, rate: l.rate, value: 0, ...ZERO };
        m.set(key, { ...h, ...add(h, part), qty: h.qty + l.qty, value: r2(h.value + l.taxable + l.tax) });
      }
    }
    for (const [rate, v] of byRate) {
      const s = split(v.taxable, v.tax, intra);
      const pos = posName(inv.placeOfSupply);
      if (inv.customerGstin) b2b.push({ gstin: inv.customerGstin, name: inv.customerName, invoice: inv.invoiceNumber, date, value: inv.total, pos, rate, ...s });
      else if (!intra && inv.total > B2CL_LIMIT) b2cl.push({ invoice: inv.invoiceNumber, date, value: inv.total, pos, rate, ...s });
      else {
        const key = `${pos}|${rate}`;
        const cur = b2cs.get(key) ?? { pos, rate, type: intra ? "Intra-state" : "Inter-state", ...ZERO };
        b2cs.set(key, { ...cur, ...add(cur, s) });
      }
    }
  }

  const all = [...b2b, ...b2cl, ...b2cs.values()].reduce<TaxSplit>((a, b) => add(a, b), ZERO);
  const numbers = invoices.map((i) => i.invoiceNumber).sort();
  return {
    b2b,
    b2cl,
    b2cs: [...b2cs.values()].sort((a, b) => a.pos.localeCompare(b.pos) || a.rate - b.rate),
    hsn: [...hsn.values()].sort((a, b) => a.hsn.localeCompare(b.hsn) || a.rate - b.rate),
    hsnB2b: [...hsnB2b.values()].sort((a, b) => a.hsn.localeCompare(b.hsn) || a.rate - b.rate),
    hsnB2c: [...hsnB2c.values()].sort((a, b) => a.hsn.localeCompare(b.hsn) || a.rate - b.rate),
    docs: { from: numbers[0] ?? null, to: numbers[numbers.length - 1] ?? null, count: numbers.length },
    totals: all,
  };
}

export interface CreditNoteInput { amount: number; orderTotal: number; orderTax: number; sameState: boolean | null }

/** Tax inside refunds, which reduces the month's output tax (issue these as credit notes). */
export function refundTax(refunds: CreditNoteInput[]): TaxSplit {
  return refunds.reduce<TaxSplit>((acc, r) => {
    const tax = r.orderTotal > 0 ? r2((r.amount * r.orderTax) / r.orderTotal) : 0;
    return add(acc, split(r2(r.amount - tax), tax, r.sameState !== false));
  }, ZERO);
}

export interface ItcInput { tax: number; sameState: boolean }

/** Input tax credit from GST-registered suppliers, split by supplier state. */
export function itcTotals(items: ItcInput[]): TaxSplit {
  return items.reduce<TaxSplit>((acc, i) => add(acc, { ...split(0, i.tax, i.sameState), taxable: 0 }), ZERO);
}

// ── CSV ──

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(headers: string[], rows: Array<Array<unknown>>) {
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}
