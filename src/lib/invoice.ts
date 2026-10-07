// Invoice figures derived from what the order actually stored at checkout.
// Pure functions — safe to use from server and client components.

import { splitGst } from "./gst";

export interface InvoiceSettings {
  storeName: string;
  contactEmail: string;
  gstRate: number;
  gstin: string | null;
  legalName: string | null;
  businessAddress: string | null;
  businessState: string | null;
}

export interface InvoiceOrder {
  id: string;
  createdAt: Date | string;
  paidAt?: Date | string | null;
  status: string;
  paymentMethod: string;
  total: number;
  subtotal?: number | null;
  discount: number;
  shippingFee?: number | null;
  taxAmount?: number | null;
  shippingAddress: string;
  shippingState?: string | null;
  invoiceNumber?: string | null;
  items: Array<{ price: number; quantity: number; gstRate?: number | null; hsnCode?: string | null }>;
}

export interface InvoiceLine {
  gross: number;
  discount: number;
  net: number;
  taxable: number;
  tax: number;
  rate: number;
  hsnCode: string | null;
}

export interface InvoiceBreakdown {
  invoiceNumber: string;
  isFinalInvoice: boolean; // false => order not yet confirmed (no invoice number issued)
  isTaxInvoice: boolean;
  /** true = CGST + SGST, false = IGST, null = customer state unknown */
  sameState: boolean | null;
  placeOfSupply: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  taxableValue: number;
  taxTotal: number;
  taxLines: Array<{ label: string; amount: number }>;
  /** Per item, in the order's item order. */
  lines: InvoiceLine[];
  shippingLine: { net: number; taxable: number; tax: number; rate: number };
  /** HSN-wise summary (GST rule for tax invoices). */
  hsnSummary: Array<{ hsnCode: string; rate: number; taxable: number; tax: number }>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function stateOf(order: InvoiceOrder) {
  if (order.shippingState) return order.shippingState;
  // Legacy orders: address stored as "street, city, state, pincode".
  const parts = order.shippingAddress.split(",").map((p) => p.trim());
  return parts.length >= 3 ? parts[parts.length - 2] : null;
}

export function computeInvoice(order: InvoiceOrder, settings: InvoiceSettings): InvoiceBreakdown {
  const itemsTotal = round2(order.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const subtotal = order.subtotal ?? itemsTotal;
  const discount = order.discount || 0;
  const shipping = order.shippingFee ?? 0;
  const total = order.total;

  // Prices are GST-inclusive: extract the tax inside each line at its own rate
  // (rate saved on the order line at sale; older orders use the store rate).
  const split = splitGst({
    lines: order.items.map((i) => ({ amount: i.price * i.quantity, gstRate: i.gstRate ?? settings.gstRate })),
    discount,
    shipping,
    defaultRate: settings.gstRate,
  });
  const taxTotal = split.taxTotal;
  const taxableValue = round2(total - taxTotal);

  const customerState = stateOf(order);
  const sameState =
    settings.businessState && customerState ? norm(settings.businessState) === norm(customerState) : null;

  const taxLines: InvoiceBreakdown["taxLines"] = [];
  for (const { rate, tax } of split.byRate) {
    if (sameState === true) {
      const half = round2(tax / 2);
      taxLines.push({ label: `CGST (${rate / 2}%)`, amount: half }, { label: `SGST (${rate / 2}%)`, amount: round2(tax - half) });
    } else {
      taxLines.push({ label: `${sameState === false ? "IGST" : "GST"} (${rate}%)`, amount: tax });
    }
  }

  const lines: InvoiceLine[] = split.lines.map((l, i) => ({ ...l, hsnCode: order.items[i]?.hsnCode ?? null }));
  const hsnMap = new Map<string, { hsnCode: string; rate: number; taxable: number; tax: number }>();
  for (const l of lines) {
    const key = `${l.hsnCode ?? "—"}|${l.rate}`;
    const cur = hsnMap.get(key) ?? { hsnCode: l.hsnCode ?? "—", rate: l.rate, taxable: 0, tax: 0 };
    hsnMap.set(key, { ...cur, taxable: round2(cur.taxable + l.taxable), tax: round2(cur.tax + l.tax) });
  }

  return {
    invoiceNumber: order.invoiceNumber ?? `NW-${order.id.slice(-8).toUpperCase()}`,
    isFinalInvoice: !!order.invoiceNumber,
    isTaxInvoice: !!settings.gstin,
    sameState,
    placeOfSupply: customerState,
    subtotal,
    discount,
    shipping,
    total,
    taxableValue,
    taxTotal,
    taxLines,
    lines,
    shippingLine: split.shipping,
    hsnSummary: [...hsnMap.values()],
  };
}
