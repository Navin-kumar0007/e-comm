'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import { allocateInvoiceNumber } from '@/lib/orders';
import { getStoreSettings } from '@/lib/store-settings';
import { logOrderEvent } from '@/lib/order-events';
import { adjustStock, notifyLowStock, StockError, type StockResult } from '@/lib/inventory';
import { splitGst, isValidGstin } from '@/lib/gst';
import { sendWhatsAppMessage, formatWhatsAppNumber } from '@/lib/whatsapp';
import { billUrl } from '@/lib/bill-link';
import { audit } from '@/lib/audit';

const r2 = (n: number) => Math.round(n * 100) / 100;
const IST = 5.5 * 36e5;
const istDayStart = (d = new Date()) => {
  const ist = new Date(d.getTime() + IST);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST);
};

export interface PosItem {
  key: string; // productId or productId:variantId
  productId: string;
  variantId: string | null;
  name: string;
  pack: string;
  price: number; // selling price incl. GST
  mrp: number | null;
  barcode: string | null;
  sku: string | null;
  stock: number;
}

/** Everything the counter screen needs, loaded once: the whole catalogue is small, so scanning is instant. */
export async function getPosData() {
  await requirePermission('orders.create');
  const [products, buyers, settings] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, weight: true, price: true, salePrice: true, mrp: true, barcode: true, stock: true,
        variants: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }], select: { id: true, label: true, price: true, salePrice: true, mrp: true, barcode: true, sku: true, stock: true } },
      },
    }),
    prisma.user.findMany({
      where: { customerType: 'WHOLESALE' },
      orderBy: [{ businessName: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, businessName: true, phone: true, email: true, gstin: true, wholesaleDiscount: true },
    }),
    getStoreSettings(),
  ]);
  const items: PosItem[] = [];
  for (const p of products as any[]) {
    if (p.variants.length) {
      for (const v of p.variants) items.push({ key: `${p.id}:${v.id}`, productId: p.id, variantId: v.id, name: p.name, pack: v.label, price: v.salePrice ?? v.price, mrp: v.mrp ?? null, barcode: v.barcode, sku: v.sku, stock: v.stock });
    } else {
      items.push({ key: p.id, productId: p.id, variantId: null, name: p.name, pack: p.weight || '', price: p.salePrice ?? p.price, mrp: p.mrp ?? null, barcode: p.barcode, sku: null, stock: p.stock });
    }
  }
  return JSON.parse(JSON.stringify({ items, buyers, upiId: (settings as any).upiId ?? null, shopName: settings.legalName || settings.storeName }));
}

export interface CounterSaleInput {
  lines: Array<{ productId: string; variantId: string | null; qty: number }>;
  discount?: number; // ₹ off the bill
  buyerId?: string | null; // wholesale buyer: their discount % and GSTIN apply
  customer?: { name?: string; phone?: string; email?: string; gstin?: string };
  payment: { method: 'CASH' | 'UPI' | 'CARD'; cashReceived?: number | null; ref?: string | null };
}

/** Rings up a shop sale: GST invoice, stock out (earliest expiry first), paid and handed over at once. */
export async function createCounterSaleAction(input: CounterSaleInput) {
  await requirePermission('orders.create');
  const actor = await staffActor();
  const lines = (input.lines || []).filter((l) => Number(l.qty) > 0);
  if (!lines.length) return { error: 'Scan or add at least one item.' };
  if (lines.some((l) => !Number.isInteger(Number(l.qty)) || Number(l.qty) > 999)) return { error: 'Quantities must be whole numbers.' };
  if (!['CASH', 'UPI', 'CARD'].includes(input.payment?.method)) return { error: 'Choose how the customer paid.' };

  const settings = await getStoreSettings();
  const buyer = input.buyerId
    ? await prisma.user.findFirst({ where: { id: input.buyerId, customerType: 'WHOLESALE' }, select: { id: true, name: true, businessName: true, phone: true, email: true, gstin: true, wholesaleDiscount: true } })
    : null;
  const gstin = (input.customer?.gstin?.trim().toUpperCase() || buyer?.gstin || null) as string | null;
  if (gstin && !isValidGstin(gstin)) return { error: 'Customer GSTIN is not valid.' };
  const phoneRaw = (input.customer?.phone || buyer?.phone || '').replace(/\D/g, '');
  if (phoneRaw && phoneRaw.length < 10) return { error: 'Phone number should have 10 digits.' };
  const phone = phoneRaw ? formatWhatsAppNumber(phoneRaw) : '';
  const email = (input.customer?.email || buyer?.email || '').trim().toLowerCase();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Email looks wrong.' };
  const name = (input.customer?.name?.trim() || (buyer ? buyer.businessName || buyer.name : '') || 'Walk-in customer').slice(0, 80);

  // Prices come from the catalogue, never from the browser.
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, status: 'ACTIVE' }, include: { variants: true } });
  const pct = Math.max(0, Math.min(60, buyer?.wholesaleDiscount ?? 0));
  const priced: Array<{ productId: string; variantId: string | null; name: string; weight: string; qty: number; price: number; hsnCode: string | null; gstRate: number }> = [];
  for (const l of lines) {
    const p: any = products.find((x: any) => x.id === l.productId);
    if (!p) return { error: 'An item is no longer for sale. Remove it and scan again.' };
    const v = l.variantId ? p.variants.find((x: any) => x.id === l.variantId && x.isActive) : null;
    if (l.variantId && !v) return { error: `${p.name}: that pack size is no longer sold.` };
    const retail = v ? v.salePrice ?? v.price : p.salePrice ?? p.price;
    priced.push({
      productId: p.id, variantId: v?.id ?? null, name: p.name, weight: v?.label ?? p.weight ?? '', qty: Number(l.qty),
      price: r2(retail * (1 - pct / 100)), hsnCode: p.hsnCode ?? null, gstRate: p.gstRate ?? settings.gstRate,
    });
  }
  const subtotal = r2(priced.reduce((s, i) => s + i.price * i.qty, 0));
  const discount = r2(Math.max(0, Math.min(subtotal, Number(input.discount) || 0)));
  const total = r2(subtotal - discount);
  const cashReceived = input.payment.method === 'CASH' && input.payment.cashReceived ? r2(Number(input.payment.cashReceived)) : null;
  if (cashReceived !== null && cashReceived + 0.001 < total) return { error: `Cash received is less than the bill (₹${total}).` };
  const taxAmount = splitGst({ lines: priced.map((i) => ({ amount: i.price * i.qty, gstRate: i.gstRate })), discount, shipping: 0, defaultRate: settings.gstRate }).taxTotal;

  const now = new Date();
  const lowAlerts: Array<StockResult | null> = [];
  let order: any;
  try {
    order = await prisma.$transaction(async (tx: any) => {
      const created = await tx.order.create({
        data: {
          channel: 'SHOP',
          status: 'DELIVERED',
          paymentMethod: input.payment.method,
          paymentRef: input.payment.ref?.trim().slice(0, 60) || null,
          cashReceived,
          paidAt: now,
          deliveredAt: now,
          subtotal, discount, shippingFee: 0, taxAmount, total,
          customerName: name,
          customerEmail: email || (phone ? `${phone}@shop.spicynuts.in` : 'walk-in@shop.spicynuts.in'),
          customerPhone: phone,
          customerGstin: gstin,
          ...(buyer ? { userId: buyer.id } : {}),
          // Sold over the counter: the place of supply is the shop's own state.
          shippingAddress: `Counter sale, ${settings.businessAddress ?? ''}`.slice(0, 500),
          shippingState: settings.businessState ?? null,
          invoiceNumber: await allocateInvoiceNumber(tx),
          items: {
            create: priced.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty, price: i.price, weight: i.weight, hsnCode: i.hsnCode, gstRate: i.gstRate, productName: i.name })),
          },
        },
      });
      for (const i of priced) {
        lowAlerts.push(await adjustStock(tx, { productId: i.productId, variantId: i.variantId, delta: -i.qty, reason: 'SALE', orderId: created.id, actor, force: true, note: 'Counter sale' }));
      }
      await logOrderEvent(tx, { orderId: created.id, type: 'PAYMENT', message: `Counter sale paid by ${input.payment.method}${input.payment.ref ? ` (${input.payment.ref})` : ''}`, actor });
      return created;
    }, { timeout: 15000, maxWait: 5000 });
  } catch (e) {
    if (e instanceof StockError) return { error: e.message };
    throw e;
  }
  await notifyLowStock(lowAlerts);
  await audit({ action: 'order.counter_sale', entity: 'Order', entityId: order.id, summary: `Counter sale ${order.invoiceNumber}: ₹${total} by ${input.payment.method}`, actor });
  revalidatePath('/admin/pos');
  revalidatePath('/admin/orders');
  return {
    success: true as const,
    id: order.id,
    invoiceNumber: order.invoiceNumber as string,
    total,
    change: cashReceived !== null ? r2(cashReceived - total) : null,
    phone,
    email: email || null,
    billUrl: billUrl(order.id),
  };
}

/** Sends the bill link on WhatsApp (approved template) or by email. */
export async function sendBillAction(orderId: string, via: 'whatsapp' | 'email', to?: string) {
  await requirePermission('orders.create');
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, invoiceNumber: true, total: true, customerPhone: true, customerEmail: true, customerName: true } });
  if (!order) return { error: 'Bill not found.' };
  const link = billUrl(order.id);
  if (via === 'whatsapp') {
    const phone = formatWhatsAppNumber((to || order.customerPhone || '').replace(/\D/g, ''));
    if (phone.length < 12) return { error: 'Enter the customer’s 10-digit WhatsApp number.' };
    if (!order.customerPhone) await prisma.order.update({ where: { id: order.id }, data: { customerPhone: phone } });
    const res = await sendWhatsAppMessage({
      to: phone,
      type: 'ORDER_UPDATE',
      template: { key: 'counter_invoice', params: [order.invoiceNumber ?? order.id.slice(-8).toUpperCase(), Math.round(order.total).toLocaleString('en-IN'), link] },
      message: `Thank you for shopping at Spicy Nuts! Your bill ${order.invoiceNumber} for ₹${order.total.toFixed(0)}: ${link}`,
    });
    if (!res.success) return { error: res.status === 'SIMULATED' ? 'WhatsApp is not set up on this server.' : `WhatsApp failed: ${res.error ?? 'unknown error'}` };
    return { success: true };
  }
  const email = (to || order.customerEmail || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.endsWith('@shop.spicynuts.in')) return { error: 'Enter the customer’s email address.' };
  const { sendBillEmail } = await import('@/lib/email');
  const res = await sendBillEmail(email, order.customerName, order.invoiceNumber ?? '', order.total, link);
  return res.success ? { success: true } : { error: 'Email could not be sent.' };
}

/** Day-end close: today's counter sales by payment method, to match the cash drawer. */
export async function getCounterDay(dateIso?: string) {
  await requirePermission('orders.create');
  const start = istDayStart(dateIso ? new Date(`${dateIso}T12:00:00+05:30`) : new Date());
  const end = new Date(start.getTime() + 864e5);
  const orders = await prisma.order.findMany({
    where: { channel: 'SHOP', createdAt: { gte: start, lt: end } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, invoiceNumber: true, createdAt: true, customerName: true, customerPhone: true, total: true, paymentMethod: true, status: true, paymentRef: true, items: { select: { quantity: true } } },
  });
  const kept = orders.filter((o: any) => o.status === 'DELIVERED');
  const by = (m: string) => r2(kept.filter((o: any) => o.paymentMethod === m).reduce((s: number, o: any) => s + o.total, 0));
  return JSON.parse(JSON.stringify({
    date: new Date(start.getTime() + IST).toISOString().slice(0, 10),
    orders,
    totals: { cash: by('CASH'), upi: by('UPI'), card: by('CARD'), all: r2(kept.reduce((s: number, o: any) => s + o.total, 0)), bills: kept.length, units: kept.reduce((s: number, o: any) => s + o.items.reduce((a: number, i: any) => a + i.quantity, 0), 0) },
  }));
}
