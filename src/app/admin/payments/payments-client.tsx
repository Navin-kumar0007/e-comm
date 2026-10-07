"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, CreditCard, Banknote, Truck, CheckCircle2 } from "lucide-react";
import { recordCodRemittanceAction, recordSupplierPaymentAction, syncRazorpayAction, type SupplierPaymentInput } from "@/app/actions/admin-finance";
import { PAY_METHODS } from "@/lib/finance-core";
import { PageHeader, Panel, SidePanel, Field, Empty, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr, dateFmt, isoDay } from "@/components/admin/ui";

type Tab = "razorpay" | "cod" | "suppliers";
const daysSince = (d: string | null) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 864e5) : 0);

export function PaymentsClient({ initialTab, rzp, cod, payables }: { initialTab: Tab; rzp: any; cod: any; payables: any }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Tab>(initialTab);

  // COD
  const [courier, setCourier] = useState<string>(cod.orders[0]?.courier ?? "");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [remit, setRemit] = useState<{ date: string; amount: string; reference: string; note: string } | null>(null);
  const couriers = useMemo(() => [...new Set<string>(cod.orders.map((o: any) => o.courier))], [cod.orders]);
  const codList = cod.orders.filter((o: any) => !courier || o.courier === courier);
  const pickedTotal = cod.orders.filter((o: any) => picked.has(o.id)).reduce((s: number, o: any) => s + o.total, 0);

  // Suppliers
  const [pay, setPay] = useState<SupplierPaymentInput | null>(null);

  const sync = () =>
    start(async () => {
      const res = await syncRazorpayAction();
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success(`Razorpay: ${res.fees} fees updated, ${res.settled} payments marked as settled`);
      router.refresh();
    });

  const saveRemit = () =>
    start(async () => {
      const res = await recordCodRemittanceAction({ courier, date: remit!.date, amount: Number(remit!.amount), reference: remit!.reference, note: remit!.note, orderIds: [...picked] });
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("short" in res && res.short && res.short > 0 ? `Saved. Courier paid ${inr(res.short, 2)} less than the COD value (their charges).` : "COD payment saved");
      setRemit(null);
      setPicked(new Set());
      router.refresh();
    });

  const savePay = () =>
    start(async () => {
      const res = await recordSupplierPaymentAction(pay!);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("Payment saved");
      setPay(null);
      router.refresh();
    });

  const unsettledTotal = rzp.unsettled.reduce((s: number, o: any) => s + o.total - (o.paymentFee ?? 0) - (o.refundedAmount ?? 0), 0);
  const codTotal = cod.orders.reduce((s: number, o: any) => s + o.total, 0);
  const supplierTotal = payables.rows.reduce((s: number, r: any) => s + r.due, 0);

  const TABS: Array<{ key: Tab; label: string; icon: any; value: string }> = [
    { key: "razorpay", label: "Razorpay", icon: CreditCard, value: inr(unsettledTotal) },
    { key: "cod", label: "Cash on delivery", icon: Banknote, value: inr(codTotal) },
    { key: "suppliers", label: "Supplier bills", icon: Truck, value: inr(supplierTotal) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Check that every rupee arrived: Razorpay payouts, COD money from couriers, and what you owe suppliers." />
      <div className="grid gap-3 sm:grid-cols-3">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${tab === t.key ? "border-[#6E1A2C] ring-2 ring-[#6E1A2C]/10" : "border-border/70 hover:border-[#c9a45a]"}`}>
            <t.icon className="h-5 w-5 text-[#c9a45a]" />
            <span>
              <span className="block text-[12px] font-medium uppercase tracking-wide text-muted-foreground">{t.label}</span>
              <span className="block text-xl font-bold tabular-nums text-[#2a0a12]">{t.value}</span>
              <span className="block text-[11px] text-muted-foreground">{t.key === "suppliers" ? "you owe" : "still to reach your bank"}</span>
            </span>
          </button>
        ))}
      </div>

      {tab === "razorpay" && (
        <div className="space-y-6">
          <Panel title="Not yet paid out by Razorpay" action={<button className={btnPrimary} onClick={sync} disabled={pending || !rzp.configured}><RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} /> Sync with Razorpay</button>}>
            {!rzp.configured && <p className="border-b border-border/60 bg-amber-50 px-4 py-2 text-xs text-amber-900">Razorpay keys are not set on this server, so syncing is off.</p>}
            <p className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">Razorpay usually pays out 2–3 working days after a payment. Sync pulls the real fee for each payment and marks the ones already in your bank. Anything older than 5 days here is worth checking in the Razorpay dashboard.</p>
            {rzp.unsettled.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nothing pending.</p> : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr><th className={thCls}>Order</th><th className={thCls}>Paid</th><th className={`${thCls} text-right`}>Amount</th><th className={`${thCls} text-right`}>Fee</th><th className={`${thCls} text-right`}>You get</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {rzp.unsettled.map((o: any) => {
                    const old = daysSince(o.paidAt) > 5;
                    return (
                      <tr key={o.id}>
                        <td className={tdCls}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-[#6E1A2C] hover:underline">{o.ref}</Link><p className="text-xs text-muted-foreground">{o.customerName}</p></td>
                        <td className={`${tdCls} ${old ? "font-semibold text-amber-700" : ""}`}>{dateFmt(o.paidAt)}{old ? ` · ${daysSince(o.paidAt)} days` : ""}</td>
                        <td className={`${tdCls} text-right tabular-nums`}>{inr(o.total, 2)}</td>
                        <td className={`${tdCls} text-right tabular-nums text-muted-foreground`}>{o.paymentFee !== null ? `−${inr(o.paymentFee, 2)}` : "not synced"}</td>
                        <td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(o.total - (o.paymentFee ?? 0) - (o.refundedAmount ?? 0), 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
          <Panel title="Payouts received">
            {rzp.settlements.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No payouts matched yet. Press Sync.</p> : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr><th className={thCls}>Date</th><th className={thCls}>Settlement / UTR</th><th className={`${thCls} text-right`}>Payments</th><th className={`${thCls} text-right`}>Gross</th><th className={`${thCls} text-right`}>Fees</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {rzp.settlements.map((s: any) => (
                    <tr key={s.id}><td className={tdCls}>{dateFmt(s.date)}</td><td className={`${tdCls} font-mono text-xs`}>{s.id}{s.utr ? <><br />UTR {s.utr}</> : null}</td><td className={`${tdCls} text-right tabular-nums`}>{s.orders}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(s.gross, 2)}</td><td className={`${tdCls} text-right tabular-nums`}>−{inr(s.fees, 2)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      )}

      {tab === "cod" && (
        <div className="space-y-6">
          <Panel
            title="Delivered, cash not received yet"
            action={<div className="flex items-center gap-2">
              {couriers.length > 1 && <select className={`${inputCls} w-44`} value={courier} onChange={(e) => { setCourier(e.target.value); setPicked(new Set()); }}>{couriers.map((c) => <option key={c} value={c}>{c}</option>)}</select>}
              <button className={btnPrimary} disabled={!picked.size} onClick={() => setRemit({ date: isoDay(), amount: String(Math.round(pickedTotal * 100) / 100), reference: "", note: "" })}>
                <CheckCircle2 className="h-4 w-4" /> Courier paid {picked.size ? `${picked.size} · ${inr(pickedTotal)}` : ""}
              </button>
            </div>}
          >
            <p className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">When the courier sends COD money (Shiprocket pays twice a week), tick the orders in their remittance statement and record the amount that reached your bank.</p>
            {codList.length === 0 ? <Empty icon={<Banknote className="h-8 w-8" />} title="All COD money received">Every delivered cash order has been paid out by the courier.</Empty> : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr>
                  <th className={`${thCls} w-10`}><input type="checkbox" aria-label="Select all" className="h-4 w-4 accent-[#6E1A2C]" checked={codList.length > 0 && codList.every((o: any) => picked.has(o.id))} onChange={(e) => setPicked(e.target.checked ? new Set(codList.map((o: any) => o.id)) : new Set())} /></th>
                  <th className={thCls}>Order</th><th className={thCls}>AWB</th><th className={thCls}>Delivered</th><th className={`${thCls} text-right`}>COD</th>
                </tr></thead>
                <tbody className="divide-y divide-border/60">
                  {codList.map((o: any) => {
                    const age = daysSince(o.deliveredAt);
                    return (
                      <tr key={o.id} className={picked.has(o.id) ? "bg-[#fbf6ee]" : ""}>
                        <td className={tdCls}><input type="checkbox" aria-label={`Select ${o.ref}`} className="h-4 w-4 accent-[#6E1A2C]" checked={picked.has(o.id)} onChange={() => setPicked((s) => { const n = new Set(s); if (n.has(o.id)) n.delete(o.id); else n.add(o.id); return n; })} /></td>
                        <td className={tdCls}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-[#6E1A2C] hover:underline">{o.ref}</Link><p className="text-xs text-muted-foreground">{o.customerName}</p></td>
                        <td className={`${tdCls} font-mono text-xs`}>{o.awb ?? "—"}</td>
                        <td className={`${tdCls} ${age > 10 ? "font-semibold text-red-700" : ""}`}>{dateFmt(o.deliveredAt)}{age > 10 ? ` · ${age} days` : ""}</td>
                        <td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(o.total, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
          <Panel title="COD payments received">
            {cod.remittances.length === 0 ? <p className="p-4 text-sm text-muted-foreground">None recorded yet.</p> : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr><th className={thCls}>Date</th><th className={thCls}>Courier</th><th className={thCls}>UTR</th><th className={`${thCls} text-right`}>Orders</th><th className={`${thCls} text-right`}>COD value</th><th className={`${thCls} text-right`}>Received</th><th className={`${thCls} text-right`}>Deducted</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {cod.remittances.map((r: any) => (
                    <tr key={r.id}><td className={tdCls}>{dateFmt(r.date)}</td><td className={tdCls}>{r.courier}</td><td className={`${tdCls} font-mono text-xs`}>{r.reference ?? "—"}</td><td className={`${tdCls} text-right tabular-nums`}>{r._count.orders}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(r.expected, 2)}</td><td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(r.amount, 2)}</td><td className={`${tdCls} text-right tabular-nums ${r.expected - r.amount > 0.5 ? "text-red-700" : "text-muted-foreground"}`}>{inr(r.expected - r.amount, 2)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      )}

      {tab === "suppliers" && (
        <div className="space-y-6">
          <Panel title="What you owe" action={<button className={btnSecondary} onClick={() => setPay({ supplierId: payables.suppliers[0]?.id ?? "", date: isoDay(), amount: 0, method: "BANK", reference: "", note: "" })} disabled={!payables.suppliers.length}>Record a payment</button>}>
            {payables.rows.length === 0 ? <Empty icon={<Truck className="h-8 w-8" />} title="Nothing owed">Bills appear here when you receive goods on a purchase order.</Empty> : (
              <ul className="divide-y divide-border/60">
                {payables.rows.map((s: any) => (
                  <li key={s.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{s.name}{s.phone && <span className="ml-2 text-xs font-normal text-muted-foreground">{s.phone}</span>}</p>
                      <div className="flex items-center gap-3"><b className="tabular-nums text-red-700">{inr(s.due, 2)}</b><button className={btnGhost} onClick={() => setPay({ supplierId: s.id, date: isoDay(), amount: s.due, method: "BANK", reference: "", note: "" })}>Pay</button></div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {s.pos.map((p: any) => <Link key={p.id} href={`/admin/purchases/${p.id}`} className="hover:text-[#6E1A2C] hover:underline">{p.number}{p.billNo ? ` (bill ${p.billNo})` : ""}: {inr(p.due, 2)} · {daysSince(p.date)} days</Link>)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Recent payments to suppliers">
            {payables.payments.length === 0 ? <p className="p-4 text-sm text-muted-foreground">None yet.</p> : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr><th className={thCls}>Date</th><th className={thCls}>Supplier</th><th className={thCls}>Against</th><th className={thCls}>Method</th><th className={`${thCls} text-right`}>Amount</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {payables.payments.map((p: any) => (
                    <tr key={p.id}><td className={tdCls}>{dateFmt(p.date)}</td><td className={tdCls}>{p.supplier.name}</td><td className={tdCls}>{p.po?.number ?? "Advance"}</td><td className={tdCls}>{PAY_METHODS.find((m) => m.key === p.method)?.label ?? p.method}{p.reference ? <span className="ml-1 font-mono text-xs text-muted-foreground">{p.reference}</span> : null}</td><td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(p.amount, 2)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      )}

      <SidePanel open={!!remit} onOpenChange={(o) => !o && setRemit(null)} title="COD money received" description={`${picked.size} orders from ${courier} · COD value ${inr(pickedTotal, 2)}`}
        footer={<><button className={btnSecondary} onClick={() => setRemit(null)}>Cancel</button><button className={btnPrimary} disabled={pending} onClick={saveRemit}>Save</button></>}>
        {remit && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date received"><input type="date" className={inputCls} value={remit.date} onChange={(e) => setRemit({ ...remit, date: e.target.value })} /></Field>
              <Field label="Amount in bank (₹)" hint="If the courier kept charges, enter what actually arrived"><input type="number" min={0} step={0.01} className={inputCls} value={remit.amount} onChange={(e) => setRemit({ ...remit, amount: e.target.value })} /></Field>
            </div>
            <Field label="UTR / reference"><input className={`${inputCls} font-mono`} value={remit.reference} onChange={(e) => setRemit({ ...remit, reference: e.target.value })} /></Field>
            <Field label="Note"><input className={inputCls} value={remit.note} onChange={(e) => setRemit({ ...remit, note: e.target.value })} /></Field>
          </div>
        )}
      </SidePanel>

      <SidePanel open={!!pay} onOpenChange={(o) => !o && setPay(null)} title="Payment to supplier" description="Applied to the oldest unpaid bills first. Anything extra is kept as an advance."
        footer={<><button className={btnSecondary} onClick={() => setPay(null)}>Cancel</button><button className={btnPrimary} disabled={pending || !(pay && Number(pay.amount) > 0)} onClick={savePay}>Save payment</button></>}>
        {pay && (
          <div className="space-y-3">
            <Field label="Supplier">
              <select className={inputCls} value={pay.supplierId} onChange={(e) => setPay({ ...pay, supplierId: e.target.value })}>
                {payables.suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date"><input type="date" className={inputCls} value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
              <Field label="Amount (₹)"><input type="number" min={0} step={0.01} className={inputCls} value={pay.amount || ""} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Paid via"><select className={inputCls} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{PAY_METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></Field>
              <Field label="UTR / cheque no."><input className={`${inputCls} font-mono`} value={pay.reference ?? ""} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
            </div>
            <Field label="Note"><input className={inputCls} value={pay.note ?? ""} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></Field>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
