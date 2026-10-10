import Image from "next/image";
import { computeInvoice, type InvoiceOrder, type InvoiceSettings } from "@/lib/invoice";
import { amountInWords, stateCode } from "@/lib/gst";
import { BRAND_EMAIL, BRAND_PHONE_DISPLAY } from "@/lib/contact";

type InvoiceDocumentOrder = Omit<InvoiceOrder, "items"> & {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerGstin?: string | null;
  invoiceNotes?: string | null;
  items: Array<{
    price: number;
    quantity: number;
    weight: string;
    gstRate?: number | null;
    hsnCode?: string | null;
    productName?: string | null;
    product?: { name: string; hsnCode?: string | null } | null;
  }>;
};

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SITE = "www.spicynuts.in";

/** A4 GST tax invoice shared by the customer account page, the admin order hub and bulk printing. */
export function InvoiceDocument({
  order,
  settings,
  notes,
  copyLabel = "Original for Recipient",
}: {
  order: InvoiceDocumentOrder;
  settings: InvoiceSettings & { fssaiLicense?: string | null; signatoryName?: string | null; invoiceTerms?: string | null };
  notes?: string;
  copyLabel?: string;
}) {
  // Older order lines have no HSN snapshot: fall back to the product's current HSN.
  const items = order.items.map((i) => ({ ...i, hsnCode: i.hsnCode ?? i.product?.hsnCode ?? null }));
  const inv = computeInvoice({ ...order, items }, settings);
  const invoiceDate = new Date(order.paidAt ?? order.createdAt);
  const title = !inv.isFinalInvoice ? "Order Summary" : inv.isTaxInvoice ? "Tax Invoice" : "Invoice";
  const sellerCode = stateCode(settings.businessState);
  const posCode = stateCode(inv.placeOfSupply);
  const isCod = order.paymentMethod === "COD";
  const halfTax = inv.sameState === true;

  return (
    <div className="invoice-a4 w-full max-w-[210mm] bg-white text-[#1f1712] text-[11px] leading-[1.45] rounded-xl shadow-sm border print:shadow-none print:border-none print:rounded-none print:mx-auto">
      {/* Header band */}
      <div className="flex items-stretch justify-between gap-6 border-b-[3px] border-[#6E1A2C] px-8 pt-7 pb-5">
        <div className="flex items-start gap-4">
          <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" width={112} height={88} className="h-[64px] w-auto shrink-0" priority />
          <div className="space-y-0.5">
            <p className="text-[13px] font-extrabold uppercase tracking-wide text-[#6E1A2C]">{settings.legalName || settings.storeName}</p>
            {settings.businessAddress && <p className="max-w-[300px] text-[#4b3f37] whitespace-pre-line">{settings.businessAddress}</p>}
            <p className="text-[#4b3f37]">
              {BRAND_PHONE_DISPLAY} · {settings.contactEmail || BRAND_EMAIL} · {SITE}
            </p>
            <p className="pt-0.5">
              {settings.gstin && <><span className="font-semibold">GSTIN:</span> <span className="font-mono">{settings.gstin}</span></>}
              {sellerCode && <span className="text-[#4b3f37]"> · State: {settings.businessState} ({sellerCode})</span>}
            </p>
            {settings.fssaiLicense && (
              <p><span className="font-semibold">FSSAI Lic. No.:</span> <span className="font-mono">{settings.fssaiLicense}</span></p>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col justify-between">
          <div>
            <p className="text-[22px] font-black uppercase tracking-[0.12em] text-[#1f1712]">{title}</p>
            {inv.isFinalInvoice && <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#9A6E2A]">{copyLabel}</p>}
          </div>
          <table className="ml-auto mt-2 text-[10.5px]">
            <tbody>
              <tr><td className="pr-3 text-[#6b5a52]">{inv.isFinalInvoice ? "Invoice No." : "Order No."}</td><td className="font-mono font-semibold">{inv.invoiceNumber}</td></tr>
              <tr><td className="pr-3 text-[#6b5a52]">Invoice Date</td><td className="font-semibold">{invoiceDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td></tr>
              <tr><td className="pr-3 text-[#6b5a52]">Order Ref.</td><td className="font-mono">NW-{order.id.slice(-8).toUpperCase()}</td></tr>
              <tr><td className="pr-3 text-[#6b5a52]">Payment</td><td>{({ COD: "Cash on Delivery", ONLINE: "Prepaid (Online)", CASH: "Paid in cash", UPI: "Paid by UPI", CARD: "Paid by card" } as Record<string, string>)[order.paymentMethod] ?? order.paymentMethod}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-3 gap-0 border-b border-[#e7dccb]">
        <div className="px-8 py-4 border-r border-[#e7dccb]">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A6E2A]">Bill To</p>
          <p className="font-bold text-[12px]">{order.customerName}</p>
          <p className="text-[#4b3f37]">{order.customerPhone}</p>
          <p className="text-[#4b3f37] break-all">{order.customerEmail}</p>
          {order.customerGstin && <p className="mt-1"><span className="font-semibold">GSTIN:</span> <span className="font-mono">{order.customerGstin}</span></p>}
        </div>
        <div className="px-6 py-4 border-r border-[#e7dccb]">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A6E2A]">Ship To</p>
          <p className="font-semibold">{order.customerName}</p>
          <p className="text-[#4b3f37] whitespace-pre-line">{order.shippingAddress}</p>
        </div>
        <div className="px-6 py-4 space-y-1">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A6E2A]">Supply Details</p>
          <p><span className="text-[#6b5a52]">Place of supply:</span> <span className="font-semibold">{inv.placeOfSupply ?? "—"}{posCode ? ` (${posCode})` : ""}</span></p>
          <p><span className="text-[#6b5a52]">Tax type:</span> {inv.sameState === true ? "CGST + SGST (intra-state)" : inv.sameState === false ? "IGST (inter-state)" : "GST"}</p>
          <p><span className="text-[#6b5a52]">Reverse charge:</span> No</p>
          <p><span className="text-[#6b5a52]">Prices:</span> Inclusive of GST</p>
        </div>
      </div>

      {/* Items */}
      <div className="px-8 pt-5">
        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="bg-[#6E1A2C] text-white">
              <th className="py-2 pl-2 pr-1 text-left font-semibold w-6">#</th>
              <th className="py-2 px-1 text-left font-semibold">Item</th>
              <th className="py-2 px-1 text-left font-semibold">HSN</th>
              <th className="py-2 px-1 text-right font-semibold">Qty</th>
              <th className="py-2 px-1 text-right font-semibold">Rate</th>
              <th className="py-2 px-1 text-right font-semibold">Disc.</th>
              <th className="py-2 px-1 text-right font-semibold">Taxable</th>
              <th className="py-2 px-1 text-right font-semibold">GST</th>
              <th className="py-2 pl-1 pr-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const l = inv.lines[i];
              return (
                <tr key={i} className="border-b border-[#efe6d8] align-top">
                  <td className="py-2 pl-2 pr-1 text-[#6b5a52]">{i + 1}</td>
                  <td className="py-2 px-1">
                    <p className="font-semibold">{item.productName || item.product?.name || "Product"}</p>
                    <p className="text-[9.5px] text-[#6b5a52]">Pack: {item.weight}</p>
                  </td>
                  <td className="py-2 px-1 font-mono">{l.hsnCode ?? "—"}</td>
                  <td className="py-2 px-1 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2 px-1 text-right tabular-nums">{money(item.price)}</td>
                  <td className="py-2 px-1 text-right tabular-nums">{l.discount ? money(l.discount) : "—"}</td>
                  <td className="py-2 px-1 text-right tabular-nums">{money(l.taxable)}</td>
                  <td className="py-2 px-1 text-right tabular-nums whitespace-nowrap">{l.rate}% · {money(l.tax)}</td>
                  <td className="py-2 pl-1 pr-2 text-right font-semibold tabular-nums">{money(l.net)}</td>
                </tr>
              );
            })}
            {inv.shipping > 0 && (
              <tr className="border-b border-[#efe6d8]">
                <td className="py-2 pl-2 pr-1 text-[#6b5a52]">{items.length + 1}</td>
                <td className="py-2 px-1 font-semibold" colSpan={2}>Shipping &amp; handling</td>
                <td className="py-2 px-1 text-right">1</td>
                <td className="py-2 px-1 text-right tabular-nums">{money(inv.shippingLine.net)}</td>
                <td className="py-2 px-1 text-right">—</td>
                <td className="py-2 px-1 text-right tabular-nums">{money(inv.shippingLine.taxable)}</td>
                <td className="py-2 px-1 text-right tabular-nums whitespace-nowrap">{inv.shippingLine.rate}% · {money(inv.shippingLine.tax)}</td>
                <td className="py-2 pl-1 pr-2 text-right font-semibold tabular-nums">{money(inv.shippingLine.net)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tax summary + totals */}
      <div className="grid grid-cols-[1fr_260px] gap-6 px-8 pt-4">
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A6E2A]">Tax Summary (HSN-wise)</p>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-y border-[#d9c9b0] text-[#6b5a52]">
                <th className="py-1 text-left font-semibold">HSN</th>
                <th className="py-1 text-right font-semibold">Taxable</th>
                {halfTax ? (
                  <><th className="py-1 text-right font-semibold">CGST</th><th className="py-1 text-right font-semibold">SGST</th></>
                ) : (
                  <th className="py-1 text-right font-semibold">{inv.sameState === false ? "IGST" : "GST"}</th>
                )}
                <th className="py-1 text-right font-semibold">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {inv.hsnSummary.map((h) => (
                <tr key={`${h.hsnCode}-${h.rate}`} className="border-b border-[#efe6d8]">
                  <td className="py-1 font-mono">{h.hsnCode}</td>
                  <td className="py-1 text-right tabular-nums">{money(h.taxable)}</td>
                  {halfTax ? (
                    <>
                      <td className="py-1 text-right tabular-nums">{h.rate / 2}% · {money(h.tax / 2)}</td>
                      <td className="py-1 text-right tabular-nums">{h.rate / 2}% · {money(h.tax - Math.round((h.tax / 2) * 100) / 100)}</td>
                    </>
                  ) : (
                    <td className="py-1 text-right tabular-nums">{h.rate}% · {money(h.tax)}</td>
                  )}
                  <td className="py-1 text-right tabular-nums font-semibold">{money(h.tax)}</td>
                </tr>
              ))}
              {inv.shipping > 0 && (
                <tr className="border-b border-[#efe6d8] text-[#6b5a52]">
                  <td className="py-1">Shipping</td>
                  <td className="py-1 text-right tabular-nums">{money(inv.shippingLine.taxable)}</td>
                  {halfTax ? (
                    <><td className="py-1 text-right tabular-nums">{money(inv.shippingLine.tax / 2)}</td><td className="py-1 text-right tabular-nums">{money(inv.shippingLine.tax - Math.round((inv.shippingLine.tax / 2) * 100) / 100)}</td></>
                  ) : (
                    <td className="py-1 text-right tabular-nums">{money(inv.shippingLine.tax)}</td>
                  )}
                  <td className="py-1 text-right tabular-nums">{money(inv.shippingLine.tax)}</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A6E2A]">Amount in Words</p>
          <p className="font-semibold">{amountInWords(inv.total)}</p>
        </div>

        <div className="self-start rounded-md border border-[#e7dccb] bg-[#fbf6ee] p-3 space-y-1 text-[10.5px]">
          <div className="flex justify-between"><span className="text-[#6b5a52]">Items total</span><span className="tabular-nums">{money(inv.subtotal)}</span></div>
          {inv.discount > 0 && <div className="flex justify-between text-[#1e6b45]"><span>Discount</span><span className="tabular-nums">−{money(inv.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-[#6b5a52]">Shipping</span><span className="tabular-nums">{inv.shipping === 0 ? "Free" : money(inv.shipping)}</span></div>
          <div className="my-1 border-t border-dashed border-[#d9c9b0]" />
          <div className="flex justify-between"><span className="text-[#6b5a52]">Taxable value</span><span className="tabular-nums">{money(inv.taxableValue)}</span></div>
          {inv.taxLines.map((t) => (
            <div key={t.label} className="flex justify-between"><span className="text-[#6b5a52]">{t.label}</span><span className="tabular-nums">{money(t.amount)}</span></div>
          ))}
          <div className="mt-1 flex justify-between items-baseline border-t-2 border-[#6E1A2C] pt-2">
            <span className="font-bold uppercase text-[10px] tracking-wide">{isCod ? "Amount Payable" : "Total Paid"}</span>
            <span className="text-[16px] font-black tabular-nums">₹{money(inv.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-[1fr_220px] gap-6 px-8 pt-6 pb-7 mt-4 border-t border-[#e7dccb]">
        <div className="space-y-1 text-[9.5px] text-[#4b3f37]">
          <p className="font-semibold text-[#1f1712]">{notes || "Thank you for choosing Spicy Nuts. Fine nuts & dry fruits, handpicked since 1973."}</p>
          {settings.invoiceTerms && <p className="whitespace-pre-line">{settings.invoiceTerms}</p>}
          <p>Returns: report any issue within 48 hours of delivery at {SITE}/account/orders.</p>
          <p>Questions about this invoice? {BRAND_PHONE_DISPLAY} · {settings.contactEmail || BRAND_EMAIL}</p>
        </div>
        <div className="text-center text-[10px]">
          <p className="font-semibold">For {settings.legalName || settings.storeName}</p>
          <div className="h-12" />
          <p className="border-t border-[#1f1712] pt-1 font-semibold">{settings.signatoryName || "Authorised Signatory"}</p>
          {settings.signatoryName && <p className="text-[9px] text-[#6b5a52]">Authorised Signatory</p>}
        </div>
      </div>
      {inv.isFinalInvoice && (
        <p className="pb-5 text-center text-[8.5px] text-[#8a7a70]">This is a computer-generated invoice and does not require a physical signature.</p>
      )}
    </div>
  );
}
