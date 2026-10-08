"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { History, Search, ChevronDown } from "lucide-react";
import { PageHeader, Panel, Empty, inputCls, btnSecondary, thCls, tdCls } from "@/components/admin/ui";

const AREAS = [
  { key: "", label: "Everything" },
  { key: "auth", label: "Sign-ins" },
  { key: "security", label: "Security" },
  { key: "staff", label: "Staff" },
  { key: "settings", label: "Settings" },
  { key: "product", label: "Products & prices" },
  { key: "stock", label: "Stock" },
  { key: "order", label: "Orders" },
  { key: "refund", label: "Refunds" },
  { key: "coupon", label: "Coupons" },
  { key: "purchase", label: "Purchases" },
  { key: "expense", label: "Expenses" },
  { key: "supplier", label: "Suppliers" },
  { key: "cod", label: "COD" },
  { key: "lot", label: "Batches" },
  { key: "count", label: "Stock counts" },
  { key: "barcode", label: "Barcodes" },
];

const when = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function AuditClient({ rows, total, page, pageSize, filters, actors }: {
  rows: any[]; total: number; page: number; pageSize: number; filters: { q: string; area: string; who: string }; actors: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);
  const [open, setOpen] = useState<string | null>(null);
  const go = (patch: Partial<typeof filters & { page: number }>) => {
    const next = { ...filters, page: 1, ...patch };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v && !(k === "page" && v === 1)) sp.set(k, String(v));
    router.push(`/admin/audit${sp.size ? `?${sp}` : ""}`);
  };
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader title="Activity log" subtitle="Who changed what, and when: prices, stock, refunds, settings, staff, money. Entries can't be edited or deleted from the admin." />
      <Panel
        title={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44"><select className={inputCls} value={filters.area} onChange={(e) => go({ area: e.target.value })} aria-label="Area">
              {AREAS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select></div>
            <div className="w-56"><select className={inputCls} value={filters.who} onChange={(e) => go({ who: e.target.value })} aria-label="Person">
              <option value="">Everyone</option>
              {actors.map((a) => <option key={a} value={a}>{a.split(":").pop()}</option>)}
            </select></div>
          </div>
        }
        action={
          <form onSubmit={(e) => { e.preventDefault(); go({ q }); }} className="flex h-9 w-64 items-center gap-2 rounded-lg border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, or paste an ID" className="w-full bg-transparent text-sm outline-none" />
          </form>
        }
      >
        {rows.length === 0 ? <Empty icon={<History className="h-8 w-8" />} title="Nothing logged yet">Changes made in the admin from now on will appear here.</Empty> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr><th className={thCls}>When</th><th className={thCls}>Who</th><th className={thCls}>What</th><th className={thCls}></th></tr></thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <tr className="hover:bg-muted/20">
                    <td className={`${tdCls} whitespace-nowrap text-muted-foreground`}>{when(r.createdAt)}</td>
                    <td className={tdCls}><p className="font-medium">{r.actor.split(":").pop()}</p><p className="text-[11px] text-muted-foreground">{r.actor.includes(":") ? r.actor.split(":")[0] : ""}{r.ip ? ` · ${r.ip}` : ""}</p></td>
                    <td className={tdCls}>
                      <p className={r.action === "auth.2fa_failed" ? "font-medium text-red-700" : ""}>{r.summary}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{r.action}{r.entity ? ` · ${r.entity}` : ""}{r.entityId ? ` ${r.entityId}` : ""}</p>
                    </td>
                    <td className={`${tdCls} text-right`}>{r.data && <button aria-label="Show details" className="rounded p-1 text-muted-foreground hover:bg-muted" onClick={() => setOpen(open === r.id ? null : r.id)}><ChevronDown className={`h-4 w-4 transition ${open === r.id ? "rotate-180" : ""}`} /></button>}</td>
                  </tr>
                  {open === r.id && <tr><td colSpan={4} className="bg-muted/20 px-4 py-3"><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs">{(() => { try { return JSON.stringify(JSON.parse(r.data), null, 2); } catch { return r.data; } })()}</pre></td></tr>}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{total} entries · page {page} of {pages}</span>
            <div className="flex gap-2">
              <button className={btnSecondary} disabled={page <= 1} onClick={() => go({ page: page - 1 })}>Newer</button>
              <button className={btnSecondary} disabled={page >= pages} onClick={() => go({ page: page + 1 })}>Older</button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
