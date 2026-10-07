"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Scissors, Plus, Trash2, ArrowRight } from "lucide-react";
import { createRepackAction } from "@/app/actions/admin-warehouse";
import { repackPlan } from "@/lib/wms-core";
import { PageHeader, Panel, Field, Empty, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr, qtyFmt, dateFmt } from "@/components/admin/ui";

interface Material { id: string; name: string; stockQty: number; avgCost: number; productId: string | null }
interface Unit { key: string; productId: string; variantId: string | null; name: string; pack: string; grams: number | null; stock: number }

export function RepackClient({ materials, units, runs, initialMaterial }: { materials: Material[]; units: Unit[]; runs: any[]; initialMaterial?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [materialId, setMaterialId] = useState(initialMaterial ?? materials.find((m) => m.stockQty > 0)?.id ?? materials[0]?.id ?? "");
  const m = materials.find((x) => x.id === materialId);
  const suggested = (mat?: Material) => units.filter((u) => u.productId === mat?.productId && u.grams).map((u) => ({ key: u.key, packs: 0 }));
  const [inputQty, setInputQty] = useState<number>(0);
  const [packingCost, setPackingCost] = useState<number>(0);
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [outputs, setOutputs] = useState<Array<{ key: string; packs: number }>>(() => {
    const s = suggested(m);
    return s.length ? s : [{ key: "", packs: 0 }];
  });

  const chooseMaterial = (id: string) => {
    setMaterialId(id);
    const s = suggested(materials.find((x) => x.id === id));
    setOutputs(s.length ? s : [{ key: "", packs: 0 }]);
  };

  const rows = outputs.map((o) => ({ ...o, unit: units.find((u) => u.key === o.key) }));
  const plan = useMemo(
    () => repackPlan({ inputKg: Number(inputQty) || 0, costPerKg: m?.avgCost ?? 0, packingCost: Number(packingCost) || 0, outputs: rows.filter((r) => r.unit?.grams).map((r) => ({ grams: r.unit!.grams!, packs: Number(r.packs) || 0 })) }),
    [inputQty, packingCost, m, rows]
  );
  const costed = rows.filter((r) => r.unit?.grams);

  const submit = () =>
    start(async () => {
      const res = await createRepackAction({
        materialId, inputQty: Number(inputQty), packingCost: Number(packingCost) || 0, expiryDate: expiry || null, notes,
        outputs: rows.filter((r) => r.unit && r.packs > 0).map((r) => ({ productId: r.unit!.productId, variantId: r.unit!.variantId, packs: Number(r.packs) })),
      });
      if ("error" in res) { toast.error(res.error); return; }
      toast.success(`${res.number}: packs added as batch ${res.lots?.join(", ")}`);
      setInputQty(0);
      setOutputs((o) => o.map((x) => ({ ...x, packs: 0 })));
      setNotes("");
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Pack from bulk" subtitle="Turn bulk stock into jars and pouches. Wastage is worked out for you, and its cost is added to each pack." />

      {materials.length === 0 ? (
        <Panel><Empty icon={<Scissors className="h-8 w-8" />} title="No bulk items yet">Add your bulk items and their stock on the <Link className="font-semibold text-[#6E1A2C] underline" href="/admin/materials">Bulk stock</Link> page first.</Empty></Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="New packing run" className="lg:col-span-2">
            <div className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Bulk item" className="sm:col-span-2" hint={m ? `${qtyFmt(m.stockQty, "kg")} in stock · ${inr(m.avgCost, 2)}/kg` : undefined}>
                  <select className={inputCls} value={materialId} onChange={(e) => chooseMaterial(e.target.value)}>
                    {materials.map((x) => <option key={x.id} value={x.id}>{x.name} ({qtyFmt(x.stockQty, "kg")})</option>)}
                  </select>
                </Field>
                <Field label="Bulk used (kg)"><input type="number" min={0} step={0.001} className={inputCls} value={inputQty || ""} onChange={(e) => setInputQty(Number(e.target.value))} /></Field>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-foreground/80">Packs made</span>
                  <button className={btnGhost} onClick={() => setOutputs((o) => [...o, { key: "", packs: 0 }])}><Plus className="h-3.5 w-3.5" /> Another size</button>
                </div>
                <div className="space-y-2">
                  {outputs.map((o, i) => {
                    const u = units.find((x) => x.key === o.key);
                    const ci = costed.findIndex((r) => r === rows[i]);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <select className={inputCls} value={o.key} onChange={(e) => setOutputs((all) => all.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}>
                          <option value="">Choose product and size…</option>
                          {units.map((x) => <option key={x.key} value={x.key} disabled={!x.grams}>{x.name} · {x.pack}{x.grams ? "" : " (weight unknown)"}</option>)}
                        </select>
                        <input type="number" min={0} step={1} placeholder="Packs" className={`${inputCls} w-28`} value={o.packs || ""} onChange={(e) => setOutputs((all) => all.map((x, j) => (j === i ? { ...x, packs: Number(e.target.value) } : x)))} />
                        <span className="w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{u?.grams && o.packs ? qtyFmt((u.grams * o.packs) / 1000, "kg") : ""}{ci >= 0 && plan.packCosts[ci] && o.packs ? <><br />{inr(plan.packCosts[ci], 2)}/pack</> : null}</span>
                        <button aria-label="Remove" className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-700" onClick={() => setOutputs((all) => (all.length > 1 ? all.filter((_, j) => j !== i) : all))}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Jar + label + seal cost (₹/pack)" hint="Added to each pack's cost"><input type="number" min={0} step={0.01} className={inputCls} value={packingCost || ""} onChange={(e) => setPackingCost(Number(e.target.value))} /></Field>
                <Field label="Best before" hint="Empty = same as the bulk batch"><input type="date" className={inputCls} value={expiry} onChange={(e) => setExpiry(e.target.value)} /></Field>
                <Field label="Note"><input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Packed by…" /></Field>
              </div>

              <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ${plan.error && inputQty ? "bg-red-50 text-red-800" : "bg-[#fbf6ee] text-[#5a4a32]"}`}>
                {plan.error && inputQty ? <span>{plan.error}</span> : (
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span><b>{qtyFmt(Number(inputQty) || 0, "kg")}</b> bulk</span><ArrowRight className="h-4 w-4" />
                    <span><b>{qtyFmt(plan.outputKg, "kg")}</b> in packs</span>
                    <span>Wastage <b className={plan.wastagePct > 5 ? "text-red-700" : ""}>{qtyFmt(Math.max(0, plan.wastageKg), "kg")} ({Math.max(0, plan.wastagePct)}%)</b></span>
                  </span>
                )}
                <button className={btnPrimary} disabled={pending || !!plan.error || !m} onClick={submit}>{pending ? "Saving…" : "Add packs to stock"}</button>
              </div>
            </div>
          </Panel>

          <Panel title="How it works">
            <ol className="list-decimal space-y-2 p-4 pl-8 text-sm text-muted-foreground">
              <li>Weigh the bulk you take out and enter it.</li>
              <li>Count the packs filled for each size.</li>
              <li>Bulk stock goes down, oldest batch first. Pack stock goes up as a new batch.</li>
              <li>Stamp the new batch code and best-before date on the packs.</li>
              <li>Wastage over 5% is shown in red so you can check the scale.</li>
            </ol>
          </Panel>
        </div>
      )}

      <Panel title="Recent packing runs">
        {runs.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No packing runs yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr>
                <th className={thCls}>Run</th><th className={thCls}>Date</th><th className={thCls}>Bulk</th><th className={`${thCls} text-right`}>Used</th>
                <th className={thCls}>Packs made</th><th className={`${thCls} text-right`}>Wastage</th><th className={`${thCls} text-right`}>Bulk cost</th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {runs.map((r) => {
                  let out: any[] = [];
                  try { out = JSON.parse(r.outputs).items ?? []; } catch { /* old format */ }
                  const pct = r.inputQty ? (r.wastageQty / r.inputQty) * 100 : 0;
                  return (
                    <tr key={r.id}>
                      <td className={`${tdCls} font-mono text-xs font-semibold`}>{r.number}</td>
                      <td className={tdCls}>{dateFmt(r.createdAt)}<p className="text-xs text-muted-foreground">{r.actor.split(":").pop()}</p></td>
                      <td className={tdCls}>{r.material.name}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{qtyFmt(r.inputQty, "kg")}</td>
                      <td className={tdCls}>{out.map((o, i) => <p key={i} className="text-xs"><b>{o.packs}</b> × {o.name} {o.label} <span className="font-mono text-muted-foreground">{o.lotNumber}</span></p>)}</td>
                      <td className={`${tdCls} text-right tabular-nums ${pct > 5 ? "text-red-700" : ""}`}>{qtyFmt(r.wastageQty, "kg")}<p className="text-xs">{pct.toFixed(1)}%</p></td>
                      <td className={`${tdCls} text-right tabular-nums`}>{inr(r.costPerKg, 2)}/kg</td>
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
