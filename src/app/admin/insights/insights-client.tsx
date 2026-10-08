"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { monthLabel } from "@/lib/finance-core";
import { PageHeader, Panel, Stat, inputCls, thCls, tdCls, inr, dateFmt } from "@/components/admin/ui";

type SortKey = "profit" | "revenue" | "units" | "margin" | "daysOfStock";

const waLink = (phone: string, text: string) => {
  const d = phone.replace(/\D/g, "");
  const n = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
};

export function InsightsClient({ data, canSeeCustomers }: { data: any; canSeeCustomers: boolean }) {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("profit");
  const s = data.summary;
  const products = useMemo(() => {
    const rows = [...data.productRows];
    rows.sort((a, b) => sort === "daysOfStock" ? (a.daysOfStock ?? 1e9) - (b.daysOfStock ?? 1e9) : b[sort] - a[sort]);
    return rows;
  }, [data.productRows, sort]);
  const maxState = Math.max(1, ...data.stateRows.map((r: any) => r.revenue));
  const th = (key: SortKey, label: string) => (
    <th className={`${thCls} cursor-pointer select-none text-right hover:text-foreground ${sort === key ? "text-[#6E1A2C]" : ""}`} onClick={() => setSort(key)}>{label}{sort === key ? " ↓" : ""}</th>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        subtitle="Which products make money, who your best customers are, where parcels come back from, and which offers pay off."
        actions={<select className={`${inputCls} w-40`} value={data.days} onChange={(e) => router.push(`/admin/insights?d=${e.target.value}`)} aria-label="Period">
          <option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last 12 months</option>
        </select>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Product profit" value={inr(s.profit)} hint={`${s.margin}% margin on ${inr(s.revenue)} (excl. GST)`} tone={s.profit < 0 ? "bad" : "good"} />
        <Stat label="Customers" value={s.customers} hint={`${s.newCustomers} new in this period`} />
        <Stat label="Come back to buy again" value={`${s.repeatRate}%`} hint={`Average customer has spent ${inr(s.avgLifetimeValue)}`} />
        <Stat label="Abandoned checkouts" value={inr(s.abandonedValue)} hint={`${data.abandoned.length} people in the last 14 days`} tone={data.abandoned.length ? "warn" : undefined} />
      </div>

      {s.unknownCost > 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {s.unknownCost} product{s.unknownCost === 1 ? " has" : "s have"} no purchase cost, so their profit shows as the full sale. Add costs through purchase orders or on <Link href="/admin/batches" className="font-semibold underline">Batches</Link>.
        </p>
      )}

      <Panel title="Profit by product and pack size" action={<span className="text-xs text-muted-foreground">Click a column to sort</span>}>
        {products.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No sales in this period.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr>
                <th className={thCls}>Product</th>{th("units", "Units")}{th("revenue", "Revenue")}<th className={`${thCls} text-right`}>Cost</th>{th("profit", "Profit")}{th("margin", "Margin")}{th("daysOfStock", "Stock lasts")}
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {products.map((r: any) => (
                  <tr key={r.key} className="hover:bg-muted/20">
                    <td className={tdCls}>{r.name}<span className="text-muted-foreground"> · {r.pack}</span></td>
                    <td className={`${tdCls} text-right tabular-nums`}>{r.units}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{inr(r.revenue)}</td>
                    <td className={`${tdCls} text-right tabular-nums ${r.costKnown ? "" : "text-amber-700"}`}>{r.costKnown ? inr(r.cogs) : "unknown"}</td>
                    <td className={`${tdCls} text-right font-semibold tabular-nums ${r.profit < 0 ? "text-red-700" : ""}`}>{inr(r.profit)}</td>
                    <td className={tdCls}>
                      <div className="flex items-center justify-end gap-2">
                        {r.costKnown && <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div className={`h-full ${r.margin < 20 ? "bg-red-500" : r.margin < 35 ? "bg-amber-500" : "bg-emerald-600"}`} style={{ width: `${Math.max(0, Math.min(100, r.margin))}%` }} /></div>}
                        <span className="w-12 text-right tabular-nums">{r.costKnown ? `${r.margin}%` : "—"}</span>
                      </div>
                    </td>
                    <td className={`${tdCls} text-right tabular-nums ${r.daysOfStock !== null && r.daysOfStock < 14 ? "font-semibold text-red-700" : ""}`}>{r.daysOfStock === null ? "—" : r.daysOfStock > 365 ? "over a year" : `${r.daysOfStock} days`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        {canSeeCustomers && (
          <Panel title="Best customers (all time)">
            {data.topCustomers.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No customers yet.</p> : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr><th className={thCls}>Customer</th><th className={`${thCls} text-right`}>Orders</th><th className={`${thCls} text-right`}>Spent</th><th className={thCls}>Last order</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {data.topCustomers.map((c: any) => (
                    <tr key={c.email}>
                      <td className={tdCls}><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.phone}</p></td>
                      <td className={`${tdCls} text-right tabular-nums`}>{c.orders}</td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(c.spend)}</td>
                      <td className={tdCls}>{dateFmt(c.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        )}

        <Panel title="Do new customers come back?" action={<span className="text-xs text-muted-foreground">By month of first order</span>}>
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr><th className={thCls}>First ordered in</th><th className={`${thCls} text-right`}>New customers</th><th className={`${thCls} text-right`}>Ordered again</th><th className={thCls}>Return rate</th></tr></thead>
            <tbody className="divide-y divide-border/60">
              {data.cohorts.map((c: any) => (
                <tr key={c.month}>
                  <td className={tdCls}>{monthLabel(c.month, true)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{c.customers}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{c.returned}</td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-2"><div className="h-2 w-28 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[#6E1A2C]" style={{ width: `${c.rate}%` }} /></div><span className="tabular-nums">{c.customers ? `${c.rate}%` : "—"}</span></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">For dry fruits, 25–35% coming back within 3 months is healthy. Lower? Try a reorder reminder on WhatsApp 30 days after delivery.</p>
        </Panel>

        <Panel title="Sales by state">
          {data.stateRows.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No sales in this period.</p> : (
            <ul className="space-y-2.5 p-4 text-sm">
              {data.stateRows.slice(0, 12).map((r: any) => (
                <li key={r.state}>
                  <div className="flex justify-between"><span>{r.state} <span className="text-xs text-muted-foreground">· {r.orders} orders{r.rtoRate !== null ? ` · ${r.rtoRate}% returned undelivered` : ""}</span></span><span className="font-semibold tabular-nums">{inr(r.revenue)}</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[#c9a45a]" style={{ width: `${(r.revenue / maxState) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pincodes where parcels come back (RTO)">
          {data.rtoPins.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No undelivered parcels in this period.</p> : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr><th className={thCls}>Pincode</th><th className={thCls}>City</th><th className={`${thCls} text-right`}>Came back</th><th className={`${thCls} text-right`}>Rate</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {data.rtoPins.map((p: any) => <tr key={p.pincode}><td className={`${tdCls} font-mono`}>{p.pincode}</td><td className={tdCls}>{p.city}</td><td className={`${tdCls} text-right tabular-nums`}>{p.rto} of {p.finished}</td><td className={`${tdCls} text-right font-semibold tabular-nums ${p.rate >= 30 ? "text-red-700" : ""}`}>{p.rate}%</td></tr>)}
                </tbody>
              </table>
              <p className="border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">Pincodes above 30% are worth switching to prepaid-only or calling to confirm COD orders before shipping.</p>
            </>
          )}
        </Panel>

        <Panel title="Coupons: are they worth it?">
          {data.couponRows.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No coupon orders in this period.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr><th className={thCls}>Code</th><th className={`${thCls} text-right`}>Orders</th><th className={`${thCls} text-right`}>New customers</th><th className={`${thCls} text-right`}>Discount given</th><th className={`${thCls} text-right`}>Sales</th><th className={`${thCls} text-right`}>₹ sales per ₹1 off</th></tr></thead>
              <tbody className="divide-y divide-border/60">
                {data.couponRows.map((c: any) => <tr key={c.code}><td className={`${tdCls} font-mono font-semibold`}>{c.code}</td><td className={`${tdCls} text-right tabular-nums`}>{c.orders}</td><td className={`${tdCls} text-right tabular-nums`}>{c.newCustomers}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(c.discount)}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(c.revenue)}</td><td className={`${tdCls} text-right font-semibold tabular-nums`}>{c.returnPerRupee ?? "—"}</td></tr>)}
              </tbody>
            </table>
          )}
        </Panel>

        {canSeeCustomers && (
          <Panel title="Abandoned checkouts (last 14 days)" action={<span className="text-xs text-muted-foreground">Started paying online, never finished</span>}>
            {data.abandoned.length === 0 ? <p className="p-4 text-sm text-muted-foreground">None.</p> : (
              <ul className="divide-y divide-border/60 text-sm">
                {data.abandoned.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0"><p className="font-medium">{a.name} <span className="text-xs font-normal text-muted-foreground">· {dateFmt(a.createdAt)}</span></p><p className="truncate text-xs text-muted-foreground">{a.items}</p></div>
                    <div className="flex shrink-0 items-center gap-3">
                      <b className="tabular-nums">{inr(a.total)}</b>
                      {a.phone && <a target="_blank" rel="noreferrer" href={waLink(a.phone, `Hi ${a.name.split(" ")[0]}, this is Spicy Nuts. We noticed your order (${inr(a.total)}) didn't go through. Can we help you complete it? Shop: https://www.spicynuts.in/cart`)} className="inline-flex h-8 items-center gap-1 rounded-md bg-[#25D366] px-2 text-xs font-semibold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
