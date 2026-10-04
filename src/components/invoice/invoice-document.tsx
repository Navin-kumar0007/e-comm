import { Leaf } from "lucide-react";
import { computeInvoice, type InvoiceOrder, type InvoiceSettings } from "@/lib/invoice";

type InvoiceDocumentOrder = Omit<InvoiceOrder, "items"> & {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  invoiceNotes?: string | null;
  items: Array<{ price: number; quantity: number; weight: string; productName?: string | null; product?: { name: string } | null }>;
};

const inr = (n: number) => `₹${n.toFixed(2)}`;

/** A4 invoice shared by the customer account page and the admin order hub. */
export function InvoiceDocument({
  order,
  settings,
  notes,
}: {
  order: InvoiceDocumentOrder;
  settings: InvoiceSettings;
  notes?: string;
}) {
  const inv = computeInvoice(order, settings);
  const invoiceDate = new Date(order.paidAt ?? order.createdAt);
  const title = !inv.isFinalInvoice ? "Order Summary" : inv.isTaxInvoice ? "Tax Invoice" : "Invoice";
  const placeOfSupply = order.shippingState || null;

  return (
    <div className="w-full max-w-[210mm] bg-white text-black p-8 sm:p-12 rounded-xl shadow-sm border print:shadow-none print:border-none print:p-0 print:mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-8 mb-8">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 mb-2 text-green-700">
            <Leaf className="h-7 w-7" />
            <span className="font-heading text-2xl font-bold">{settings.storeName}</span>
          </div>
          {settings.legalName && <p className="text-sm font-semibold text-gray-700">{settings.legalName}</p>}
          {settings.businessAddress && <p className="text-sm text-gray-500 whitespace-pre-line">{settings.businessAddress}</p>}
          {settings.gstin && <p className="text-sm text-gray-700"><span className="font-semibold">GSTIN:</span> {settings.gstin}</p>}
        </div>
        <div className="sm:text-right">
          <h1 className="text-3xl font-heading font-black text-gray-900 uppercase tracking-wider mb-2">{title}</h1>
          <p className="text-sm"><span className="font-semibold text-gray-500">{inv.isFinalInvoice ? "Invoice #:" : "Order #:"}</span> {inv.invoiceNumber}</p>
          <p className="text-sm"><span className="font-semibold text-gray-500">Date:</span> {invoiceDate.toLocaleDateString("en-IN")}</p>
          <p className="text-sm"><span className="font-semibold text-gray-500">Order Ref:</span> NW-{order.id.slice(-8).toUpperCase()}</p>
          <p className="text-sm"><span className="font-semibold text-gray-500">Payment:</span> {order.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid (Online)"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
          <p className="font-semibold text-gray-800">{order.customerName}</p>
          <p className="text-sm text-gray-600">{order.customerEmail}</p>
          <p className="text-sm text-gray-600">{order.customerPhone}</p>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shipped To</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{order.shippingAddress}</p>
          {placeOfSupply && <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Place of supply:</span> {placeOfSupply}</p>}
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left border-collapse min-w-[480px]">
          <thead>
            <tr className="border-y bg-gray-50/50">
              <th className="py-3 px-3 text-sm font-semibold text-gray-800">Description</th>
              <th className="py-3 px-3 text-sm font-semibold text-gray-800 text-center">Qty</th>
              <th className="py-3 px-3 text-sm font-semibold text-gray-800 text-right">Unit Price</th>
              <th className="py-3 px-3 text-sm font-semibold text-gray-800 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 px-3">
                  <p className="font-medium text-gray-800">{item.productName || item.product?.name || "Product"}</p>
                  <p className="text-xs text-gray-500">Weight: {item.weight}</p>
                </td>
                <td className="py-3 px-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-gray-600">{inr(item.price)}</td>
                <td className="py-3 px-3 text-right font-medium text-gray-800">{inr(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-full sm:w-80 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Items Subtotal</span><span>{inr(inv.subtotal)}</span></div>
          {inv.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium"><span>Discounts</span><span>-{inr(inv.discount)}</span></div>
          )}
          <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{inv.shipping === 0 ? "Free" : inr(inv.shipping)}</span></div>
          <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-3">
            <span>{order.paymentMethod === "COD" ? "Amount Payable" : "Total Paid"}</span>
            <span>{inr(inv.total)}</span>
          </div>
          <div className="pt-3 mt-1 border-t border-dashed space-y-1 text-xs text-gray-500">
            <div className="flex justify-between"><span>Taxable Value</span><span>{inr(inv.taxableValue)}</span></div>
            {inv.taxLines.map((line) => (
              <div key={line.label} className="flex justify-between"><span>{line.label}</span><span>{inr(line.amount)}</span></div>
            ))}
            <p className="pt-1">All prices are inclusive of GST.</p>
          </div>
        </div>
      </div>

      <div className="mt-14 pt-8 border-t text-center text-sm text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">{notes || "Thank you for choosing pure, natural dry fruits & spices."}</p>
        <p>Questions about this invoice? Contact {settings.contactEmail}</p>
        {inv.isFinalInvoice && <p className="text-xs">This is a computer-generated invoice and does not require a signature.</p>}
      </div>
    </div>
  );
}
