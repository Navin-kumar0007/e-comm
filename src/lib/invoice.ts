// Invoice figures derived from what the order actually stored at checkout.
// Pure functions — safe to use from server and client components.

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
  items: Array<{ price: number; quantity: number }>;
}

export interface InvoiceBreakdown {
  invoiceNumber: string;
  isFinalInvoice: boolean; // false => order not yet confirmed (no invoice number issued)
  isTaxInvoice: boolean;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  taxableValue: number;
  taxTotal: number;
  taxLines: Array<{ label: string; amount: number }>;
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

  // Prices are GST-inclusive: extract the tax contained in the total.
  const taxTotal = order.taxAmount && order.taxAmount > 0
    ? order.taxAmount
    : round2((total * settings.gstRate) / (100 + settings.gstRate));
  const taxableValue = round2(total - taxTotal);

  const customerState = stateOf(order);
  const sameState =
    settings.businessState && customerState ? norm(settings.businessState) === norm(customerState) : null;

  const rate = settings.gstRate;
  let taxLines: InvoiceBreakdown["taxLines"];
  if (sameState === true) {
    const half = round2(taxTotal / 2);
    taxLines = [
      { label: `CGST (${rate / 2}%)`, amount: half },
      { label: `SGST (${rate / 2}%)`, amount: round2(taxTotal - half) },
    ];
  } else if (sameState === false) {
    taxLines = [{ label: `IGST (${rate}%)`, amount: taxTotal }];
  } else {
    taxLines = [{ label: `GST (${rate}%)`, amount: taxTotal }];
  }

  return {
    invoiceNumber: order.invoiceNumber ?? `NW-${order.id.slice(-8).toUpperCase()}`,
    isFinalInvoice: !!order.invoiceNumber,
    isTaxInvoice: !!settings.gstin,
    subtotal,
    discount,
    shipping,
    total,
    taxableValue,
    taxTotal,
    taxLines,
  };
}
