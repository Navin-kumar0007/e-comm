// GST maths for tax-inclusive prices. Pure functions, shared by checkout and invoices.
//
// Every price on the site already includes GST. For each line we take the amount the
// customer actually pays (after its share of the order discount) and extract the tax
// at that line's rate. Shipping charged on the order is part of a composite supply,
// so it is taxed at the rate of the principal (highest-value) item.

export interface GstLineInput {
  amount: number; // price × qty, GST included
  gstRate: number; // %
}

export interface GstLine {
  gross: number; // before discount
  discount: number; // this line's share of the order discount
  net: number; // what the customer pays for this line
  taxable: number;
  tax: number;
  rate: number;
}

export interface GstSplit {
  lines: GstLine[];
  shipping: { net: number; taxable: number; tax: number; rate: number };
  taxableTotal: number;
  taxTotal: number;
  total: number;
  /** Tax per rate, e.g. { 5: 31.5, 12: 10.2 } — for the HSN / rate summary. */
  byRate: Array<{ rate: number; taxable: number; tax: number }>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function extract(net: number, rate: number) {
  const taxable = round2((net * 100) / (100 + rate));
  return { taxable, tax: round2(net - taxable) };
}

export function splitGst(input: { lines: GstLineInput[]; discount?: number; shipping?: number; defaultRate: number }): GstSplit {
  const discount = Math.max(0, input.discount ?? 0);
  const shipping = Math.max(0, input.shipping ?? 0);
  const grossTotal = input.lines.reduce((s, l) => s + l.amount, 0);

  // Spread the discount across lines by value; the last line absorbs rounding.
  let allocated = 0;
  const lines: GstLine[] = input.lines.map((l, i) => {
    const share = i === input.lines.length - 1
      ? round2(Math.min(discount, grossTotal) - allocated)
      : grossTotal > 0 ? round2((Math.min(discount, grossTotal) * l.amount) / grossTotal) : 0;
    allocated = round2(allocated + share);
    const net = round2(Math.max(0, l.amount - share));
    const rate = Number.isFinite(l.gstRate) ? l.gstRate : input.defaultRate;
    return { gross: round2(l.amount), discount: share, net, rate, ...extract(net, rate) };
  });

  const principal = lines.reduce<GstLine | null>((best, l) => (!best || l.net > best.net ? l : best), null);
  const shipRate = principal?.rate ?? input.defaultRate;
  const ship = { net: round2(shipping), rate: shipRate, ...extract(shipping, shipRate) };

  const byRateMap = new Map<number, { taxable: number; tax: number }>();
  for (const part of [...lines, ship]) {
    if (part.net <= 0) continue;
    const r = byRateMap.get(part.rate) ?? { taxable: 0, tax: 0 };
    byRateMap.set(part.rate, { taxable: round2(r.taxable + part.taxable), tax: round2(r.tax + part.tax) });
  }

  const taxTotal = round2(lines.reduce((s, l) => s + l.tax, 0) + ship.tax);
  const taxableTotal = round2(lines.reduce((s, l) => s + l.taxable, 0) + ship.taxable);
  return {
    lines,
    shipping: ship,
    taxableTotal,
    taxTotal,
    total: round2(taxableTotal + taxTotal),
    byRate: [...byRateMap.entries()].sort((a, b) => a[0] - b[0]).map(([rate, v]) => ({ rate, ...v })),
  };
}

// ---------- Amount in words (Indian numbering) ----------

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number) {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function threeDigits(n: number) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? twoDigits(rest) : ""].filter(Boolean).join(" ");
}

function integerWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const rest = n % 1e3;
  if (crore) parts.push(`${integerWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ");
}

/** 1234.5 → "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only" */
export function amountInWords(amount: number): string {
  const paiseTotal = Math.round(Math.abs(amount) * 100);
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  return `Rupees ${integerWords(rupees)}${paise ? ` and ${twoDigits(paise)} Paise` : ""} Only`;
}

// ---------- GST state codes (first two digits of a GSTIN) ----------

export const GST_STATE_CODES: Record<string, string> = {
  "jammu and kashmir": "01", "himachal pradesh": "02", punjab: "03", chandigarh: "04", uttarakhand: "05",
  haryana: "06", delhi: "07", rajasthan: "08", "uttar pradesh": "09", bihar: "10", sikkim: "11",
  "arunachal pradesh": "12", nagaland: "13", manipur: "14", mizoram: "15", tripura: "16", meghalaya: "17",
  assam: "18", "west bengal": "19", jharkhand: "20", odisha: "21", chhattisgarh: "22", "madhya pradesh": "23",
  gujarat: "24", "dadra and nagar haveli and daman and diu": "26", maharashtra: "27", karnataka: "29", goa: "30",
  lakshadweep: "31", kerala: "32", "tamil nadu": "33", puducherry: "34", "andaman and nicobar islands": "35",
  telangana: "36", "andhra pradesh": "37", ladakh: "38",
};

export function stateCode(state?: string | null): string | null {
  if (!state) return null;
  return GST_STATE_CODES[state.toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim()] ?? null;
}

/** Basic GSTIN format check (15 chars: state code, PAN, entity, Z, checksum). */
export function isValidGstin(gstin: string): boolean {
  return /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.trim().toUpperCase());
}
