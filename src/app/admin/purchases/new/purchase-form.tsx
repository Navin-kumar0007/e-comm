"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { savePurchaseOrderAction, type PurchaseLineInput } from "@/app/actions/admin-purchasing";
import { purchaseTotals } from "@/lib/wms-core";
import { PageHeader, Panel, Field, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr, isoDay } from "@/components/admin/ui";

interface Data {
  suppliers: Array<{ id: string; name: string; gstin: string | null; leadDays: number }>;
  materials: Array<{ id: string; name: string; unit: string; avgCost: number; gstRate: number | null; stockQty: number }>;
  units: Array<{ key: string; productId: string; variantId: string | null; name: string; pack: string; costPrice: number | null; stock: number }>;
}

type Line = PurchaseLineInput & { uid: number; itemKey: string };
let uid = 0;
const blankLine = (kind: "MATERIAL" | "PACK" = "MATERIAL"): Line => ({ uid: ++uid, kind, itemKey: "", qty: 0, rate: 0, gstRate: 5 });

export function PurchaseForm({ data, existing, supplierId }: { data: Data; existing: any | null; supplierId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [supplier, setSupplier] = useState<string>(existing?.supplierId ?? supplierId ?? data.suppliers[0]?.id ?? "");
  const [expected, setExpected] = useState<string>(existing?.expectedDate ? isoDay(new Date(existing.expectedDate)) : "");
  const [freight, setFreight] = useState<number>(existing?.freight ?? 0);
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");
  const [lines, setLines] = useState<Line[]>(() =>
    existing?.lines?.length
      ? existing.lines.map((l: any) => ({
          uid: ++uid, kind: l.materialId ? "MATERIAL" : "PACK", materialId: l.materialId, productId: l.productId, variantId: l.variantId,
          itemKey: l.materialId ?? (l.variantId ? `${l.productId}:${l.variantId}` : l.productId), qty: l.qty, rate: l.rate, gstRate: l.gstRate,
        }))
      : [blankLine(data.materials.length ? "MATERIAL" : "PACK")]
  );

  const sup = data.suppliers.find((s) => s.id === supplier);
  const totals = useMemo(() => purchaseTotals(lines.map((l) => ({ qty: Number(l.qty) || 0, rate: Number(l.rate) || 0, gstRate: Number(l.gstRate) || 0 })), Number(freight) || 0, !!sup?.gstin), [lines, freight, sup]);

  const update = (id: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.uid === id ? { ...l, ...patch } : l)));
  const pick = (l: Line, key: string) => {
    if (l.kind === "MATERIAL") {
      const m = data.materials.find((x) => x.id === key);
      update(l.uid, { itemKey: key, materialId: key, productId: null, variantId: null, rate: l.rate || m?.avgCost || 0, gstRate: m?.gstRate ?? l.gstRate });
    } else {
      const u = data.units.find((x) => x.key === key);
      update(l.uid, { itemKey: key, materialId: null, productId: u?.productId, variantId: u?.variantId ?? null, rate: l.rate || u?.costPrice || 0 });
    }
  };

  const save = (status: "DRAFT" | "ORDERED") =>
    start(async () => {
      const res = await savePurchaseOrderAction({
        id: existing?.id, supplierId: supplier, expectedDate: expected || null, freight: Number(freight) || 0, notes, status,
        lines: lines.filter((l) => l.itemKey).map(({ kind, materialId, productId, variantId, qty, rate, gstRate }) => ({ kind, materialId, productId, variantId, qty: Number(qty), rate: Number(rate), gstRate: Number(gstRate) })),
      });
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success(status === "ORDERED" ? `${res.number} saved as ordered` : `${res.number} saved as draft`);
      router.push(`/admin/purchases/${res.id}`);
    });

  if (!data.suppliers.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="New purchase order" />
        <Panel><div className="p-8 text-center text-sm">Add a supplier first. <Link className="font-semibold text-[#6E1A2C] underline" href="/admin/suppliers">Go to Suppliers</Link></div></Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/purchases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Purchase orders</Link>
      <PageHeader title={existing ? `Edit ${existing.number}` : "New purchase order"} subtitle="Rates are before GST. Freight is shared across the items by value." />

      <Panel title="Supplier">
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Supplier" hint={sup ? (sup.gstin ? `GSTIN ${sup.gstin} · GST can be claimed back` : "Not GST registered · GST counts as cost") : undefined}>
            <select className={inputCls} value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              {data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Expected delivery" hint={sup ? `Usually ${sup.leadDays} days` : undefined}>
            <input type="date" className={inputCls} value={expected} onChange={(e) => setExpected(e.target.value)} />
          </Field>
          <Field label="Freight / transport (₹)">
            <input type="number" min={0} className={inputCls} value={freight || ""} onChange={(e) => setFreight(Number(e.target.value))} />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Items"
        action={<div className="flex gap-1">
          <button className={btnGhost} onClick={() => setLines((ls) => [...ls, blankLine("MATERIAL")])} disabled={!data.materials.length}><Plus className="h-3.5 w-3.5" /> Bulk item (kg)</button>
          <button className={btnGhost} onClick={() => setLines((ls) => [...ls, blankLine("PACK")])}><Plus className="h-3.5 w-3.5" /> Ready packs</button>
        </div>}
      >
        {!data.materials.length && (
          <p className="border-b border-border/60 bg-[#fbf6ee] px-4 py-2 text-xs text-[#5a4a32]">
            Buying in bulk (e.g. 25 kg bags)? <Link href="/admin/materials" className="font-semibold underline">Add bulk items</Link> first, then you can order them by the kg.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>
              <th className={thCls}>Item</th><th className={`${thCls} w-28`}>Qty</th><th className={`${thCls} w-32`}>Rate (₹)</th><th className={`${thCls} w-24`}>GST %</th><th className={`${thCls} w-32 text-right`}>Amount</th><th className={`${thCls} w-10`}></th>
            </tr></thead>
            <tbody className="divide-y divide-border/60">
              {lines.map((l) => {
                const unit = l.kind === "MATERIAL" ? data.materials.find((m) => m.id === l.itemKey)?.unit ?? "kg" : "packs";
                return (
                  <tr key={l.uid}>
                    <td className={`${tdCls} min-w-[380px]`}>
                      <div className="grid grid-cols-[6.5rem_1fr] gap-2">
                        <select className={inputCls} value={l.kind} onChange={(e) => update(l.uid, { kind: e.target.value as any, itemKey: "", materialId: null, productId: null, variantId: null })}>
                          <option value="MATERIAL" disabled={!data.materials.length}>Bulk</option>
                          <option value="PACK">Packs</option>
                        </select>
                        <select className={inputCls} value={l.itemKey} onChange={(e) => pick(l, e.target.value)}>
                          <option value="">Choose…</option>
                          {l.kind === "MATERIAL"
                            ? data.materials.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.stockQty} {m.unit} in stock</option>)
                            : data.units.map((u) => <option key={u.key} value={u.key}>{u.name} · {u.pack} · {u.stock} in stock</option>)}
                        </select>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} step={l.kind === "MATERIAL" ? 0.001 : 1} className={`${inputCls} min-w-[72px]`} value={l.qty || ""} onChange={(e) => update(l.uid, { qty: Number(e.target.value) })} />
                        <span className="text-xs text-muted-foreground">{unit}</span>
                      </div>
                    </td>
                    <td className={tdCls}><input type="number" min={0} step={0.01} className={inputCls} value={l.rate || ""} onChange={(e) => update(l.uid, { rate: Number(e.target.value) })} /></td>
                    <td className={tdCls}>
                      <select className={inputCls} value={l.gstRate} onChange={(e) => update(l.uid, { gstRate: Number(e.target.value) })}>
                        {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </td>
                    <td className={`${tdCls} text-right tabular-nums`}>{inr((Number(l.qty) || 0) * (Number(l.rate) || 0), 2)}</td>
                    <td className={tdCls}>
                      <button aria-label="Remove line" className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-700" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.uid !== l.uid) : ls))}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4 border-t border-border/60 p-4 sm:flex-row sm:justify-between">
          <Field label="Notes for supplier" className="sm:w-1/2">
            <textarea className={`${inputCls} h-20 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quality, grade, packing, delivery address…" />
          </Field>
          <dl className="w-full space-y-1 text-sm sm:w-72">
            <div className="flex justify-between"><dt className="text-muted-foreground">Items</dt><dd className="tabular-nums">{inr(totals.subtotal, 2)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">GST</dt><dd className="tabular-nums">{inr(totals.taxTotal, 2)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Freight</dt><dd className="tabular-nums">{inr(Number(freight) || 0, 2)}</dd></div>
            <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{inr(totals.total, 2)}</dd></div>
          </dl>
        </div>
      </Panel>

      <div className="flex justify-end gap-2">
        <button className={btnSecondary} disabled={pending} onClick={() => save("DRAFT")}>Save draft</button>
        <button className={btnPrimary} disabled={pending} onClick={() => save("ORDERED")}>{pending ? "Saving…" : "Save & mark ordered"}</button>
      </div>
    </div>
  );
}
