import Link from "next/link";
import { ClipboardList, Scissors, ClipboardCheck, Boxes, Wheat, AlertTriangle } from "lucide-react";
import { requirePagePermission } from "@/lib/auth-guard";
import { getWarehouseOverview } from "@/lib/wms";
import { daysUntil, expiryStatus } from "@/lib/wms-core";
import { PageHeader, Panel, Stat, StatusPill } from "@/components/admin/ui";
import { btnPrimary, btnSecondary, thCls, tdCls, inr, qtyFmt, dateFmt } from "@/components/admin/format";

export const dynamic = "force-dynamic";

export default async function WarehousePage() {
  const staff = await requirePagePermission("inventory.manage");
  const o = await getWarehouseOverview();
  const canBuy = staff.can("purchases.manage");
  const lateCount = o.openPOs.filter((p: any) => p.expectedDate && new Date(p.expectedDate) < new Date()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse"
        subtitle="What you hold, what it is worth, what to buy next and what is about to expire."
        actions={<>
          <Link href="/admin/stock-counts" className={btnSecondary}><ClipboardCheck className="h-4 w-4" /> Count stock</Link>
          <Link href="/admin/repack" className={btnSecondary}><Scissors className="h-4 w-4" /> Pack from bulk</Link>
          {canBuy && <Link href="/admin/purchases/new" className={btnPrimary}><ClipboardList className="h-4 w-4" /> New purchase order</Link>}
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Stock value" value={inr(o.value.total)} hint={`Packs ${inr(o.value.packs)} · Bulk ${inr(o.value.materials)}`} />
        <Stat label="Packs on hand" value={o.packUnits.toLocaleString("en-IN")} hint={o.unassigned ? `${o.unassigned} not yet in a batch` : "All in batches"} tone={o.unassigned ? "warn" : undefined} />
        <Stat label="Bulk on hand" value={qtyFmt(o.materialKg, "kg")} hint={o.lowMaterials.length ? `${o.lowMaterials.length} below reorder level` : undefined} tone={o.lowMaterials.length ? "warn" : undefined} />
        <Stat label="To reorder" value={o.reorder.length} hint={`Based on last 30 days of sales · ${o.leadDays}-day delivery`} tone={o.reorder.length ? "warn" : undefined} />
      </div>

      {o.noCost > 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {o.noCost} item{o.noCost === 1 ? " has" : "s have"} stock but no purchase cost, so stock value is understated. Receiving a purchase order or giving the stock a batch with a cost fixes this.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Reorder now" className="xl:col-span-3" action={canBuy ? <Link href="/admin/purchases/new" className="text-xs font-semibold text-[#6E1A2C] hover:underline">Create PO</Link> : undefined}>
          {o.reorder.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nothing needs reordering. Stock covers sales for longer than delivery takes.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr>
                  <th className={thCls}>Item</th><th className={`${thCls} text-right`}>In stock</th><th className={`${thCls} text-right`}>Sells / day</th>
                  <th className={`${thCls} text-right`}>Days left</th><th className={`${thCls} text-right`}>Suggest</th><th className={thCls}></th>
                </tr></thead>
                <tbody className="divide-y divide-border/60">
                  {o.reorder.slice(0, 25).map((r: any) => (
                    <tr key={r.key}>
                      <td className={tdCls}>{r.name}<span className="text-muted-foreground"> · {r.pack}</span></td>
                      <td className={`${tdCls} text-right tabular-nums`}>{r.stock}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{r.perDay || "—"}</td>
                      <td className={`${tdCls} text-right tabular-nums ${r.daysLeft !== null && r.daysLeft < 7 ? "font-semibold text-red-700" : ""}`}>{r.daysLeft ?? "—"}</td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums`}>{r.suggestQty ? `${r.suggestQty} packs` : "—"}</td>
                      <td className={tdCls}><StatusPill status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {o.lowMaterials.length > 0 && (
            <div className="border-t border-border/60 px-4 py-3 text-sm">
              <p className="mb-1 flex items-center gap-1.5 font-semibold"><Wheat className="h-4 w-4 text-[#c9a45a]" /> Bulk below reorder level</p>
              {o.lowMaterials.map((m: any) => <p key={m.id} className="text-muted-foreground">{m.name}: <b className="text-amber-700">{qtyFmt(m.stockQty, m.unit)}</b> (reorder at {m.reorderLevel} {m.unit})</p>)}
            </div>
          )}
        </Panel>

        <Panel title="Expiring or expired" className="xl:col-span-2" action={<Link href="/admin/batches" className="text-xs font-semibold text-[#6E1A2C] hover:underline">All batches</Link>}>
          {o.expiring.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No batch expires in the next 45 days.</p> : (
            <ul className="divide-y divide-border/60">
              {o.expiring.slice(0, 12).map((l: any) => {
                const st = expiryStatus(l.expiryDate);
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.name}{l.pack ? <span className="text-muted-foreground"> · {l.pack}</span> : null}</p>
                      <p className="text-xs text-muted-foreground"><span className="font-mono">{l.lotNumber}</span> · {qtyFmt(l.qtyLeft, l.unit)} · {inr(l.value)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusPill status={st} label={st === "EXPIRED" ? "Expired" : `${daysUntil(l.expiryDate)} days`} />
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{dateFmt(l.expiryDate)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Purchase orders on the way${lateCount ? ` · ${lateCount} late` : ""}`} action={canBuy ? <Link href="/admin/purchases" className="text-xs font-semibold text-[#6E1A2C] hover:underline">All POs</Link> : undefined}>
          {o.openPOs.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nothing on order.</p> : (
            <ul className="divide-y divide-border/60">
              {o.openPOs.slice(0, 8).map((p: any) => {
                const late = p.expectedDate && new Date(p.expectedDate) < new Date();
                return (
                  <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div>{canBuy ? <Link href={`/admin/purchases/${p.id}`} className="font-semibold text-[#6E1A2C] hover:underline">{p.number}</Link> : <b>{p.number}</b>} <span className="text-muted-foreground">· {p.supplier.name}</span></div>
                    <div className="text-right"><p className="tabular-nums">{inr(p.total)}</p><p className={`text-xs ${late ? "font-semibold text-red-700" : "text-muted-foreground"}`}>{late ? "Late · " : ""}due {dateFmt(p.expectedDate)}</p></div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Recent packing" action={<Link href="/admin/repack" className="text-xs font-semibold text-[#6E1A2C] hover:underline">Pack from bulk</Link>}>
          {o.recentRepacks.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No packing runs yet.</p> : (
            <ul className="divide-y divide-border/60">
              {o.recentRepacks.map((r: any) => {
                const pct = r.inputQty ? (r.wastageQty / r.inputQty) * 100 : 0;
                return (
                  <li key={r.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-[#c9a45a]" /><span>{r.material.name}</span><span className="text-xs text-muted-foreground">{dateFmt(r.createdAt)}</span></div>
                    <div className="text-right text-xs"><p className="tabular-nums">{qtyFmt(r.inputQty, "kg")} used</p><p className={pct > 5 ? "font-semibold text-red-700" : "text-muted-foreground"}>{pct.toFixed(1)}% wastage</p></div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
