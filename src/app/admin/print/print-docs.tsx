"use client";

import Image from "next/image";
import { Printer } from "lucide-react";
import Barcode from "@/components/ui/barcode";
import QRCode from "react-qr-code";

export interface PrintOrder {
  id: string;
  ref: string; // NW-XXXXXXXX
  invoiceNumber: string | null;
  createdAt: string;
  paymentMethod: string;
  total: number;
  customerName: string;
  customerPhone: string;
  address: { address: string; city: string; state: string; pincode: string };
  weightGrams: number;
  dims: string;
  awb: string | null;
  courierName: string | null;
  courierLabelUrl: string | null;
  items: Array<{ name: string; pack: string; quantity: number; sku: string | null; barcode: string | null }>;
}

export interface PrintSender {
  name: string;
  address: string;
  phone: string;
  gstin: string | null;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function PrintToolbar({ title, count, note }: { title: string; count: number; note?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 print:hidden">
      <div>
        <p className="text-lg font-bold">{title}</p>
        <p className="text-sm text-muted-foreground">{count} {count === 1 ? "document" : "documents"}{note ? ` · ${note}` : ""}</p>
      </div>
      <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#6E1A2C] px-4 text-sm font-semibold text-white hover:bg-[#5a1424]">
        <Printer className="h-4 w-4" /> Print
      </button>
    </div>
  );
}

/** 4 × 6 inch thermal shipping label. */
export function ShippingLabel({ o, sender }: { o: PrintOrder; sender: PrintSender }) {
  const cod = o.paymentMethod === "COD";
  return (
    <div className="sheet-4x6 mx-auto mb-6 flex flex-col overflow-hidden border border-black bg-white text-black print:mb-0 print:border-0" style={{ width: "4in", height: "6in", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Courier + AWB */}
      <div className="flex items-center justify-between border-b-2 border-black px-3 py-1.5">
        <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" width={70} height={55} className="h-9 w-auto" />
        <div className="text-right leading-tight">
          <p className="text-[13px] font-black uppercase">{o.courierName || "Courier"}</p>
          <p className="text-[9px]">{o.awb ? "AWB" : "Not booked yet"}</p>
        </div>
      </div>
      <div className="flex justify-center border-b-2 border-black py-1">
        <Barcode value={o.awb || o.ref} format="CODE128" width={1.6} height={52} fontSize={13} margin={0} displayValue />
      </div>

      {/* Ship to */}
      <div className="border-b-2 border-black px-3 py-2">
        <p className="text-[9px] font-bold uppercase">Deliver to</p>
        <p className="text-[15px] font-black leading-tight">{o.customerName}</p>
        <p className="text-[11.5px] leading-snug">{o.address.address}</p>
        <p className="text-[11.5px] font-semibold leading-snug">{o.address.city}, {o.address.state}</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-[12px]">Ph: <span className="font-bold">{o.customerPhone}</span></p>
          <p className="text-[22px] font-black tracking-wider">{o.address.pincode}</p>
        </div>
      </div>

      {/* Payment */}
      <div className={`flex items-center justify-between border-b-2 border-black px-3 py-2 ${cod ? "bg-black text-white" : ""}`}>
        <p className="text-[18px] font-black uppercase">{cod ? "COD" : "Prepaid"}</p>
        <p className="text-[20px] font-black">{cod ? `Collect ${inr(o.total)}` : "Do not collect"}</p>
      </div>

      {/* Order details */}
      <div className="grid grid-cols-2 gap-x-3 border-b-2 border-black px-3 py-1.5 text-[10.5px] leading-snug">
        <p>Order: <span className="font-bold">{o.ref}</span></p>
        <p>Date: <span className="font-bold">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span></p>
        <p>Weight: <span className="font-bold">{(o.weightGrams / 1000).toFixed(2)} kg</span></p>
        <p>Size: <span className="font-bold">{o.dims}</span></p>
        <p className="col-span-2 truncate">Items: <span className="font-bold">{o.items.reduce((s, i) => s + i.quantity, 0)}</span> · {o.items.map((i) => `${i.name} ${i.pack}×${i.quantity}`).join(", ")}</p>
        {o.invoiceNumber && <p className="col-span-2">Invoice: <span className="font-bold">{o.invoiceNumber}</span></p>}
      </div>

      {/* Track + handling */}
      <div className="flex flex-1 items-center gap-3 px-3 py-2">
        <QRCode value={`https://www.spicynuts.in/track/${o.id}`} size={74} />
        <div className="text-[10px] leading-snug">
          <p className="text-[12px] font-black uppercase">Food item · Handle with care</p>
          <p>Keep dry. Do not crush.</p>
          <p className="mt-1">Scan to track this order</p>
          <p className="font-semibold">spicynuts.in/track</p>
        </div>
      </div>

      {/* Return address */}
      <div className="border-t-2 border-black px-3 py-2 text-[9.5px] leading-snug">
        <p className="font-bold uppercase">If undelivered, return to</p>
        <p className="font-semibold">{sender.name}</p>
        <p>{sender.address}</p>
        <p>Ph: {sender.phone}{sender.gstin ? ` · GSTIN: ${sender.gstin}` : ""}</p>
      </div>
    </div>
  );
}

/** 4 × 6 inch packing slip: what goes in the box, with a tick column. */
export function PackingSlip({ o }: { o: PrintOrder }) {
  return (
    <div className="sheet-4x6 mx-auto mb-6 flex flex-col overflow-hidden border border-black bg-white p-3 text-black print:mb-0 print:border-0" style={{ width: "4in", height: "6in", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="flex items-start justify-between border-b-2 border-black pb-2">
        <div>
          <p className="text-[15px] font-black uppercase">Packing Slip</p>
          <p className="text-[11px]">Order <span className="font-bold">{o.ref}</span></p>
          <p className="text-[11px]">{o.customerName} · {o.address.city} {o.address.pincode}</p>
        </div>
        <Barcode value={o.ref} format="CODE128" width={1.1} height={34} fontSize={10} margin={0} displayValue={false} />
      </div>
      <table className="mt-2 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1 w-5">✓</th>
            <th className="py-1">Item</th>
            <th className="py-1">Pack</th>
            <th className="py-1 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i, k) => (
            <tr key={k} className="border-b border-dashed border-black/40 align-top">
              <td className="py-1.5"><span className="inline-block h-3.5 w-3.5 border border-black" /></td>
              <td className="py-1.5 pr-1">
                <p className="font-semibold leading-tight">{i.name}</p>
                {(i.sku || i.barcode) && <p className="font-mono text-[9px]">{[i.sku, i.barcode].filter(Boolean).join(" · ")}</p>}
              </td>
              <td className="py-1.5">{i.pack}</td>
              <td className="py-1.5 text-right text-[14px] font-black">{i.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-auto space-y-1 border-t-2 border-black pt-2 text-[10.5px]">
        <p>Total units: <span className="font-bold">{o.items.reduce((s, i) => s + i.quantity, 0)}</span> · Payment: <span className="font-bold">{o.paymentMethod === "COD" ? `COD ${inr(o.total)}` : "Prepaid"}</span></p>
        <p>Packed by: ____________ &nbsp; Checked by: ____________</p>
        <p className="text-[9.5px]">Thank you for shopping with Spicy Nuts · spicynuts.in · +91 85500 07073</p>
      </div>
    </div>
  );
}

/** A4 pick list: everything to pull from the shelves for the selected orders. */
export function PickList({ orders }: { orders: PrintOrder[] }) {
  const map = new Map<string, { name: string; pack: string; sku: string | null; qty: number; orders: string[] }>();
  for (const o of orders) {
    for (const i of o.items) {
      const key = `${i.name}|${i.pack}`;
      const cur = map.get(key) ?? { name: i.name, pack: i.pack, sku: i.sku, qty: 0, orders: [] };
      cur.qty += i.quantity;
      cur.orders.push(`${o.ref.slice(3)}×${i.quantity}`);
      map.set(key, cur);
    }
  }
  const rows = [...map.values()].sort((a, b) => a.name.localeCompare(b.name) || a.pack.localeCompare(b.pack));
  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 text-black print:p-0">
      <div className="mb-4 flex items-end justify-between border-b-2 border-black pb-2">
        <div>
          <p className="text-xl font-black uppercase">Pick List</p>
          <p className="text-sm">{orders.length} orders · {rows.reduce((s, r) => s + r.qty, 0)} units · {new Date().toLocaleString("en-IN")}</p>
        </div>
        <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" width={70} height={55} className="h-10 w-auto" />
      </div>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1.5 w-6">✓</th>
            <th className="py-1.5">Product</th>
            <th className="py-1.5">Pack</th>
            <th className="py-1.5">SKU</th>
            <th className="py-1.5 text-right">Total qty</th>
            <th className="py-1.5 pl-4">Orders</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.name}|${r.pack}`} className="border-b border-black/20 align-top">
              <td className="py-2"><span className="inline-block h-4 w-4 border border-black" /></td>
              <td className="py-2 font-semibold">{r.name}</td>
              <td className="py-2">{r.pack}</td>
              <td className="py-2 font-mono text-[11px]">{r.sku ?? "—"}</td>
              <td className="py-2 text-right text-[16px] font-black">{r.qty}</td>
              <td className="py-2 pl-4 text-[10.5px] text-black/70">{r.orders.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
