"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Boxes, Search, ScanSearch, Ban, Tags } from "lucide-react";
import { createOpeningLotAction, traceLotAction, writeOffLotAction, type OpeningLotInput } from "@/app/actions/admin-warehouse";
import { daysUntil, expiryStatus } from "@/lib/wms-core";
import { PageHeader, Panel, Stat, SidePanel, Field, Empty, StatusPill, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr, qtyFmt, dateFmt } from "@/components/admin/ui";

const SOURCE: Record<string, string> = { PURCHASE: "Purchased", REPACK: "Packed here", OPENING: "Opening stock" };
const FILTERS = [
  { key: "active", label: "In stock" },
  { key: "soon", label: "Expiring ≤ 30 days" },
  { key: "expired", label: "Expired" },
  { key: "all", label: "All" },
] as const;

export function BatchesClient({ lots, unassigned, canTrace, initialQuery }: { lots: any[]; unassigned: any[]; canTrace: boolean; initialQuery: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<"PACK" | "MATERIAL">("PACK");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("active");
  const [q, setQ] = useState(initialQuery);
  const [assign, setAssign] = useState<(OpeningLotInput & { label: string; max: number }) | null>(null);
  const [writeOff, setWriteOff] = useState<{ lot: any; qty: number; note: string } | null>(null);
  const [trace, setTrace] = useState<any | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return lots.filter((l) => {
      if (!s && l.kind !== kind) return false;
      const st = expiryStatus(l.expiryDate);
      if (filter === "active" && l.qtyLeft <= 0) return false;
      if (filter === "soon" && (l.qtyLeft <= 0 || st !== "SOON")) return false;
      if (filter === "expired" && (l.qtyLeft <= 0 || st !== "EXPIRED")) return false;
      if (!s) return true;
      return `${l.lotNumber} ${l.product?.name ?? ""} ${l.material?.name ?? ""} ${l.supplier?.name ?? ""} ${l.po?.number ?? ""}`.toLowerCase().includes(s);
    });
  }, [lots, kind, filter, q]);

  const live = lots.filter((l) => l.qtyLeft > 0);
  const soon = live.filter((l) => expiryStatus(l.expiryDate) === "SOON");
  const expired = live.filter((l) => expiryStatus(l.expiryDate) === "EXPIRED");
  const atRisk = [...soon, ...expired].reduce((s, l) => s + l.qtyLeft * l.unitCost, 0);
  const unassignedUnits = unassigned.reduce((s, u) => s + u.unassigned, 0);

  const doAssign = () =>
    start(async () => {
      const { label, max, ...input } = assign!;
      const res = await createOpeningLotAction(input);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success(`Batch created for ${label}`);
      setAssign(null);
      router.refresh();
    });

  const doWriteOff = () =>
    start(async () => {
      const res = await writeOffLotAction({ lotId: writeOff!.lot.id, qty: writeOff!.qty, note: writeOff!.note });
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success(`Batch ${writeOff!.lot.lotNumber} written off`);
      setWriteOff(null);
      router.refresh();
    });

  const openTrace = (lot: any) =>
    start(async () => {
      setTrace({ loading: true, lot });
      const res = await traceLotAction(lot.id);
      if ("error" in res) { toast.error(res.error as string); setTrace(null); return; }
      setTrace(res);
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Batches & expiry" subtitle="Every batch with its code, supplier and best-before date. Orders always take the batch that expires first." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Batches in stock" value={live.length} />
        <Stat label="Expiring in 30 days" value={soon.length} tone={soon.length ? "warn" : undefined} />
        <Stat label="Expired, still in stock" value={expired.length} tone={expired.length ? "bad" : undefined} hint={expired.length ? "Write off or check" : undefined} />
        <Stat label="Value at risk" value={inr(atRisk)} hint="Expired + expiring stock at cost" tone={atRisk ? "warn" : undefined} />
      </div>

      {unassignedUnits > 0 && (
        <Panel title={<span className="flex items-center gap-2"><Tags className="h-4 w-4 text-[#c9a45a]" /> Packs without a batch ({unassignedUnits})</span>}>
          <p className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">This stock was added before batches were tracked. Give it a batch with its best-before date so expiry alerts and recalls cover it. Stock numbers don't change.</p>
          <div className="flex flex-wrap gap-2 p-4">
            {unassigned.slice(0, 60).map((u) => (
              <button key={u.key} onClick={() => setAssign({ productId: u.productId, variantId: u.variantId, qty: u.unassigned, label: `${u.name} · ${u.pack}`, max: u.unassigned, unitCost: u.costPrice ?? undefined })}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-left text-xs hover:border-[#c9a45a] hover:bg-[#fbf6ee]">
                <span className="font-semibold">{u.name}</span> · {u.pack} <span className="ml-1 rounded bg-muted px-1.5 font-semibold tabular-nums">{u.unassigned}</span>
              </button>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-muted/50 p-0.5">
              {(["PACK", "MATERIAL"] as const).map((k) => (
                <button key={k} onClick={() => setKind(k)} className={`rounded-md px-3 py-1 text-sm font-medium ${kind === k ? "bg-white shadow-sm" : "text-muted-foreground"}`}>{k === "PACK" ? "Packs" : "Bulk"}</button>
              ))}
            </div>
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${filter === f.key ? "bg-[#6E1A2C] text-white" : "text-muted-foreground hover:text-foreground"}`}>{f.label}</button>
            ))}
          </div>
        }
        action={
          <div className="flex h-9 w-56 items-center gap-2 rounded-lg border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Batch code, product, PO" className="w-full bg-transparent text-sm outline-none" />
          </div>
        }
      >
        {list.length === 0 ? (
          <Empty icon={<Boxes className="h-8 w-8" />} title="No batches here">Batches are created when you receive a purchase order, pack from bulk, or give existing stock a batch.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr>
                <th className={thCls}>Batch</th><th className={thCls}>Item</th><th className={thCls}>From</th><th className={`${thCls} text-right`}>Left / in</th>
                <th className={`${thCls} text-right`}>Cost</th><th className={thCls}>Best before</th><th className={thCls}></th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {list.map((l) => {
                  const st = expiryStatus(l.expiryDate);
                  const unit = l.kind === "PACK" ? "" : l.material?.unit ?? "kg";
                  return (
                    <tr key={l.id} className={l.qtyLeft <= 0 ? "opacity-50" : "hover:bg-muted/20"}>
                      <td className={tdCls}><p className="font-mono font-semibold">{l.lotNumber}</p><p className="text-xs text-muted-foreground">{dateFmt(l.receivedAt)}</p></td>
                      <td className={tdCls}>{l.kind === "PACK" ? <>{l.product?.name}<span className="text-muted-foreground"> · {l.variant?.label ?? ""}</span></> : l.material?.name}</td>
                      <td className={tdCls}>
                        <p>{SOURCE[l.source] ?? l.source}</p>
                        <p className="text-xs text-muted-foreground">{l.supplier?.name ?? ""}{l.po ? <> · <Link className="text-[#6E1A2C] hover:underline" href={`/admin/purchases/${l.po.id}`}>{l.po.number}</Link></> : null}</p>
                      </td>
                      <td className={`${tdCls} text-right tabular-nums`}><b>{qtyFmt(l.qtyLeft, unit)}</b><span className="text-muted-foreground"> / {qtyFmt(l.qtyIn, unit)}</span></td>
                      <td className={`${tdCls} text-right tabular-nums`}>{inr(l.unitCost, 2)}<span className="text-xs text-muted-foreground">/{unit || "pack"}</span></td>
                      <td className={tdCls}>
                        {l.expiryDate ? <>
                          <p>{dateFmt(l.expiryDate)}</p>
                          {l.qtyLeft > 0 && <StatusPill status={st} label={st === "EXPIRED" ? "Expired" : st === "SOON" ? `${daysUntil(l.expiryDate)} days left` : undefined} />}
                        </> : <span className="text-xs text-muted-foreground">Not set</span>}
                      </td>
                      <td className={`${tdCls} whitespace-nowrap text-right`}>
                        {canTrace && l.kind === "PACK" && l._count.allocations > 0 && <button className={btnGhost} onClick={() => openTrace(l)}><ScanSearch className="h-3.5 w-3.5" /> Who got it</button>}
                        {l.qtyLeft > 0 && <button className={btnGhost} onClick={() => setWriteOff({ lot: l, qty: l.qtyLeft, note: st === "EXPIRED" ? "Expired" : "" })}><Ban className="h-3.5 w-3.5" /> Write off</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <SidePanel open={!!assign} onOpenChange={(o) => !o && setAssign(null)} title="Give stock a batch" description={assign?.label}
        footer={<><button className={btnSecondary} onClick={() => setAssign(null)}>Cancel</button><button className={btnPrimary} disabled={pending || !(assign && assign.qty > 0)} onClick={doAssign}>Create batch</button></>}>
        {assign && (
          <div className="space-y-3">
            <Field label="Packs in this batch" hint={`Up to ${assign.max}. If packs on the shelf have different dates, create one batch per date.`}>
              <input type="number" min={1} max={assign.max} className={inputCls} value={assign.qty || ""} onChange={(e) => setAssign({ ...assign, qty: Number(e.target.value) })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Packed on"><input type="date" className={inputCls} value={assign.mfgDate ?? ""} onChange={(e) => setAssign({ ...assign, mfgDate: e.target.value })} /></Field>
              <Field label="Best before"><input type="date" className={inputCls} value={assign.expiryDate ?? ""} onChange={(e) => setAssign({ ...assign, expiryDate: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Batch code" hint="As stamped on the pack; empty = automatic"><input className={`${inputCls} font-mono uppercase`} value={assign.lotNumber ?? ""} onChange={(e) => setAssign({ ...assign, lotNumber: e.target.value.toUpperCase() })} /></Field>
              <Field label="Cost per pack (₹)"><input type="number" min={0} step={0.01} className={inputCls} value={assign.unitCost ?? ""} onChange={(e) => setAssign({ ...assign, unitCost: Number(e.target.value) })} /></Field>
            </div>
          </div>
        )}
      </SidePanel>

      <SidePanel open={!!writeOff} onOpenChange={(o) => !o && setWriteOff(null)} title={`Write off ${writeOff?.lot.lotNumber ?? ""}`} description="Stock goes down and the loss is recorded against this batch."
        footer={<><button className={btnSecondary} onClick={() => setWriteOff(null)}>Cancel</button><button className={`${btnPrimary} bg-red-700 hover:bg-red-800`} disabled={pending || !(writeOff && writeOff.qty > 0)} onClick={doWriteOff}>Write off</button></>}>
        {writeOff && (
          <div className="space-y-3">
            <Field label={`Quantity (max ${writeOff.lot.qtyLeft})`}><input type="number" min={0} max={writeOff.lot.qtyLeft} step={writeOff.lot.kind === "PACK" ? 1 : 0.001} className={inputCls} value={writeOff.qty || ""} onChange={(e) => setWriteOff({ ...writeOff, qty: Number(e.target.value) })} /></Field>
            <Field label="Reason"><input className={inputCls} value={writeOff.note} onChange={(e) => setWriteOff({ ...writeOff, note: e.target.value })} placeholder="Expired, damaged, insects…" /></Field>
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">Loss: {inr(writeOff.qty * writeOff.lot.unitCost, 2)}</p>
          </div>
        )}
      </SidePanel>

      <SidePanel wide open={!!trace} onOpenChange={(o) => !o && setTrace(null)} title={`Batch ${trace?.lot?.lotNumber ?? ""}: who got it`}
        description="Customers who received packs from this batch. Use it for a recall or a quality complaint.">
        {trace?.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : trace && (
          <div className="space-y-3">
            <p className="text-sm"><b>{trace.units}</b> packs went to <b>{trace.customers}</b> order{trace.customers === 1 ? "" : "s"}.</p>
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr><th className={thCls}>Order</th><th className={thCls}>Customer</th><th className={thCls}>Phone</th><th className={`${thCls} text-right`}>Packs</th><th className={thCls}>Date</th></tr></thead>
              <tbody className="divide-y divide-border/60">
                {trace.rows.map((r: any, i: number) => (
                  <tr key={i}>
                    <td className={tdCls}>{r.orderId ? <Link className="font-semibold text-[#6E1A2C] hover:underline" href={`/admin/orders/${r.orderId}`}>{r.ref}</Link> : <span className="text-muted-foreground">Write-off / correction</span>}</td>
                    <td className={tdCls}>{r.customer ?? "—"}</td>
                    <td className={tdCls}>{r.phone ? <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a> : "—"}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{r.qty}</td>
                    <td className={tdCls}>{dateFmt(r.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
