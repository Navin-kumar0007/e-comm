import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { checkBillToken } from "@/lib/bill-link";
import { InvoiceDocument } from "@/components/invoice/invoice-document";
import InvoicePrintButton from "@/app/account/orders/invoice/[id]/print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your bill", robots: { index: false, follow: false } };

/** A customer's own bill, opened from the private link on their receipt, WhatsApp or email. */
export default async function BillPage({ params }: { params: Promise<{ id: string; token: string }> }) {
  const { id, token } = await params;
  if (!checkBillToken(id, token)) notFound();
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({ where: { id }, include: { items: { include: { product: true } } } }),
    getStoreSettings(),
  ]);
  if (!order || !order.invoiceNumber) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 pb-16 pt-6 sm:px-0">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">Thank you for shopping at Spicy Nuts. Save this page as PDF to keep your bill.</p>
        <InvoicePrintButton />
      </div>
      <InvoiceDocument order={order} settings={settings} notes={order.invoiceNotes || undefined} />
    </div>
  );
}
