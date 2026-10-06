import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InvoicePrintButton from "./print-button";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStoreSettings } from "@/lib/store-settings";
import { getStaffContext } from "@/lib/auth-guard";
import { InvoiceDocument } from "@/components/invoice/invoice-document";

export default async function CustomerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const resolvedParams = await params;
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  const isOwner = order && order.userId === session.user.id;
  const isAdmin = !!(await getStaffContext())?.can('orders.view');

  if (!order || (!isOwner && !isAdmin)) {
    return notFound();
  }

  const settings = await getStoreSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-8 px-4 sm:px-0">
      <div className="print:hidden flex items-center justify-between">
        <Link href="/account/orders">
          <Button variant="ghost" className="rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Button>
        </Link>
        <InvoicePrintButton />
      </div>

      <InvoiceDocument order={order} settings={settings} notes={order.invoiceNotes || undefined} />
    </div>
  );
}
