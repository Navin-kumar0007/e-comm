"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Tag, PackageOpen, ListChecks, Truck, ExternalLink } from "lucide-react";
import { bookShipmentAction } from "@/app/actions/admin-shipping";

export interface QueueOrder {
  id: string;
  ref: string;
  createdAt: string;
  customerName: string;
  city: string;
  pincode: string;
  paymentMethod: string;
  total: number;
  units: number;
  summary: string;
  awb: string | null;
  courierName: string | null;
  labelUrl: string | null;
  codPending?: boolean;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const TABS = [
  { key: "pack", label: "To pack", hint: "Not booked with a courier yet" },
  { key: "booked", label: "Booked · awaiting pickup", hint: "AWB issued" },
  { key: "all", label: "All open", hint: "" },
] as const;

function ageLabel(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 36e5);
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export function FulfilmentClient({ orders, canBook, providerName }: { orders: QueueOrder[]; canBook: boolean; providerName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pack");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [booking, startBooking] = useTransition();

  const list = useMemo(
    () => orders.filter((o) => (tab === "all" ? true : tab === "pack" ? !o.awb : !!o.awb)),
    [orders, tab]
  );
  const counts = { pack: orders.filter((o) => !o.awb).length, booked: orders.filter((o) => !!o.awb).length, all: orders.length };
  const chosen = list.filter((o) => selected.has(o.id));
  const allChecked = list.length > 0 && chosen.length === list.length;

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(list.map((o) => o.id)));
  const printHref = (doc: string) => `/admin/print/${doc}?ids=${chosen.map((o) => o.id).join(",")}`;

  const bookAll = () => {
    const held = chosen.filter((o) => !o.awb && o.codPending).length;
    if (held) toast.info(`${held} COD order${held === 1 ? " is" : "s are"} waiting for the customer's WhatsApp confirmation and won't be booked.`);
    const targets = chosen.filter((o) => !o.awb && !o.codPending);
    if (!targets.length) return toast.info("Selected orders are already booked.");
    startBooking(async () => {
      let ok = 0;
      for (const o of targets) {
        const res = await bookShipmentAction(o.id, {});
        if (res && "error" in res && res.error) toast.error(`${o.ref}: ${res.error}`);
        else ok++;
      }
      if (ok) toast.success(`Booked ${ok} of ${targets.length} with ${providerName}`);
      router.refresh();
    });
  };

  const actions = [
    { doc: "picklist", label: "Pick list", icon: ListChecks },
    { doc: "packing", label: "Packing slips", icon: PackageOpen },
    { doc: "labels", label: "Shipping labels", icon: Tag },
    { doc: "invoices", label: "Invoices", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pack &amp; Print</h1>
          <p className="text-sm text-muted-foreground">Pick, pack and label today&apos;s orders. Select orders, then print in one go.</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div><p className="text-muted-foreground">To pack</p><p className="text-2xl font-bold tabular-nums">{counts.pack}</p></div>
          <div><p className="text-muted-foreground">Awaiting pickup</p><p className="text-2xl font-bold tabular-nums">{counts.booked}</p></div>
          <div><p className="text-muted-foreground">COD to collect</p><p className="text-2xl font-bold tabular-nums">{inr(orders.filter((o) => o.paymentMethod === "COD").reduce((s, o) => s + o.total, 0))}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1 ring-1 ring-border w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelected(new Set()); }}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${tab === t.key ? "bg-[#6E1A2C] text-white" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label} <span className="ml-1 tabular-nums opacity-70">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Bulk bar */}
      <div className={`sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3 shadow-sm ${chosen.length ? "border-[#c9a45a]" : "border-border"}`}>
        <p className="mr-2 text-sm font-semibold">{chosen.length ? `${chosen.length} selected` : "Select orders to print"}</p>
        {actions.map((a) => (
          <Link key={a.doc} href={chosen.length ? printHref(a.doc) : "#"} target="_blank" aria-disabled={!chosen.length}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium ${chosen.length ? "border-border hover:bg-muted" : "pointer-events-none border-border/50 text-muted-foreground/50"}`}>
            <a.icon className="h-4 w-4" /> {a.label}
          </Link>
        ))}
        {canBook && (
          <button onClick={bookAll} disabled={!chosen.length || booking}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6E1A2C] px-3 text-[13px] font-semibold text-white disabled:opacity-40">
            <Truck className="h-4 w-4" /> {booking ? "Booking…" : `Book with ${providerName}`}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" className="h-4 w-4 accent-[#6E1A2C]" /></th>
              <th className="px-2 py-3">Order</th>
              <th className="px-2 py-3">Customer</th>
              <th className="px-2 py-3 hidden md:table-cell">Items</th>
              <th className="px-2 py-3">Payment</th>
              <th className="px-2 py-3">Courier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Nothing here. All caught up.</td></tr>
            )}
            {list.map((o) => (
              <tr key={o.id} className={selected.has(o.id) ? "bg-[#fbf6ee]" : "hover:bg-muted/30"}>
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} aria-label={`Select ${o.ref}`} className="h-4 w-4 accent-[#6E1A2C]" /></td>
                <td className="px-2 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">{o.ref}</Link>
                  <p className="text-xs text-muted-foreground">{ageLabel(o.createdAt)}</p>
                </td>
                <td className="px-2 py-3">
                  <p className="font-medium">{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{o.city} {o.pincode}</p>
                </td>
                <td className="px-2 py-3 hidden md:table-cell max-w-[340px]">
                  <p className="truncate">{o.summary}</p>
                  <p className="text-xs text-muted-foreground">{o.units} {o.units === 1 ? "unit" : "units"}</p>
                </td>
                <td className="px-2 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.paymentMethod === "COD" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {o.paymentMethod === "COD" ? `COD ${inr(o.total)}` : "Prepaid"}
                  </span>
                </td>
                <td className="px-2 py-3">
                  {o.awb ? (
                    <div>
                      <p className="text-xs font-semibold">{o.courierName}</p>
                      <p className="font-mono text-xs">{o.awb}</p>
                      {o.labelUrl && <a href={o.labelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#6E1A2C] hover:underline">Courier label <ExternalLink className="h-3 w-3" /></a>}
                    </div>
                  ) : o.codPending ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Awaiting COD confirmation</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not booked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
