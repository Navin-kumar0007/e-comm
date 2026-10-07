"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardCheck, Plus } from "lucide-react";
import { createStockCountAction } from "@/app/actions/admin-warehouse";
import { PageHeader, Panel, Empty, StatusPill, SidePanel, Field, inputCls, btnPrimary, btnSecondary, thCls, tdCls, inr, dateFmt } from "@/components/admin/ui";

export function CountsClient({ counts }: { counts: any[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<{ scope: "ALL" | "PACKS" | "MATERIALS"; notes: string } | null>(null);
  const create = () =>
    start(async () => {
      const res = await createStockCountAction(form!);
      if ("error" in res) { toast.error(res.error); return; }
      router.push(`/admin/stock-counts/${res.id}`);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock counts"
        subtitle="Count what is really on the shelf. Differences are fixed in one go and kept as a record."
        actions={<button className={btnPrimary} onClick={() => setForm({ scope: "ALL", notes: "" })}><Plus className="h-4 w-4" /> Start a count</button>}
      />
      <Panel title="Counts">
        {counts.length === 0 ? (
          <Empty icon={<ClipboardCheck className="h-8 w-8" />} title="No counts yet">Do a full count once a month, and a quick one for fast-selling items every week. Print the sheet, count, then type the numbers in.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>
              <th className={thCls}>Count</th><th className={thCls}>Started</th><th className={thCls}>By</th><th className={thCls}>Progress</th>
              <th className={`${thCls} text-right`}>Difference</th><th className={thCls}>Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border/60">
              {counts.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className={tdCls}><Link href={`/admin/stock-counts/${c.id}`} className="font-semibold text-[#6E1A2C] hover:underline">{c.number}</Link>{c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}</td>
                  <td className={tdCls}>{dateFmt(c.createdAt)}</td>
                  <td className={tdCls}>{c.createdBy.split(":").pop()}</td>
                  <td className={tdCls}>{c.counted} of {c.lines} counted</td>
                  <td className={`${tdCls} text-right font-semibold tabular-nums ${c.varianceValue < 0 ? "text-red-700" : c.varianceValue > 0 ? "text-emerald-700" : ""}`}>{c.varianceValue > 0 ? "+" : ""}{inr(c.varianceValue)}</td>
                  <td className={tdCls}><StatusPill status={c.status} label={c.status === "POSTED" ? "Stock updated" : c.status === "OPEN" ? "Counting" : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <SidePanel open={!!form} onOpenChange={(o) => !o && setForm(null)} title="Start a stock count" description="The system's numbers are noted now; you then enter what you actually count."
        footer={<><button className={btnSecondary} onClick={() => setForm(null)}>Cancel</button><button className={btnPrimary} disabled={pending} onClick={create}>Start</button></>}>
        {form && (
          <div className="space-y-3">
            <Field label="What to count">
              <select className={inputCls} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as any })}>
                <option value="ALL">Everything (packs and bulk)</option>
                <option value="PACKS">Packs only</option>
                <option value="MATERIALS">Bulk only</option>
              </select>
            </Field>
            <Field label="Note"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Month-end count, October" /></Field>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
