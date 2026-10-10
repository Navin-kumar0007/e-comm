"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Boxes, Search, ScanSearch, Ban, Tags, Printer, Layers } from "lucide-react";
import { createBulkOpeningLotsAction, createOpeningLotAction, traceLotAction, writeOffLotAction, type OpeningLotInput } from "@/app/actions/admin-warehouse";
import { daysUntil, expiryStatus } from "@/lib/wms-core";
import { PageHeader, Panel, Stat, SidePanel, Field, Empty, StatusPill, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr, qtyFmt, dateFmt, isoDay } from "@/components/admin/ui";

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
  const [stickerSize, setStickerSize] = useState<"50x25" | "a4">("50x25");
  const [bulk, setBulk] = useState<{ mfgDate: string; months: number; rows: Array<{ key: string; productId: string; variantId: string | null; label: string; qty: number; max: number; months: number; cost: number | null; on: boolean }> } | null>(null);
  const [made, setMade] = useState<Array<{ id: string; lotNumber: string; qty: number }> | null>(null);
  const stickerHref = (rows: Array<{ id: string; qty: number }>) => `/admin/batches/print?size=${stickerSize}&items=${rows.map((r) => `${r.id}:${Math.max(1, Math.round(r.qty))}`).join(",")}`;
  const openBulk = () => setBulk({
    mfgDate: isoDay(), months: 6,
    rows: unassigned.map((u) => ({ key: u.key, productId: u.productId, variantId: u.variantId, label: `${u.name} · ${u.pack}`, qty: u.unassigned, max: u.unassigned, months: 6, cost: u.costPrice ?? null, on: true })),
  });
  const doBulk = () =>
    start(async () => {
      const res = await createBulkOpeningLotsAction({
        mfgDate: bulk!.mfgDate,
        items: bulk!.rows.filter((r) => r.on && r.qty > 0).map((r) => ({ productId: r.productId, variantId: r.variantId, qty: r.qty, shelfLifeMonths: r.months, unitCost: r.cost })),
      });
      if ("error" in res) { toast.error(res.error); return; }
      toast.success(`${res.created} batch${res.created === 1 ? "" : "es"} created`);
      setBulk(null);
      setMade(res.lots);
      router.refresh();
    });

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

      {made && made.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c9a45a] bg-[#fbf6ee] px-4 py-3 text-sm">
          <span><b>{made.length} batches created</b> ({made.map((m) => m.lotNumber).slice(0, 4).join(", ")}{made.length > 4 ? "…" : ""}). Stick a batch label on each pack, or stamp the code and dates.</span>
          <span className="flex gap-2">
            <a href={stickerHref(made)} target="_blank" rel="noreferrer" className={btnPrimary}><Printer className="h-4 w-4" /> Print stickers ({made.reduce((t, m) => t + m.qty, 0)})</a>
            <button className={btnSecondary} onClick={() => setMade(null)}>Done</button>
          </span>
        </div>
      )}

      {unassignedUnits > 0 && (
        <Panel title={<span className="flex items-center gap-2"><Tags className="h-4 w-4 text-[#c9a45a]" /> Packs without a batch ({unassignedUnits})</span>}
          action={<button className={btnPrimary} onClick={openBulk}><Layers className="h-4 w-4" /> Give all a batch</button>}>
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
          <div className="flex items-center gap-2">
            <div className="w-40"><select className={inputCls} value={stickerSize} onChange={(e) => setStickerSize(e.target.value as "50x25" | "a4")} aria-label="Sticker size">
              <option value="50x25">50 × 25 mm roll</option><option value="a4">A4 · 65 per sheet</option>
            </select></div>
            <div className="flex h-9 w-56 items-center gap-2 rounded-lg border border-border px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Batch code, product, PO" className="w-full bg-transparent text-sm outline-none" />
            </div>
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
                        {l.kind === "PACK" && l.qtyLeft > 0 && <a className={btnGhost} href={stickerHref([{ id: l.id, qty: l.qtyLeft }])} target="_blank" rel="noreferrer"><Printer className="h-3.5 w-3.5" /> Stickers</a>}
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

      <SidePanel wide open={!!bulk} onOpenChange={(o) => !o && setBulk(null)} title="Give shelf stock a batch"
        description="One batch per product and pack size. Stock numbers don't change. Change the shelf life for anything that keeps longer or shorter."
        footer={<><button className={btnSecondary} onClick={() => setBulk(null)}>Cancel</button><button className={btnPrimary} disabled={pending || !bulk?.rows.some((r) => r.on && r.qty > 0)} onClick={doBulk}>{pending ? "Creating…" : `Create ${bulk?.rows.filter((r) => r.on && r.qty > 0).length ?? 0} batches`}</button></>}>
        {bulk && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Packed on"><input type="date" className={inputCls} value={bulk.mfgDate} max={isoDay()} onChange={(e) => setBulk({ ...bulk, mfgDate: e.target.value })} /></Field>
              <Field label="Shelf life for all (months)" hint="Best before = packed date + months">
                <input type="number" min={1} max={36} className={inputCls} value={bulk.months} onChange={(e) => { const m = Math.max(1, Math.min(36, Number(e.target.value) || 1)); setBulk({ ...bulk, months: m, rows: bulk.rows.map((r) => ({ ...r, months: m })) }); }} />
              </Field>
            </div>
            <p className="rounded-lg bg-[#fbf6ee] px-3 py-2 text-xs text-[#5a4a32]">Typical shelf life: dry fruits and nuts 6–9 months; dates, figs and raisins 9–12 months; seeds 6 months; roasted or spiced 3–4 months. Use what your packing supplier or FSSAI label says.</p>
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr>
                <th className={`${thCls} w-8`}><input type="checkbox" aria-label="Select all" className="h-4 w-4 accent-[#6E1A2C]" checked={bulk.rows.every((r) => r.on)} onChange={(e) => setBulk({ ...bulk, rows: bulk.rows.map((r) => ({ ...r, on: e.target.checked })) })} /></th>
                <th className={thCls}>Product</th><th className={`${thCls} w-24`}>Packs</th><th className={`${thCls} w-24`}>Months</th><th className={`${thCls} w-28`}>Cost / pack ₹</th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {bulk.rows.map((r, i) => {
                  const upd = (patch: Partial<typeof r>) => setBulk({ ...bulk, rows: bulk.rows.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                  return (
                    <tr key={r.key} className={r.on ? "" : "opacity-40"}>
                      <td className={tdCls}><input type="checkbox" aria-label={`Include ${r.label}`} className="h-4 w-4 accent-[#6E1A2C]" checked={r.on} onChange={(e) => upd({ on: e.target.checked })} /></td>
                      <td className={tdCls}>{r.label}</td>
                      <td className={tdCls}><input type="number" min={1} max={r.max} className={inputCls} value={r.qty} onChange={(e) => upd({ qty: Math.max(0, Math.min(r.max, Math.floor(Number(e.target.value) || 0))) })} /></td>
                      <td className={tdCls}><input type="number" min={1} max={36} className={inputCls} value={r.months} onChange={(e) => upd({ months: Math.max(1, Math.min(36, Number(e.target.value) || 1)) })} /></td>
                      <td className={tdCls}><input type="number" min={0} step={0.01} placeholder="unknown" className={inputCls} value={r.cost ?? ""} onChange={(e) => upd({ cost: e.target.value === "" ? null : Number(e.target.value) })} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground">Cost per pack is what one pack cost you (product + jar + label). It makes stock value and profit correct; you can leave it empty and add it later.</p>
          </div>
        )}
      </SidePanel>

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
