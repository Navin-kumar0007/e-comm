"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, PackageCheck, Printer, Pencil, Send, XCircle, Boxes } from "lucide-react";
import { receivePurchaseAction, setPurchaseStatusAction } from "@/app/actions/admin-purchasing";
import { purchaseTotals } from "@/lib/wms-core";
import { PageHeader, Panel, StatusPill, Field, inputCls, btnPrimary, btnSecondary, thCls, tdCls, inr, dateFmt, qtyFmt, isoDay } from "@/components/admin/ui";

type Receive = Record<string, { qty: string; expiryDate: string; mfgDate: string; lotNumber: string }>;

export function PurchaseDetail({ po }: { po: any }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [receiving, setReceiving] = useState(false);
  const [billNo, setBillNo] = useState<string>(po.supplierInvoiceNo ?? "");
  const [billDate, setBillDate] = useState<string>(po.supplierInvoiceDate ? isoDay(new Date(po.supplierInvoiceDate)) : isoDay());
  const [rx, setRx] = useState<Receive>(() =>
    Object.fromEntries(po.lines.map((l: any) => [l.id, { qty: String(Math.max(0, +(l.qty - l.receivedQty).toFixed(3))), expiryDate: "", mfgDate: "", lotNumber: "" }]))
  );
  const totals = purchaseTotals(po.lines, po.freight, !!po.supplier.gstin);
  const open = ["DRAFT", "ORDERED", "PARTIAL"].includes(po.status);
  const anyReceived = po.lines.some((l: any) => l.receivedQty > 0);
  const editable = ["DRAFT", "ORDERED"].includes(po.status) && !anyReceived;

  const setLine = (id: string, k: keyof Receive[string], v: string) => setRx((r) => ({ ...r, [id]: { ...r[id], [k]: v } }));

  const status = (s: "ORDERED" | "CANCELLED") =>
    start(async () => {
      const res = await setPurchaseStatusAction(po.id, s);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success(s === "ORDERED" ? "Marked as ordered" : "Purchase order cancelled");
      router.refresh();
    });

  const receive = () =>
    start(async () => {
      const res = await receivePurchaseAction({
        poId: po.id, supplierInvoiceNo: billNo, supplierInvoiceDate: billDate,
        lines: po.lines.map((l: any) => ({ lineId: l.id, qty: Number(rx[l.id]?.qty) || 0, expiryDate: rx[l.id]?.expiryDate || null, mfgDate: rx[l.id]?.mfgDate || null, lotNumber: rx[l.id]?.lotNumber || null })),
      });
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success(`Stock added. Batch ${res.lots?.join(", ")}`);
      setReceiving(false);
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <Link href="/admin/purchases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Purchase orders</Link>
      <PageHeader
        title={po.number}
        subtitle={<span className="flex items-center gap-2"><StatusPill status={po.status} /> {po.supplier.name} · ordered {dateFmt(po.orderDate)}{po.expectedDate ? ` · expected ${dateFmt(po.expectedDate)}` : ""}</span>}
        actions={<>
          <Link href={`/admin/purchases/${po.id}/print`} target="_blank" className={btnSecondary}><Printer className="h-4 w-4" /> Print PO</Link>
          {editable && <Link href={`/admin/purchases/new?edit=${po.id}`} className={btnSecondary}><Pencil className="h-4 w-4" /> Edit</Link>}
          {po.status === "DRAFT" && <button className={btnSecondary} disabled={pending} onClick={() => status("ORDERED")}><Send className="h-4 w-4" /> Mark ordered</button>}
          {open && !anyReceived && <button className={`${btnSecondary} text-red-700`} disabled={pending} onClick={() => status("CANCELLED")}><XCircle className="h-4 w-4" /> Cancel</button>}
          {open && !receiving && <button className={btnPrimary} onClick={() => setReceiving(true)}><PackageCheck className="h-4 w-4" /> Receive goods</button>}
        </>}
      />

      {receiving && (
        <Panel title="Receive goods" className="border-[#c9a45a]">
          <div className="space-y-4 p-4">
            <p className="text-sm text-muted-foreground">Enter what actually arrived. Each line becomes a batch with its own code. Write the batch code on the bag or stamp it on the packs. Leave the code empty to get one automatically.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Supplier bill / invoice no."><input className={inputCls} value={billNo} onChange={(e) => setBillNo(e.target.value)} /></Field>
              <Field label="Bill date"><input type="date" className={inputCls} value={billDate} onChange={(e) => setBillDate(e.target.value)} /></Field>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr>
                  <th className={thCls}>Item</th><th className={thCls}>Still due</th><th className={`${thCls} w-32`}>Received now</th>
                  <th className={`${thCls} w-40`}>Packed / mfg date</th><th className={`${thCls} w-40`}>Best before</th><th className={`${thCls} w-36`}>Batch code</th>
                </tr></thead>
                <tbody className="divide-y divide-border/60">
                  {po.lines.map((l: any) => {
                    const due = +(l.qty - l.receivedQty).toFixed(3);
                    return (
                      <tr key={l.id} className={due <= 0 ? "opacity-40" : ""}>
                        <td className={tdCls}><p className="font-medium">{l.description}</p><p className="text-xs text-muted-foreground">{l.unit === "kg" ? "Bulk" : "Ready packs"}</p></td>
                        <td className={`${tdCls} tabular-nums`}>{qtyFmt(due, l.unit)}</td>
                        <td className={tdCls}><input type="number" min={0} max={due} step={l.unit === "kg" ? 0.001 : 1} disabled={due <= 0} className={inputCls} value={rx[l.id]?.qty ?? ""} onChange={(e) => setLine(l.id, "qty", e.target.value)} /></td>
                        <td className={tdCls}><input type="date" disabled={due <= 0} className={inputCls} value={rx[l.id]?.mfgDate ?? ""} onChange={(e) => setLine(l.id, "mfgDate", e.target.value)} /></td>
                        <td className={tdCls}><input type="date" disabled={due <= 0} className={inputCls} value={rx[l.id]?.expiryDate ?? ""} onChange={(e) => setLine(l.id, "expiryDate", e.target.value)} /></td>
                        <td className={tdCls}><input disabled={due <= 0} className={`${inputCls} font-mono uppercase`} placeholder="Auto" value={rx[l.id]?.lotNumber ?? ""} onChange={(e) => setLine(l.id, "lotNumber", e.target.value.toUpperCase())} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button className={btnSecondary} onClick={() => setReceiving(false)}>Cancel</button>
              <button className={btnPrimary} disabled={pending} onClick={receive}>{pending ? "Adding stock…" : "Add to stock"}</button>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Items" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr>
                <th className={thCls}>Item</th><th className={`${thCls} text-right`}>Ordered</th><th className={`${thCls} text-right`}>Received</th>
                <th className={`${thCls} text-right`}>Rate</th><th className={`${thCls} text-right`}>GST</th><th className={`${thCls} text-right`}>Cost / unit</th><th className={`${thCls} text-right`}>Amount</th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {po.lines.map((l: any, i: number) => (
                  <tr key={l.id}>
                    <td className={tdCls}>{l.description}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{qtyFmt(l.qty, l.unit)}</td>
                    <td className={`${tdCls} text-right tabular-nums ${l.receivedQty + 1e-6 >= l.qty ? "text-emerald-700" : l.receivedQty > 0 ? "text-amber-700" : ""}`}>{qtyFmt(l.receivedQty, l.unit)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{inr(l.rate, 2)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{l.gstRate}%</td>
                    <td className={`${tdCls} text-right tabular-nums`} title="Includes freight share, and GST when it can't be claimed">{inr(totals.landed[i], 2)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{inr(l.qty * l.rate, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ml-auto w-full space-y-1 border-t border-border/60 p-4 text-sm sm:w-72">
            <div className="flex justify-between"><dt className="text-muted-foreground">Items</dt><dd className="tabular-nums">{inr(po.subtotal, 2)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">GST {po.supplier.gstin ? "(claimable)" : "(not claimable)"}</dt><dd className="tabular-nums">{inr(po.taxTotal, 2)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Freight</dt><dd className="tabular-nums">{inr(po.freight, 2)}</dd></div>
            <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{inr(po.total, 2)}</dd></div>
          </dl>
        </Panel>

        <div className="space-y-6">
          <Panel title="Supplier">
            <div className="space-y-1 p-4 text-sm">
              <p className="font-semibold">{po.supplier.name}</p>
              {po.supplier.contactName && <p>{po.supplier.contactName}</p>}
              {po.supplier.phone && <p className="text-muted-foreground">{po.supplier.phone}</p>}
              {po.supplier.address && <p className="text-muted-foreground">{po.supplier.address}</p>}
              <p className="font-mono text-xs">{po.supplier.gstin ? `GSTIN ${po.supplier.gstin}` : "Not GST registered"}</p>
              {po.supplierInvoiceNo && <p className="pt-2">Bill <span className="font-semibold">{po.supplierInvoiceNo}</span>{po.supplierInvoiceDate ? ` · ${dateFmt(po.supplierInvoiceDate)}` : ""}</p>}
              {po.notes && <p className="whitespace-pre-line border-t border-border/60 pt-2 text-muted-foreground">{po.notes}</p>}
            </div>
          </Panel>
          <Panel title="Batches received" action={<Link href="/admin/batches" className="text-xs font-semibold text-[#6E1A2C] hover:underline">All batches</Link>}>
            {po.lots.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nothing received yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {po.lots.map((l: any) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-[#c9a45a]" /><span className="font-mono font-semibold">{l.lotNumber}</span></div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{qtyFmt(l.qtyIn, l.kind === "MATERIAL" ? "kg" : "packs")} · {dateFmt(l.receivedAt)}</p>
                      {l.expiryDate && <p>Best before {dateFmt(l.expiryDate)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
