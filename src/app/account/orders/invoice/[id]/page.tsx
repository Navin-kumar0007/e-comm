import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";
import InvoicePrintButton from "./print-button";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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
  const isAdmin = (session.user as any).role === 'ADMIN';

  if (!order || (!isOwner && !isAdmin)) {
    return notFound();
  }

  const subtotal = order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const shipping = subtotal > 999 ? 0 : 50;
  const discount = Math.max(0, (subtotal + shipping + tax) - order.total);

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

      <div className="bg-white text-black p-8 sm:p-12 rounded-2xl shadow-sm border print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-start border-b pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-green-700">
              <Leaf className="h-6 w-6" />
              <span className="font-heading text-2xl font-bold">Spicy Nuts</span>
            </div>
            <p className="text-sm text-gray-500">Pure, Natural, Single-Estate Gourmet</p>
            <p className="text-sm text-gray-500">GSTIN: 27AABCU9603R1ZM</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-heading font-bold text-gray-800 uppercase tracking-wider mb-2">Invoice</h1>
            <p className="text-sm"><span className="font-semibold">Invoice #:</span> INV-{order.id.slice(-8).toUpperCase()}</p>
            <p className="text-sm"><span className="font-semibold">Date:</span> {order.createdAt.toLocaleDateString('en-IN')}</p>
            <p className="text-sm"><span className="font-semibold">Status:</span> {order.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
            <p className="font-semibold text-gray-800">{order.customerName}</p>
            <p className="text-sm text-gray-600">{order.customerEmail}</p>
            <p className="text-sm text-gray-600">{order.customerPhone}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shipped To</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{order.shippingAddress}</p>
          </div>
        </div>

        <table className="w-full text-left mb-8">
          <thead>
            <tr className="border-y bg-gray-50/50">
              <th className="py-3 px-4 text-sm font-semibold text-gray-800">Description</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-800 text-center">Qty</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-800 text-right">Price</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-800 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item: any, i: number) => (
              <tr key={i}>
                <td className="py-4 px-4">
                  <p className="font-medium text-gray-800">{item.product?.name || "Single Estate Gourmet Item"}</p>
                  <p className="text-xs text-gray-500">Weight: {item.weight}</p>
                </td>
                <td className="py-4 px-4 text-center text-gray-600">{item.quantity}</td>
                <td className="py-4 px-4 text-right text-gray-600">₹{item.price.toFixed(2)}</td>
                <td className="py-4 px-4 text-right font-medium text-gray-800">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-72 space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount / Promo</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-3">
              <span>Total Paid</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t text-center text-sm text-gray-500">
          <p>Thank you for choosing pure, natural dry fruits & spices from Spicy Nuts.</p>
          <p>If you have any questions about this invoice, please contact spicynuts1973@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
