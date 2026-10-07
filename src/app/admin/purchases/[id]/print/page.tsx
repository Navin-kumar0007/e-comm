import Image from "next/image";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth-guard";
import { getPurchaseOrder } from "@/app/actions/admin-purchasing";
import { getStoreSettings } from "@/lib/store-settings";
import { amountInWords } from "@/lib/gst";
import { BRAND_EMAIL, BRAND_PHONE_DISPLAY } from "@/lib/contact";
import { PrintToolbar } from "../../../print/print-docs";

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");

/** A4 purchase order to send to the supplier. */
export default async function PurchasePrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("purchases.manage");
  const { id } = await params;
  const [po, s] = await Promise.all([getPurchaseOrder(id), getStoreSettings()]);
  if (!po) notFound();
  const sameState = !po.supplier.state || !s.businessState || po.supplier.state.trim().toLowerCase() === s.businessState.trim().toLowerCase();

  return (
    <div>
      <style>{"@page { size: A4; margin: 10mm; }"}</style>
      <PrintToolbar title={`Purchase order ${po.number}`} count={1} note="A4 paper" />
      <div className="mx-auto max-w-[210mm] bg-white p-8 text-[12px] text-black shadow-sm print:p-0 print:shadow-none" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div className="flex items-start justify-between border-b-2 border-[#6E1A2C] pb-3">
          <div className="flex items-center gap-3">
            <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" width={80} height={64} className="h-14 w-auto" />
            <div className="leading-snug">
              <p className="text-[15px] font-bold">{s.legalName || s.storeName}</p>
              <p className="max-w-[90mm]">{s.businessAddress}</p>
              <p>{BRAND_PHONE_DISPLAY} · {BRAND_EMAIL}</p>
              {s.gstin && <p className="font-semibold">GSTIN: {s.gstin}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-black uppercase tracking-wide text-[#6E1A2C]">Purchase Order</p>
            <table className="ml-auto mt-1 text-left">
              <tbody>
                <tr><td className="pr-3 text-black/60">PO No.</td><td className="font-bold">{po.number}</td></tr>
                <tr><td className="pr-3 text-black/60">Date</td><td>{day(po.orderDate)}</td></tr>
                <tr><td className="pr-3 text-black/60">Deliver by</td><td>{day(po.expectedDate)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#6E1A2C]">Supplier</p>
            <p className="font-bold">{po.supplier.name}</p>
            {po.supplier.contactName && <p>{po.supplier.contactName}</p>}
            {po.supplier.address && <p>{po.supplier.address}</p>}
            {po.supplier.phone && <p>Ph: {po.supplier.phone}</p>}
            <p>GSTIN: {po.supplier.gstin || "Unregistered"}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#6E1A2C]">Deliver to</p>
            <p className="font-bold">{s.legalName || s.storeName}</p>
            <p>{s.businessAddress}</p>
            <p>Ph: {BRAND_PHONE_DISPLAY}</p>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#6E1A2C] text-left text-white">
              <th className="px-2 py-1.5">#</th><th className="px-2 py-1.5">Item</th><th className="px-2 py-1.5 text-right">Qty</th>
              <th className="px-2 py-1.5 text-right">Rate</th><th className="px-2 py-1.5 text-right">GST</th><th className="px-2 py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((l: any, i: number) => (
              <tr key={l.id} className="border-b border-black/15">
                <td className="px-2 py-1.5">{i + 1}</td>
                <td className="px-2 py-1.5 font-semibold">{l.description}</td>
                <td className="px-2 py-1.5 text-right">{l.qty} {l.unit}</td>
                <td className="px-2 py-1.5 text-right">{money(l.rate)}</td>
                <td className="px-2 py-1.5 text-right">{l.gstRate}%</td>
                <td className="px-2 py-1.5 text-right">{money(l.qty * l.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex justify-between gap-6">
          <div className="max-w-[60%] space-y-2">
            <p><span className="font-semibold">Amount in words:</span> {amountInWords(po.total)}</p>
            {po.notes && <p className="whitespace-pre-line"><span className="font-semibold">Notes:</span> {po.notes}</p>}
            <div className="text-[10.5px] text-black/70">
              <p className="font-semibold text-black">Terms</p>
              <p>1. Please quote this PO number on your invoice and delivery challan.</p>
              <p>2. Goods must be fresh, clean and of the agreed grade; best-before date to be marked on each bag.</p>
              <p>3. Goods not matching the order may be returned at the supplier's cost.</p>
            </div>
          </div>
          <table className="w-64 self-start">
            <tbody>
              <tr><td className="py-0.5 text-black/60">Taxable value</td><td className="text-right">{money(po.subtotal)}</td></tr>
              {sameState ? (<>
                <tr><td className="py-0.5 text-black/60">CGST</td><td className="text-right">{money(po.taxTotal / 2)}</td></tr>
                <tr><td className="py-0.5 text-black/60">SGST</td><td className="text-right">{money(po.taxTotal / 2)}</td></tr>
              </>) : (
                <tr><td className="py-0.5 text-black/60">IGST</td><td className="text-right">{money(po.taxTotal)}</td></tr>
              )}
              {po.freight > 0 && <tr><td className="py-0.5 text-black/60">Freight</td><td className="text-right">{money(po.freight)}</td></tr>}
              <tr className="border-t-2 border-black text-[14px] font-bold"><td className="py-1">Total (₹)</td><td className="text-right">{money(po.total)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mt-14 flex justify-end">
          <div className="w-56 border-t border-black pt-1 text-center">
            <p className="font-semibold">For {s.legalName || s.storeName}</p>
            <p className="text-black/60">Authorised signatory{(s as any).signatoryName ? ` · ${(s as any).signatoryName}` : ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
