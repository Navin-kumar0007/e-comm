// Warehouse maths. Pure functions, no database — safe for client components and unit tests.

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const round3 = (n: number) => Math.round(n * 1000) / 1000;

export interface LotLike {
  id: string;
  qtyLeft: number;
  expiryDate: Date | string | null;
  receivedAt: Date | string;
}

const time = (d: Date | string | null) => (d ? new Date(d).getTime() : Number.POSITIVE_INFINITY);

/** Order lots first-expiry-first-out; lots without expiry go last, oldest receipt first. */
export function fefoOrder<T extends LotLike>(lots: T[]): T[] {
  return [...lots].sort((a, b) => time(a.expiryDate) - time(b.expiryDate) || time(a.receivedAt) - time(b.receivedAt));
}

/** Which lots to take `qty` from. `short` is what no lot could cover (stock not yet assigned to a batch). */
export function planFefo<T extends LotLike>(lots: T[], qty: number) {
  const takes: Array<{ lot: T; take: number }> = [];
  let need = qty;
  for (const lot of fefoOrder(lots)) {
    if (need <= 1e-9) break;
    if (lot.qtyLeft <= 0) continue;
    const take = Math.min(lot.qtyLeft, need);
    takes.push({ lot, take: round3(take) });
    need -= take;
  }
  return { takes, short: round3(Math.max(0, need)) };
}

/** Weighted average cost after adding stock. */
export function weightedAvgCost(oldQty: number, oldCost: number, addQty: number, addCost: number) {
  const q = Math.max(0, oldQty) + addQty;
  if (q <= 0) return round2(addCost);
  return round2((Math.max(0, oldQty) * oldCost + addQty * addCost) / q);
}

/** "250g" → 250, "1kg" → 1000, "1.5 kg" → 1500, "500 gm" → 500. Null when no weight is found. */
export function parseGrams(label: string | null | undefined): number | null {
  const m = (label || "").toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|gms|gram|grams)\b/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Math.round(m[2].startsWith("k") ? n * 1000 : n);
}

export interface PurchaseLineInput {
  qty: number;
  rate: number; // ₹ per unit before GST
  gstRate: number;
}

/**
 * Purchase totals and landed cost per unit.
 * Freight is shared by line value. GST is left out of cost when it can be claimed back
 * (supplier has a GSTIN), and added to cost when it can't.
 */
export function purchaseTotals(lines: PurchaseLineInput[], freight = 0, gstClaimable = true) {
  const values = lines.map((l) => l.qty * l.rate);
  const subtotal = values.reduce((s, v) => s + v, 0);
  const taxes = lines.map((l, i) => (values[i] * (l.gstRate || 0)) / 100);
  const taxTotal = taxes.reduce((s, v) => s + v, 0);
  const landed = lines.map((l, i) => {
    if (!l.qty) return 0;
    const freightShare = subtotal > 0 ? (freight * values[i]) / subtotal : 0;
    const tax = gstClaimable ? 0 : taxes[i];
    return round2((values[i] + freightShare + tax) / l.qty);
  });
  return { subtotal: round2(subtotal), taxTotal: round2(taxTotal), total: round2(subtotal + taxTotal + freight), landed };
}

export interface RepackOutput {
  grams: number; // pack size
  packs: number;
}

/**
 * Bulk → packs. Wastage is whatever went in but didn't come out in packs,
 * and its cost is carried by the packs that were made.
 */
export function repackPlan(input: { inputKg: number; costPerKg: number; packingCost: number; outputs: RepackOutput[] }) {
  const outputKg = round3(input.outputs.reduce((s, o) => s + (o.grams * o.packs) / 1000, 0));
  const wastageKg = round3(input.inputKg - outputKg);
  const effectivePerKg = outputKg > 0 ? (input.inputKg * input.costPerKg) / outputKg : 0;
  const packCosts = input.outputs.map((o) => round2((effectivePerKg * o.grams) / 1000 + input.packingCost));
  const wastagePct = input.inputKg > 0 ? round2((wastageKg / input.inputKg) * 100) : 0;
  let error: string | null = null;
  if (!(input.inputKg > 0)) error = "Enter how much bulk stock was used.";
  else if (outputKg <= 0) error = "Enter the packs made.";
  else if (outputKg > input.inputKg + 1e-6) error = `Packs add up to ${outputKg} kg, more than the ${input.inputKg} kg used.`;
  return { outputKg, wastageKg, wastagePct, effectivePerKg: round2(effectivePerKg), packCosts, error };
}

export type ReorderStatus = "OUT" | "REORDER" | "OK" | "NO_SALES";

/** Days of stock left and how much to buy, from the last `windowDays` of sales. */
export function reorderSuggestion(p: { stock: number; sold: number; windowDays?: number; leadDays?: number; coverDays?: number; threshold?: number }) {
  const windowDays = p.windowDays ?? 30;
  const leadDays = p.leadDays ?? 7;
  const coverDays = p.coverDays ?? 30;
  const perDay = p.sold / windowDays;
  const daysLeft = perDay > 0 ? Math.floor(p.stock / perDay) : null;
  const needAt = perDay * (leadDays + 7); // lead time + a week of safety stock
  let status: ReorderStatus;
  if (p.stock <= 0) status = "OUT";
  else if (perDay === 0) status = p.threshold !== undefined && p.stock <= p.threshold ? "REORDER" : "NO_SALES";
  else status = p.stock <= needAt || (p.threshold !== undefined && p.stock <= p.threshold) ? "REORDER" : "OK";
  const target = perDay * (leadDays + coverDays);
  const suggestQty = status === "OK" || status === "NO_SALES" ? 0 : Math.max(0, Math.ceil(target - p.stock));
  return { perDay: round2(perDay), daysLeft, status, suggestQty };
}

export type ExpiryStatus = "EXPIRED" | "SOON" | "OK" | "NONE";

export function expiryStatus(expiry: Date | string | null | undefined, now = new Date(), soonDays = 30): ExpiryStatus {
  if (!expiry) return "NONE";
  const ms = new Date(expiry).getTime() - now.getTime();
  if (ms < 0) return "EXPIRED";
  return ms <= soonDays * 864e5 ? "SOON" : "OK";
}

export function daysUntil(d: Date | string, now = new Date()) {
  return Math.ceil((new Date(d).getTime() - now.getTime()) / 864e5);
}

/** India time parts, for document numbers. */
export function istParts(now = new Date()) {
  const ist = new Date(now.getTime() + 5.5 * 36e5);
  return { year: ist.getUTCFullYear(), month: ist.getUTCMonth() + 1 };
}

export const formatLotNumber = (now: Date, seq: number) => {
  const { year, month } = istParts(now);
  return `B${String(year).slice(2)}${String(month).padStart(2, "0")}-${String(seq).padStart(3, "0")}`;
};

export const formatDocNumber = (prefix: string, year: number, seq: number) => `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
