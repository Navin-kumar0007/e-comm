"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Printer, Save, CheckCheck, Search } from "lucide-react";
import { cancelStockCountAction, postStockCountAction, saveCountLinesAction } from "@/app/actions/admin-warehouse";
import { PageHeader, Panel, Stat, StatusPill, btnPrimary, btnSecondary, thCls, tdCls, inr, qtyFmt, dateFmt } from "@/components/admin/ui";

export function CountSheet({ count }: { count: any }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(count.lines.map((l: any) => [l.id, l.counted === null ? "" : String(l.counted)]))
  );
  const open = count.status === "OPEN";
  const dirty = count.lines.some((l: any) => (l.counted === null ? "" : String(l.counted)) !== values[l.id]);

  const rows = useMemo(() => count.lines.map((l: any) => {
    const v = values[l.id];
    const counted = v === "" ? null : Number(v);
    const diff = counted === null ? null : counted - l.expected;
    return { ...l, countedNow: counted, diff };
  }), [count.lines, values]);
  const shown = rows.filter((r: any) => (!q || r.name.toLowerCase().includes(q.toLowerCase())) && (!onlyDiff || (r.diff !== null && Math.abs(r.diff) > 1e-6)));
  const done = rows.filter((r: any) => r.countedNow !== null).length;
  const diffs = rows.filter((r: any) => r.diff !== null && Math.abs(r.diff) > 1e-6);
  const value = diffs.reduce((s: number, r: any) => s + r.diff * r.unitCost, 0);

  const payload = () => count.lines.map((l: any) => ({ id: l.id, counted: values[l.id] === "" ? null : Number(values[l.id]) }));
  const save = () => start(async () => {
    const res = await saveCountLinesAction(count.id, payload());
    if ("error" in res && res.error) { toast.error(res.error); return; }
    toast.success("Saved");
    router.refresh();
  });
  const post = () => start(async () => {
    if (dirty) {
      const s = await saveCountLinesAction(count.id, payload());
      if ("error" in s && s.error) { toast.error(s.error); return; }
    }
    const res = await postStockCountAction(count.id);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    toast.success(`Stock updated for ${"changed" in res ? res.changed : 0} items`);
    router.refresh();
  });
  const cancel = () => start(async () => { await cancelStockCountAction(count.id); router.push("/admin/stock-counts"); });

  return (
    <div className="space-y-6">
      <Link href="/admin/stock-counts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"><ArrowLeft className="h-4 w-4" /> Stock counts</Link>
      <PageHeader
        title={`Stock count ${count.number}`}
        subtitle={<span className="flex items-center gap-2"><StatusPill status={count.status} label={count.status === "POSTED" ? "Stock updated" : count.status === "OPEN" ? "Counting" : undefined} /> Started {dateFmt(count.createdAt)}{count.postedAt ? ` · updated ${dateFmt(count.postedAt)}` : ""}{count.notes ? ` · ${count.notes}` : ""}</span>}
        actions={<div className="flex gap-2 print:hidden">
          <button className={btnSecondary} onClick={() => window.print()}><Printer className="h-4 w-4" /> Print sheet</button>
          {open && <>
            <button className={`${btnSecondary} text-red-700`} disabled={pending} onClick={cancel}>Discard</button>
            <button className={btnSecondary} disabled={pending || !dirty} onClick={save}><Save className="h-4 w-4" /> Save</button>
            <button className={btnPrimary} disabled={pending || done === 0} onClick={post}><CheckCheck className="h-4 w-4" /> Update stock</button>
          </>}
        </div>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:hidden">
        <Stat label="Counted" value={`${done} / ${rows.length}`} />
        <Stat label="Items with a difference" value={diffs.length} tone={diffs.length ? "warn" : undefined} />
        <Stat label="Short" value={diffs.filter((r: any) => r.diff < 0).length} tone={diffs.some((r: any) => r.diff < 0) ? "bad" : undefined} />
        <Stat label="Difference at cost" value={`${value > 0 ? "+" : ""}${inr(value)}`} tone={value < 0 ? "bad" : value > 0 ? "good" : undefined} />
      </div>
      {open && <p className="rounded-lg border border-[#c9a45a]/40 bg-[#fbf6ee] px-4 py-2.5 text-sm text-[#5a4a32] print:hidden">Leave a box empty to skip that item. "Update stock" sets each counted item to the number you typed.</p>}

      <Panel
        title={<span className="hidden print:inline">{count.number}</span>}
        action={<div className="flex items-center gap-3 print:hidden">
          <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" className="accent-[#6E1A2C]" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} /> Only differences</label>
          <div className="flex h-9 w-56 items-center gap-2 rounded-lg border border-border px-3"><Search className="h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find item" className="w-full bg-transparent text-sm outline-none" /></div>
        </div>}
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/30"><tr>
            <th className={thCls}>Item</th><th className={`${thCls} text-right`}>System</th><th className={`${thCls} w-36`}>Counted</th>
            <th className={`${thCls} text-right print:hidden`}>Difference</th><th className={`${thCls} text-right print:hidden`}>Value</th>
          </tr></thead>
          <tbody className="divide-y divide-border/60">
            {shown.map((r: any) => (
              <tr key={r.id} className="break-inside-avoid">
                <td className={tdCls}>{r.name}</td>
                <td className={`${tdCls} text-right tabular-nums`}>{qtyFmt(r.expected, r.unit)}</td>
                <td className={tdCls}>
                  {open ? (
                    <input type="number" min={0} step={r.unit === "kg" ? 0.001 : 1} inputMode="decimal" aria-label={`Counted ${r.name}`}
                      className="h-9 w-28 rounded-lg border border-border px-2 text-sm tabular-nums print:border-black" value={values[r.id]}
                      onChange={(e) => setValues((v) => ({ ...v, [r.id]: e.target.value }))} />
                  ) : <span className="tabular-nums">{r.countedNow === null ? "—" : qtyFmt(r.countedNow, r.unit)}</span>}
                </td>
                <td className={`${tdCls} text-right font-semibold tabular-nums print:hidden ${r.diff === null ? "" : r.diff < 0 ? "text-red-700" : r.diff > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                  {r.diff === null ? "" : `${r.diff > 0 ? "+" : ""}${qtyFmt(r.diff, r.unit)}`}
                </td>
                <td className={`${tdCls} text-right tabular-nums print:hidden`}>{r.diff ? inr(r.diff * r.unitCost) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
