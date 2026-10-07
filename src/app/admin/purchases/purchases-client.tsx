"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, ClipboardList, Search } from "lucide-react";
import { PageHeader, Panel, Stat, StatusPill, Empty, btnPrimary, btnSecondary, thCls, tdCls, inr, dateFmt } from "@/components/admin/ui";

interface Row {
  id: string; number: string; status: string; supplier: string; orderDate: string; expectedDate: string | null;
  total: number; paidAmount: number; lines: number; receivedPct: number; supplierInvoiceNo: string | null;
}

const TABS = [
  { key: "open", label: "Open", match: (s: string) => ["DRAFT", "ORDERED", "PARTIAL"].includes(s) },
  { key: "received", label: "Received", match: (s: string) => s === "RECEIVED" },
  { key: "all", label: "All", match: () => true },
] as const;

export function PurchasesClient({ orders }: { orders: Row[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("open");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = TABS.find((x) => x.key === tab)!;
    const s = q.trim().toLowerCase();
    return orders.filter((o) => t.match(o.status) && (!s || `${o.number} ${o.supplier} ${o.supplierInvoiceNo ?? ""}`.toLowerCase().includes(s)));
  }, [orders, tab, q]);

  const now = Date.now();
  const open = orders.filter((o) => ["ORDERED", "PARTIAL"].includes(o.status));
  const late = open.filter((o) => o.expectedDate && new Date(o.expectedDate).getTime() < now);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = orders.filter((o) => o.status !== "CANCELLED" && new Date(o.orderDate) >= monthStart);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase orders"
        subtitle="Order from suppliers, then receive the goods: stock, batches and costs update automatically."
        actions={<>
          <Link href="/admin/suppliers" className={btnSecondary}>Suppliers</Link>
          <Link href="/admin/purchases/new" className={btnPrimary}><Plus className="h-4 w-4" /> New purchase order</Link>
        </>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Waiting for delivery" value={open.length} />
        <Stat label="Late" value={late.length} tone={late.length ? "bad" : undefined} hint="Past expected date" />
        <Stat label="On order" value={inr(open.reduce((s, o) => s + o.total * (1 - o.receivedPct / 100), 0))} hint="Value not yet received" />
        <Stat label="Bought this month" value={inr(thisMonth.reduce((s, o) => s + o.total, 0))} />
      </div>

      <Panel
        title={
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-lg px-3 py-1 text-sm font-medium ${tab === t.key ? "bg-[#6E1A2C] text-white" : "text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
            ))}
          </div>
        }
        action={
          <div className="flex h-9 w-60 items-center gap-2 rounded-lg border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="PO, supplier or bill no." className="w-full bg-transparent text-sm outline-none" />
          </div>
        }
      >
        {list.length === 0 ? (
          <Empty icon={<ClipboardList className="h-8 w-8" />} title={orders.length ? "Nothing here" : "No purchase orders yet"}>
            Raise a purchase order when you buy stock. When it arrives, receive it here to add stock with its batch code and expiry date.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr>
                <th className={thCls}>PO</th><th className={thCls}>Supplier</th><th className={thCls}>Ordered</th><th className={thCls}>Expected</th>
                <th className={thCls}>Received</th><th className={`${thCls} text-right`}>Total</th><th className={thCls}>Status</th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {list.map((o) => {
                  const isLate = ["ORDERED", "PARTIAL"].includes(o.status) && o.expectedDate && new Date(o.expectedDate).getTime() < now;
                  return (
                    <tr key={o.id} className="hover:bg-muted/20">
                      <td className={tdCls}><Link href={`/admin/purchases/${o.id}`} className="font-semibold text-[#6E1A2C] hover:underline">{o.number}</Link>
                        {o.supplierInvoiceNo && <p className="text-xs text-muted-foreground">Bill {o.supplierInvoiceNo}</p>}</td>
                      <td className={tdCls}>{o.supplier}<p className="text-xs text-muted-foreground">{o.lines} item{o.lines === 1 ? "" : "s"}</p></td>
                      <td className={tdCls}>{dateFmt(o.orderDate)}</td>
                      <td className={`${tdCls} ${isLate ? "font-semibold text-red-700" : ""}`}>{dateFmt(o.expectedDate)}{isLate ? " · late" : ""}</td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-600" style={{ width: `${o.receivedPct}%` }} /></div>
                          <span className="text-xs tabular-nums text-muted-foreground">{o.receivedPct}%</span>
                        </div>
                      </td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(o.total)}</td>
                      <td className={tdCls}><StatusPill status={o.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
