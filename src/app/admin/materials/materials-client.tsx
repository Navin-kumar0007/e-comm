"use client";

import Link from "next/link";
import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Wheat, History, PackagePlus, Scissors } from "lucide-react";
import { adjustMaterialAction, getMaterialHistoryAction, saveMaterialAction, type MaterialAdjustInput, type MaterialInput } from "@/app/actions/admin-warehouse";
import { expiryStatus } from "@/lib/wms-core";
import { PageHeader, Panel, Stat, SidePanel, Field, Empty, StatusPill, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr, qtyFmt, dateFmt } from "@/components/admin/ui";

const REASON: Record<string, string> = { PURCHASE: "Purchased", REPACK: "Packed into jars", WASTAGE: "Wastage", CORRECTION: "Correction", OPENING: "Opening stock" };
const BLANK: MaterialInput = { name: "", unit: "kg", productId: null, reorderLevel: 0, hsnCode: "", gstRate: 5, isActive: true };

export function MaterialsClient({ materials, products }: { materials: any[]; products: Array<{ id: string; name: string; hsnCode: string | null; gstRate: number | null }> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<MaterialInput | null>(null);
  const [adj, setAdj] = useState<(MaterialAdjustInput & { name: string; unit: string }) | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, any[]>>({});

  const value = materials.reduce((s, m) => s + Math.max(0, m.stockQty) * m.avgCost, 0);
  const low = materials.filter((m) => m.isActive && m.reorderLevel > 0 && m.stockQty <= m.reorderLevel);
  const expiring = materials.flatMap((m) => m.lots).filter((l: any) => ["EXPIRED", "SOON"].includes(expiryStatus(l.expiryDate)));

  const toggle = async (id: string) => {
    setOpen((o) => (o === id ? null : id));
    if (!history[id]) {
      const rows = await getMaterialHistoryAction(id);
      setHistory((h) => ({ ...h, [id]: rows }));
    }
  };

  const save = () =>
    start(async () => {
      const res = await saveMaterialAction(form!);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("Saved");
      setForm(null);
      router.refresh();
    });

  const adjust = () =>
    start(async () => {
      const { name, unit, ...input } = adj!;
      const res = await adjustMaterialAction(input);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success(`${name} updated`);
      setHistory((h) => { const n = { ...h }; delete n[input.materialId]; return n; });
      setAdj(null);
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk stock"
        subtitle="Dry fruits and seeds bought by the kg, before they are packed into jars and pouches."
        actions={<>
          <Link href="/admin/repack" className={btnSecondary}><Scissors className="h-4 w-4" /> Pack from bulk</Link>
          <button className={btnPrimary} onClick={() => setForm({ ...BLANK })}><Plus className="h-4 w-4" /> Add bulk item</button>
        </>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Bulk items" value={materials.filter((m) => m.isActive).length} />
        <Stat label="In stock" value={qtyFmt(materials.reduce((s, m) => s + Math.max(0, m.stockQty), 0), "kg")} />
        <Stat label="Stock value" value={inr(value)} hint="At average purchase cost" />
        <Stat label="Need attention" value={low.length + expiring.length} tone={low.length + expiring.length ? "warn" : undefined} hint={`${low.length} low · ${expiring.length} expiring`} />
      </div>

      <Panel title="Bulk items">
        {materials.length === 0 ? (
          <Empty icon={<Wheat className="h-8 w-8" />} title="No bulk items yet">
            Add each thing you buy loose, like "Almonds California (bulk)". Then record opening stock, buy more with a purchase order, and pack it into jars.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr>
                <th className={thCls}>Item</th><th className={thCls}>Packed into</th><th className={`${thCls} text-right`}>In stock</th>
                <th className={`${thCls} text-right`}>Avg cost</th><th className={`${thCls} text-right`}>Value</th><th className={thCls}>Oldest batch</th><th className={thCls}></th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {materials.map((m) => {
                  const isLow = m.reorderLevel > 0 && m.stockQty <= m.reorderLevel;
                  const first = m.lots[0];
                  return (
                    <Fragment key={m.id}>
                      <tr className={m.isActive ? "hover:bg-muted/20" : "opacity-50"}>
                        <td className={tdCls}>
                          <p className="font-semibold">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.hsnCode ? `HSN ${m.hsnCode} · ` : ""}{m.gstRate !== null ? `GST ${m.gstRate}%` : ""}{m.reorderLevel ? ` · reorder at ${m.reorderLevel} ${m.unit}` : ""}</p>
                        </td>
                        <td className={tdCls}>{m.product?.name ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className={`${tdCls} text-right font-semibold tabular-nums ${isLow ? "text-amber-700" : ""}`}>{qtyFmt(m.stockQty, m.unit)}{isLow && <p className="text-[11px] font-medium">Low</p>}</td>
                        <td className={`${tdCls} text-right tabular-nums`}>{inr(m.avgCost, 2)}/{m.unit}</td>
                        <td className={`${tdCls} text-right tabular-nums`}>{inr(Math.max(0, m.stockQty) * m.avgCost)}</td>
                        <td className={tdCls}>
                          {first ? (
                            <div className="space-y-0.5">
                              <p className="font-mono text-xs">{first.lotNumber} · {qtyFmt(first.qtyLeft, m.unit)}</p>
                              <StatusPill status={expiryStatus(first.expiryDate)} label={first.expiryDate ? dateFmt(first.expiryDate) : undefined} />
                            </div>
                          ) : <span className="text-xs text-muted-foreground">No batches</span>}
                        </td>
                        <td className={`${tdCls} whitespace-nowrap text-right`}>
                          <button className={btnGhost} onClick={() => setAdj({ materialId: m.id, name: m.name, unit: m.unit, kind: m.stockQty > 0 ? "WASTAGE" : "OPENING", qty: 0, unitCost: m.avgCost || undefined })}><PackagePlus className="h-3.5 w-3.5" /> Adjust</button>
                          <button className={btnGhost} onClick={() => toggle(m.id)}><History className="h-3.5 w-3.5" /> History</button>
                          <button className={btnGhost} onClick={() => setForm({ id: m.id, name: m.name, unit: m.unit, productId: m.productId, reorderLevel: m.reorderLevel, hsnCode: m.hsnCode, gstRate: m.gstRate, isActive: m.isActive })}>Edit</button>
                        </td>
                      </tr>
                      {open === m.id && (
                        <tr><td colSpan={7} className="bg-muted/20 px-4 py-3">
                          {!history[m.id] ? <p className="text-xs text-muted-foreground">Loading…</p> : history[m.id].length === 0 ? <p className="text-xs text-muted-foreground">No movements yet.</p> : (
                            <table className="w-full text-xs">
                              <tbody className="divide-y divide-border/50">
                                {history[m.id].map((h: any) => (
                                  <tr key={h.id}>
                                    <td className="py-1.5 pr-3 text-muted-foreground">{new Date(h.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                                    <td className="py-1.5 pr-3">{REASON[h.reason] ?? h.reason}</td>
                                    <td className={`py-1.5 pr-3 text-right font-semibold tabular-nums ${h.delta < 0 ? "text-red-700" : "text-emerald-700"}`}>{h.delta > 0 ? "+" : ""}{qtyFmt(h.delta, m.unit)}</td>
                                    <td className="py-1.5 pr-3 text-right tabular-nums">{qtyFmt(h.balanceAfter, m.unit)}</td>
                                    <td className="py-1.5 pr-3 text-muted-foreground">{h.note}</td>
                                    <td className="py-1.5 text-muted-foreground">{h.actor.split(":").pop()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td></tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <SidePanel open={!!form} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? "Edit bulk item" : "Add bulk item"}
        description="Link it to the product it is packed into, so repacking knows which jars to fill."
        footer={<><button className={btnSecondary} onClick={() => setForm(null)}>Cancel</button><button className={btnPrimary} disabled={pending || !form?.name} onClick={save}>Save</button></>}>
        {form && (
          <div className="space-y-3">
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Almonds California (bulk)" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Unit">
                <select className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="kg">kg</option><option value="pcs">pieces</option></select>
              </Field>
              <Field label="Reorder when below" hint={form.unit}><input type="number" min={0} className={inputCls} value={form.reorderLevel ?? 0} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Packed into product">
              <select className={inputCls} value={form.productId ?? ""} onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                setForm({ ...form, productId: e.target.value || null, hsnCode: form.hsnCode || p?.hsnCode || "", gstRate: form.gstRate ?? p?.gstRate ?? 5, name: form.name || (p ? `${p.name} (bulk)` : "") });
              }}>
                <option value="">— Not linked —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="HSN code"><input className={inputCls} value={form.hsnCode ?? ""} onChange={(e) => setForm({ ...form, hsnCode: e.target.value.replace(/\D/g, "") })} maxLength={8} /></Field>
              <Field label="GST on purchase">
                <select className={inputCls} value={form.gstRate ?? ""} onChange={(e) => setForm({ ...form, gstRate: e.target.value === "" ? null : Number(e.target.value) })}>
                  <option value="">—</option>{[0, 5, 12, 18].map((r) => <option key={r} value={r}>{r}%</option>)}
                </select>
              </Field>
            </div>
            {form.id && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#6E1A2C]" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>}
          </div>
        )}
      </SidePanel>

      <SidePanel open={!!adj} onOpenChange={(o) => !o && setAdj(null)} title={`Adjust ${adj?.name ?? ""}`}
        description="To add stock you bought, use a purchase order instead, so the supplier and cost are recorded."
        footer={<><button className={btnSecondary} onClick={() => setAdj(null)}>Cancel</button><button className={btnPrimary} disabled={pending || !(adj && adj.qty > 0)} onClick={adjust}>Save</button></>}>
        {adj && (
          <div className="space-y-3">
            <Field label="What happened">
              <select className={inputCls} value={adj.kind} onChange={(e) => setAdj({ ...adj, kind: e.target.value as any })}>
                <option value="OPENING">Opening stock (already on hand)</option>
                <option value="WASTAGE">Wastage (spoiled, insects, spilled)</option>
                <option value="REMOVE">Correction: remove</option>
                <option value="ADD">Correction: add</option>
              </select>
            </Field>
            <Field label={`Quantity (${adj.unit})`}><input type="number" min={0} step={0.001} className={inputCls} value={adj.qty || ""} onChange={(e) => setAdj({ ...adj, qty: Number(e.target.value) })} /></Field>
            {adj.kind === "OPENING" && (<>
              <Field label={`Cost per ${adj.unit} (₹)`} hint="What you paid, before GST"><input type="number" min={0} step={0.01} className={inputCls} value={adj.unitCost ?? ""} onChange={(e) => setAdj({ ...adj, unitCost: Number(e.target.value) })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Best before"><input type="date" className={inputCls} value={adj.expiryDate ?? ""} onChange={(e) => setAdj({ ...adj, expiryDate: e.target.value })} /></Field>
                <Field label="Batch code" hint="Empty = automatic"><input className={`${inputCls} font-mono uppercase`} value={adj.lotNumber ?? ""} onChange={(e) => setAdj({ ...adj, lotNumber: e.target.value.toUpperCase() })} /></Field>
              </div>
            </>)}
            <Field label="Note"><input className={inputCls} value={adj.note ?? ""} onChange={(e) => setAdj({ ...adj, note: e.target.value })} /></Field>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
