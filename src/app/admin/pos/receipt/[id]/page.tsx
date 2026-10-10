import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { computeInvoice } from "@/lib/invoice";
import { billUrl } from "@/lib/bill-link";
import { BRAND_PHONE_DISPLAY } from "@/lib/contact";
import { Receipt } from "./receipt";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("orders.view");
  const { id } = await params;
  const [order, settings] = await Promise.all([prisma.order.findUnique({ where: { id }, include: { items: true } }), getStoreSettings()]);
  if (!order) notFound();
  const inv = computeInvoice(order as any, settings);
  const taxByRate = new Map<number, { taxable: number; tax: number }>();
  [...inv.lines, inv.shippingLine].forEach((l) => {
    if (!l.tax && !l.taxable) return;
    const c = taxByRate.get(l.rate) ?? { taxable: 0, tax: 0 };
    taxByRate.set(l.rate, { taxable: c.taxable + l.taxable, tax: c.tax + l.tax });
  });
  return (
    <Receipt
      r={JSON.parse(JSON.stringify({
        shop: settings.legalName || settings.storeName,
        address: settings.businessAddress,
        phone: BRAND_PHONE_DISPLAY,
        gstin: settings.gstin,
        fssai: (settings as any).fssaiLicense ?? null,
        invoiceNumber: inv.invoiceNumber,
        date: order.createdAt,
        customer: order.customerName,
        customerGstin: order.customerGstin,
        items: order.items.map((i: any) => ({ name: i.productName, pack: i.weight, qty: i.quantity, price: i.price, hsn: i.hsnCode })),
        subtotal: order.subtotal ?? inv.subtotal,
        discount: order.discount,
        total: order.total,
        taxable: inv.taxableValue,
        taxes: [...taxByRate.entries()].map(([rate, v]) => ({ rate, taxable: v.taxable, tax: v.tax })),
        sameState: inv.sameState !== false,
        method: order.paymentMethod,
        cashReceived: order.cashReceived,
        ref: order.paymentRef,
        link: billUrl(order.id),
      }))}
    />
  );
}
