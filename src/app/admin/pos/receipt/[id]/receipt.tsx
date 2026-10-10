"use client";

import { useEffect } from "react";
import QRCode from "react-qr-code";

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const LABEL: Record<string, string> = { CASH: "Cash", UPI: "UPI", CARD: "Card", ONLINE: "Online", COD: "Cash on delivery" };

/** 80 mm thermal receipt (about 72 mm printable). Opens the print dialog by itself. */
export function Receipt({ r }: { r: any }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  const d = new Date(r.date);
  const ist = d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex justify-center bg-[#f6f3ee] py-6 print:block print:bg-white print:py-0">
      <style>{"@page { size: 80mm auto; margin: 3mm 4mm; } @media print { body * { visibility: hidden; } .receipt, .receipt * { visibility: visible; } .receipt { position: absolute; left: 0; top: 0; } }"}</style>
      <div className="receipt w-[72mm] bg-white p-2 font-mono text-[11px] leading-snug text-black shadow print:shadow-none">
        <div className="text-center">
          <p className="text-[14px] font-bold tracking-wide">SPICY NUTS</p>
          <p className="font-bold">{r.shop}</p>
          {r.address && <p className="text-[10px]">{r.address}</p>}
          <p className="text-[10px]">Ph {r.phone}</p>
          {r.gstin && <p className="text-[10px]">GSTIN {r.gstin}</p>}
          {r.fssai && <p className="text-[10px]">FSSAI {r.fssai}</p>}
          <p className="mt-1 border-y border-dashed border-black py-0.5 font-bold">TAX INVOICE</p>
        </div>
        <div className="mt-1 text-[10px]">
          <p>Bill: <b>{r.invoiceNumber}</b></p>
          <p>Date: {ist}</p>
          {r.customer && r.customer !== "Walk-in customer" && <p>To: {r.customer}</p>}
          {r.customerGstin && <p>Buyer GSTIN: {r.customerGstin}</p>}
        </div>
        <table className="mt-1 w-full border-y border-dashed border-black">
          <thead><tr className="text-left"><th className="py-0.5 font-bold">Item</th><th className="text-right font-bold">Qty</th><th className="text-right font-bold">Rate</th><th className="text-right font-bold">Amt</th></tr></thead>
          <tbody>
            {r.items.map((i: any, k: number) => (
              <tr key={k} className="align-top">
                <td className="py-0.5 pr-1">{i.name} {i.pack}{i.hsn ? <span className="block text-[9px]">HSN {i.hsn}</span> : null}</td>
                <td className="text-right">{i.qty}</td>
                <td className="text-right">{money(i.price)}</td>
                <td className="text-right">{money(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-1 space-y-0.5">
          <p className="flex justify-between"><span>Items total</span><span>{money(r.subtotal)}</span></p>
          {r.discount > 0 && <p className="flex justify-between"><span>Discount</span><span>-{money(r.discount)}</span></p>}
          <p className="flex justify-between border-t border-dashed border-black pt-0.5 text-[14px] font-bold"><span>TOTAL ₹</span><span>{money(r.total)}</span></p>
          <p className="flex justify-between"><span>Paid by {LABEL[r.method] ?? r.method}</span><span>{r.ref ?? ""}</span></p>
          {r.cashReceived != null && (<>
            <p className="flex justify-between"><span>Cash received</span><span>{money(r.cashReceived)}</span></p>
            <p className="flex justify-between font-bold"><span>Change</span><span>{money(r.cashReceived - r.total)}</span></p>
          </>)}
        </div>
        <div className="mt-1 border-t border-dashed border-black pt-1 text-[10px]">
          <p className="font-bold">GST included</p>
          {r.taxes.map((t: any) => (
            <p key={t.rate} className="flex justify-between">
              <span>{t.rate}% on {money(t.taxable)}</span>
              <span>{r.sameState ? (() => { const c = Math.round((t.tax / 2) * 100) / 100; return `CGST ${money(c)} SGST ${money(t.tax - c)}`; })() : `IGST ${money(t.tax)}`}</span>
            </p>
          ))}
        </div>
        <div className="mt-2 flex flex-col items-center gap-1 border-t border-dashed border-black pt-2 text-center text-[10px]">
          <QRCode value={r.link} size={88} />
          <p>Scan for your GST invoice</p>
          <p className="mt-1 font-bold">Thank you! Visit again.</p>
          <p>www.spicynuts.in</p>
        </div>
      </div>
    </div>
  );
}
