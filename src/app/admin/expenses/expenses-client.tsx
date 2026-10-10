"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Receipt, Trash2, CheckCircle2, Download } from "lucide-react";
import { deleteExpenseAction, payExpenseAction, saveExpenseAction, type ExpenseInput } from "@/app/actions/admin-finance";
import { EXPENSE_CATEGORIES, PAY_METHODS, expenseCost, expenseLabel, lastMonths, monthLabel } from "@/lib/finance-core";
import { PageHeader, Panel, Stat, SidePanel, Field, Empty, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr, dateFmt, isoDay } from "@/components/admin/ui";

const blank = (): ExpenseInput => ({ date: isoDay(), category: "PACKAGING", description: "", vendor: "", vendorGstin: "", billNo: "", amount: 0, gstAmount: 0, paidVia: "UPI", notes: "" });
const methodLabel = (k: string) => (k === "UNPAID" ? "Not paid yet" : PAY_METHODS.find((p) => p.key === k)?.label ?? k);

export function ExpensesClient({ ym, rows, unpaid }: { ym: string; rows: any[]; unpaid: any[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<ExpenseInput | null>(null);
  const [gstMode, setGstMode] = useState<"none" | "5" | "12" | "18" | "custom">("none");
  const [cat, setCat] = useState("ALL");

  const list = useMemo(() => (cat === "ALL" ? rows : rows.filter((r) => r.category === cat)), [rows, cat]);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const cost = rows.filter((r) => r.category !== "WALLET").reduce((s, r) => s + expenseCost(r), 0);
  const gstClaim = rows.reduce((s, r) => s + (r.vendorGstin ? r.gstAmount : 0), 0);
  const allUnpaid = [...unpaid, ...rows.filter((r) => r.paidVia === "UNPAID")];
  const byCat = EXPENSE_CATEGORIES.map((c) => ({ ...c, sum: rows.filter((r) => r.category === c.key).reduce((s, r) => s + r.total, 0) })).filter((c) => c.sum > 0).sort((a, b) => b.sum - a.sum);

  const set = (k: keyof ExpenseInput, v: any) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const applyGst = (mode: typeof gstMode, amount = form?.amount ?? 0) => {
    setGstMode(mode);
    if (mode === "none") set("gstAmount", 0);
    else if (mode !== "custom") set("gstAmount", Math.round(amount * Number(mode)) / 100);
  };

  const save = () =>
    start(async () => {
      const res = await saveExpenseAction(form!);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("Expense saved");
      setForm(null);
      router.refresh();
    });
  const pay = (id: string) => start(async () => { await payExpenseAction(id, "UPI"); toast.success("Marked as paid"); router.refresh(); });
  const remove = (id: string) => start(async () => { await deleteExpenseAction(id); toast.success("Deleted"); router.refresh(); });

  const exportExcel = async () => {
    const { downloadExcel } = await import("@/lib/excel");
    await downloadExcel(`expenses-${ym}`, "Expenses", ["Date", "Category", "Description", "Vendor", "Vendor GSTIN", "Bill no.", "Amount", "GST", "Total", "Paid via"],
      rows.map((r) => [new Date(r.date).toISOString().slice(0, 10), expenseLabel(r.category), r.description, r.vendor, r.vendorGstin, r.billNo, r.amount, r.gstAmount, r.total, methodLabel(r.paidVia)]), [6, 7, 8]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Every running cost, so profit is real. Courier charges for shipments booked here are counted automatically."
        actions={<>
          <select className={`${inputCls} w-40`} value={ym} onChange={(e) => router.push(`/admin/expenses?m=${e.target.value}`)} aria-label="Month">
            {lastMonths(12).reverse().map((m) => <option key={m} value={m}>{monthLabel(m, true)}</option>)}
          </select>
          <button className={btnSecondary} onClick={exportExcel} disabled={!rows.length}><Download className="h-4 w-4" /> Excel</button>
          <button className={btnPrimary} onClick={() => { setForm(blank()); setGstMode("none"); }}><Plus className="h-4 w-4" /> Add expense</button>
        </>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Spent in ${monthLabel(ym)}`} value={inr(total)} hint={`${rows.length} bills`} />
        <Stat label="Cost for profit" value={inr(cost)} hint="Excl. claimable GST and wallet top-ups" />
        <Stat label="GST to claim back" value={inr(gstClaim, 2)} hint="From vendors with a GSTIN" tone={gstClaim ? "good" : undefined} />
        <Stat label="Unpaid bills" value={inr(allUnpaid.reduce((s, r) => s + r.total, 0))} hint={`${allUnpaid.length} bills`} tone={allUnpaid.length ? "warn" : undefined} />
      </div>

      {allUnpaid.length > 0 && (
        <Panel title="Waiting to be paid">
          <ul className="divide-y divide-border/60 text-sm">
            {allUnpaid.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span>{r.description} <span className="text-muted-foreground">· {r.vendor ?? expenseLabel(r.category)} · {dateFmt(r.date)}</span></span>
                <span className="flex items-center gap-3"><b className="tabular-nums">{inr(r.total, 2)}</b><button className={btnGhost} disabled={pending} onClick={() => pay(r.id)}><CheckCircle2 className="h-3.5 w-3.5" /> Mark paid</button></span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <Panel title="By category">
          {byCat.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nothing yet.</p> : (
            <ul className="space-y-2.5 p-4 text-sm">
              <li><button onClick={() => setCat("ALL")} className={`w-full text-left ${cat === "ALL" ? "font-semibold text-[#6E1A2C]" : ""}`}>All · {inr(total)}</button></li>
              {byCat.map((c) => (
                <li key={c.key}>
                  <button onClick={() => setCat(c.key)} className={`w-full text-left ${cat === c.key ? "font-semibold text-[#6E1A2C]" : ""}`}>
                    <span className="flex justify-between"><span>{expenseLabel(c.key)}</span><span className="tabular-nums">{inr(c.sum)}</span></span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-[#c9a45a]" style={{ width: `${(c.sum / total) * 100}%` }} /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={cat === "ALL" ? "All bills" : expenseLabel(cat)} className="lg:col-span-3">
          {list.length === 0 ? (
            <Empty icon={<Receipt className="h-8 w-8" />} title={`No expenses in ${monthLabel(ym, true)}`}>Add jars and labels, salaries, rent, ads and other costs. Keep the bill number; with the vendor's GSTIN the GST is claimed back in your GST return.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr>
                  <th className={thCls}>Date</th><th className={thCls}>What</th><th className={thCls}>Vendor</th><th className={`${thCls} text-right`}>Amount</th>
                  <th className={`${thCls} text-right`}>GST</th><th className={`${thCls} text-right`}>Total</th><th className={thCls}>Paid</th><th className={thCls}></th>
                </tr></thead>
                <tbody className="divide-y divide-border/60">
                  {list.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className={`${tdCls} whitespace-nowrap`}>{dateFmt(r.date)}</td>
                      <td className={tdCls}><p className="font-medium">{r.description}</p><p className="text-xs text-muted-foreground">{expenseLabel(r.category)}{r.billNo ? ` · Bill ${r.billNo}` : ""}</p></td>
                      <td className={tdCls}>{r.vendor ?? "—"}{r.vendorGstin && <p className="font-mono text-[11px] text-muted-foreground">{r.vendorGstin}</p>}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{inr(r.amount, 2)}</td>
                      <td className={`${tdCls} text-right tabular-nums ${r.vendorGstin && r.gstAmount ? "text-emerald-700" : "text-muted-foreground"}`}>{r.gstAmount ? inr(r.gstAmount, 2) : "—"}</td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(r.total, 2)}</td>
                      <td className={`${tdCls} ${r.paidVia === "UNPAID" ? "font-semibold text-amber-700" : ""}`}>{methodLabel(r.paidVia)}</td>
                      <td className={`${tdCls} whitespace-nowrap text-right`}>
                        <button className={btnGhost} onClick={() => { setForm({ id: r.id, date: isoDay(new Date(r.date)), category: r.category, description: r.description, vendor: r.vendor, vendorGstin: r.vendorGstin, billNo: r.billNo, amount: r.amount, gstAmount: r.gstAmount, paidVia: r.paidVia, notes: r.notes }); setGstMode(r.gstAmount ? "custom" : "none"); }}>Edit</button>
                        <button aria-label="Delete expense" className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-700" disabled={pending} onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <SidePanel open={!!form} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? "Edit expense" : "Add expense"}
        footer={<><button className={btnSecondary} onClick={() => setForm(null)}>Cancel</button><button className={btnPrimary} disabled={pending || !form?.description || !(form.amount > 0)} onClick={save}>{pending ? "Saving…" : "Save"}</button></>}>
        {form && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bill date"><input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
              <Field label="Category">
                <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </Field>
            </div>
            {form.category === "WALLET" && <p className="rounded-lg bg-[#fbf6ee] px-3 py-2 text-xs text-[#5a4a32]">Wallet top-ups count as cash spent, not as cost. The cost of each shipment is already counted from the courier booking.</p>}
            <Field label="What for"><input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. 500 PET jars 250 g" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vendor"><input className={inputCls} value={form.vendor ?? ""} onChange={(e) => set("vendor", e.target.value)} /></Field>
              <Field label="Bill no."><input className={inputCls} value={form.billNo ?? ""} onChange={(e) => set("billNo", e.target.value)} /></Field>
            </div>
            <Field label="Vendor GSTIN" hint="Needed to claim the GST back"><input className={`${inputCls} font-mono uppercase`} maxLength={15} value={form.vendorGstin ?? ""} onChange={(e) => set("vendorGstin", e.target.value.toUpperCase())} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount before GST (₹)"><input type="number" min={0} step={0.01} className={inputCls} value={form.amount || ""} onChange={(e) => { const v = Number(e.target.value); set("amount", v); if (gstMode !== "none" && gstMode !== "custom") set("gstAmount", Math.round(v * Number(gstMode)) / 100); }} /></Field>
              <Field label="GST on bill">
                <div className="flex gap-1">
                  <select className={`${inputCls} w-24`} value={gstMode} onChange={(e) => applyGst(e.target.value as any)}>
                    <option value="none">None</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="custom">₹</option>
                  </select>
                  <input type="number" min={0} step={0.01} className={inputCls} disabled={gstMode !== "custom"} value={form.gstAmount || ""} onChange={(e) => set("gstAmount", Number(e.target.value))} />
                </div>
              </Field>
            </div>
            <p className="text-right text-sm">Bill total <b className="tabular-nums">{inr((form.amount || 0) + (form.gstAmount || 0), 2)}</b></p>
            <Field label="Paid via">
              <select className={inputCls} value={form.paidVia} onChange={(e) => set("paidVia", e.target.value)}>
                {PAY_METHODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                <option value="UNPAID">Not paid yet</option>
              </select>
            </Field>
            <Field label="Notes"><input className={inputCls} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
