"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Receipt, Wallet } from "lucide-react";
import { lastMonths, monthLabel } from "@/lib/finance-core";
import type { PnL, CashMonth } from "@/lib/finance";
import { PageHeader, Panel, Stat, inputCls, thCls, tdCls, inr } from "@/components/admin/ui";

interface Overview {
  months: string[];
  pnl: PnL[];
  cash: CashMonth[];
  positions: {
    razorpayUnsettled: number; razorpayUnsettledOrders: number; razorpaySynced: boolean;
    codDue: number; codDueOrders: number; codOldest: string | Date | null;
    supplierDue: number; unpaidExpenses: number; unpaidExpenseCount: number;
  };
}

const compact = (n: number) => (Math.abs(n) >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : Math.abs(n) >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${Math.round(n)}`);
const pct = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : "—");

function delta(cur: number, prev: number) {
  if (!prev) return null;
  const d = ((cur - prev) / Math.abs(prev)) * 100;
  return <span className={`ml-1 text-[11px] font-semibold ${d >= 0 ? "text-emerald-700" : "text-red-700"}`}>{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(0)}%</span>;
}

/** Revenue bars with profit bars inside them, one pair per month. */
function TrendChart({ pnl }: { pnl: PnL[] }) {
  const W = 640, H = 220, padL = 56, padB = 28, padT = 12;
  const max = Math.max(1, ...pnl.map((p) => p.netRevenue), ...pnl.map((p) => p.netProfit));
  const min = Math.min(0, ...pnl.map((p) => p.netProfit));
  const y = (v: number) => padT + ((max - v) / (max - min)) * (H - padT - padB);
  const slot = (W - padL) / pnl.length;
  const bw = Math.min(46, slot * 0.55);
  const ticks = [...new Set([min < -1 ? min : 0, max / 2, max].map((v) => Math.round(v)))];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Revenue and profit by month">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-border" strokeDasharray={t === 0 ? undefined : "3 3"} />
          <text x={padL - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">{compact(t)}</text>
        </g>
      ))}
      {pnl.map((p, i) => {
        const cx = padL + slot * i + slot / 2;
        const profitTop = y(Math.max(0, p.netProfit));
        const profitH = Math.abs(y(p.netProfit) - y(0));
        return (
          <g key={p.ym}>
            <rect x={cx - bw / 2} y={y(p.netRevenue)} width={bw} height={Math.max(0, y(0) - y(p.netRevenue))} rx={3} fill="#e9d8b4">
              <title>{`${monthLabel(p.ym)} revenue ${inr(p.netRevenue)}`}</title>
            </rect>
            <rect x={cx - bw / 4} y={profitTop} width={bw / 2} height={Math.max(1, profitH)} rx={2} fill={p.netProfit >= 0 ? "#6E1A2C" : "#b91c1c"}>
              <title>{`${monthLabel(p.ym)} net profit ${inr(p.netProfit)}`}</title>
            </rect>
            <text x={cx} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">{monthLabel(p.ym).split(" ")[0]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function FinanceClient({ overview, detail, canManage }: { overview: Overview; detail: { cur: PnL; prev: PnL }; canManage: boolean }) {
  const router = useRouter();
  const { cur, prev } = detail;
  const pos = overview.positions;
  const cashNow = overview.cash[overview.cash.length - 1];
  const months = lastMonths(12).reverse();

  const row = (label: string, a: number, b: number, opts: { strong?: boolean; minus?: boolean; note?: React.ReactNode; indent?: boolean } = {}) => (
    <tr className={opts.strong ? "border-t border-border bg-muted/20 font-semibold" : ""}>
      <td className={`${tdCls} ${opts.indent ? "pl-7 text-muted-foreground" : ""}`}>{label}{opts.note && <span className="ml-2 text-[11px] font-normal text-amber-700">{opts.note}</span>}</td>
      <td className={`${tdCls} text-right tabular-nums`}>{opts.minus && a ? "−" : ""}{inr(Math.abs(a))}{opts.strong && delta(a, b)}</td>
      <td className={`${tdCls} hidden text-right tabular-nums text-muted-foreground sm:table-cell`}>{pct(a, cur.netRevenue)}</td>
      <td className={`${tdCls} text-right tabular-nums text-muted-foreground`}>{opts.minus && b ? "−" : ""}{inr(Math.abs(b))}</td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profit & cash"
        subtitle="Are you making money, and where is it? Revenue is shown without GST; GST is the government's money."
        actions={<select className={`${inputCls} w-44`} value={cur.ym} onChange={(e) => router.push(`/admin/finance?m=${e.target.value}`)} aria-label="Month">
          {months.map((m) => <option key={m} value={m}>{monthLabel(m, true)}</option>)}
        </select>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Net revenue" value={inr(cur.netRevenue)} hint={<>{cur.orders} orders · excl. GST{delta(cur.netRevenue, prev.netRevenue)}</>} />
        <Stat label="Gross profit" value={inr(cur.grossProfit)} hint={`${pct(cur.grossProfit, cur.netRevenue)} margin after cost of goods`} tone={cur.grossProfit < 0 ? "bad" : undefined} />
        <Stat label="Net profit" value={inr(cur.netProfit)} hint={`${pct(cur.netProfit, cur.netRevenue)} after all costs`} tone={cur.netProfit < 0 ? "bad" : "good"} />
        <Stat label="GST collected" value={inr(cur.gstCollected)} hint={<Link href={`/admin/gst?m=${cur.ym}`} className="text-[#6E1A2C] hover:underline">See GST return →</Link>} />
      </div>

      {(cur.cogsMissingUnits > 0 || cur.gatewayEstimated > 0) && (
        <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          {cur.cogsMissingUnits > 0 && <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {cur.cogsMissingUnits} unit{cur.cogsMissingUnits === 1 ? "" : "s"} sold had no purchase cost, so profit is overstated. Add costs on <Link href="/admin/batches" className="font-semibold underline">Batches</Link> or receive stock through purchase orders.</p>}
          {cur.gatewayEstimated > 0 && <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> Razorpay fee estimated at 2% for {cur.gatewayEstimated} order{cur.gatewayEstimated === 1 ? "" : "s"}. {canManage ? <Link href="/admin/payments" className="font-semibold underline">Sync with Razorpay</Link> : "Sync with Razorpay"} for the real fee.</p>}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title={`Profit & loss · ${monthLabel(cur.ym, true)}`} className="xl:col-span-3">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>
              <th className={thCls}></th><th className={`${thCls} text-right`}>{monthLabel(cur.ym)}</th>
              <th className={`${thCls} hidden text-right sm:table-cell`}>% of revenue</th><th className={`${thCls} text-right`}>{monthLabel(prev.ym)}</th>
            </tr></thead>
            <tbody>
              {row("Sales (what customers paid)", cur.sales, prev.sales)}
              {row("GST collected", cur.gstCollected, prev.gstCollected, { minus: true, indent: true })}
              {row("Refunds", cur.refunds, prev.refunds, { minus: true, indent: true })}
              {row("Net revenue", cur.netRevenue, prev.netRevenue, { strong: true })}
              {row("Cost of goods sold", cur.cogs, prev.cogs, { minus: true, indent: true, note: cur.cogsEstimatedUnits ? `${cur.cogsEstimatedUnits} units at average cost` : undefined })}
              {row("Gross profit", cur.grossProfit, prev.grossProfit, { strong: true })}
              {row("Courier charges", cur.shipping, prev.shipping, { minus: true, indent: true })}
              {row("Payment gateway fees", cur.gatewayFees, prev.gatewayFees, { minus: true, indent: true, note: cur.gatewayEstimated ? "part estimated" : undefined })}
              {row("Stock written off / count losses", cur.stockLosses, prev.stockLosses, { minus: true, indent: true })}
              {cur.expenses.map((e) => {
                const p = prev.expenses.find((x) => x.category === e.category)?.amount ?? 0;
                return <tr key={e.category}><td className={`${tdCls} pl-7 text-muted-foreground`}>{e.label}</td><td className={`${tdCls} text-right tabular-nums`}>−{inr(e.amount)}</td><td className={`${tdCls} hidden text-right tabular-nums text-muted-foreground sm:table-cell`}>{pct(e.amount, cur.netRevenue)}</td><td className={`${tdCls} text-right tabular-nums text-muted-foreground`}>{p ? `−${inr(p)}` : "—"}</td></tr>;
              })}
              {cur.expenses.length === 0 && <tr><td className={`${tdCls} pl-7 text-muted-foreground`} colSpan={4}>No expenses recorded {canManage && <Link href="/admin/expenses" className="ml-1 font-semibold text-[#6E1A2C] hover:underline">Add expenses</Link>}</td></tr>}
              <tr className="border-t-2 border-[#6E1A2C]/30 bg-[#fbf6ee] text-base font-bold">
                <td className={tdCls}>Net profit</td>
                <td className={`${tdCls} text-right tabular-nums ${cur.netProfit < 0 ? "text-red-700" : "text-[#2a0a12]"}`}>{inr(cur.netProfit)}{delta(cur.netProfit, prev.netProfit)}</td>
                <td className={`${tdCls} hidden text-right tabular-nums sm:table-cell`}>{pct(cur.netProfit, cur.netRevenue)}</td>
                <td className={`${tdCls} text-right tabular-nums text-muted-foreground`}>{inr(prev.netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </Panel>

        <div className="space-y-6 xl:col-span-2">
          <Panel title="Last 6 months" action={<span className="flex items-center gap-3 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#e9d8b4]" />Revenue</span><span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#6E1A2C]" />Net profit</span></span>}>
            <div className="p-3"><TrendChart pnl={overview.pnl} /></div>
          </Panel>

          <Panel title="Money to receive and to pay">
            <ul className="divide-y divide-border/60 text-sm">
              <li className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-2"><ArrowDownLeft className="h-4 w-4 text-emerald-700" /> Razorpay, not yet in bank</span>
                <span className="text-right tabular-nums"><b>{inr(pos.razorpayUnsettled)}</b><br /><span className="text-xs text-muted-foreground">{pos.razorpaySynced ? `${pos.razorpayUnsettledOrders} payments` : "Sync to check"}</span></span>
              </li>
              <li className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-2"><ArrowDownLeft className="h-4 w-4 text-emerald-700" /> COD with courier</span>
                <span className="text-right tabular-nums"><b>{inr(pos.codDue)}</b><br /><span className="text-xs text-muted-foreground">{pos.codDueOrders} delivered orders</span></span>
              </li>
              <li className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-red-700" /> Owed to suppliers</span>
                <b className="tabular-nums">{inr(pos.supplierDue)}</b>
              </li>
              <li className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-red-700" /> Unpaid bills</span>
                <span className="text-right tabular-nums"><b>{inr(pos.unpaidExpenses)}</b><br /><span className="text-xs text-muted-foreground">{pos.unpaidExpenseCount} bills</span></span>
              </li>
            </ul>
            {canManage && <div className="flex gap-3 border-t border-border/60 px-4 py-2.5 text-xs font-semibold"><Link href="/admin/payments" className="text-[#6E1A2C] hover:underline">Match payments</Link><Link href="/admin/expenses" className="text-[#6E1A2C] hover:underline">Expenses</Link></div>}
          </Panel>
        </div>
      </div>

      <Panel title={<span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-[#c9a45a]" /> Cash flow</span>} action={<span className="text-xs text-muted-foreground">Money actually in and out, by month</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr><th className={thCls}></th>{overview.cash.map((c) => <th key={c.ym} className={`${thCls} text-right`}>{monthLabel(c.ym)}</th>)}</tr></thead>
            <tbody>
              {([
                ["Online payments received", "onlineIn", 1],
                ["COD paid by courier", "codIn", 1],
                ["Gateway fees", "feesOut", -1],
                ["Refunds paid", "refundsOut", -1],
                ["Paid to suppliers", "suppliersOut", -1],
                ["Expenses paid", "expensesOut", -1],
              ] as const).map(([label, key, sign]) => (
                <tr key={key}>
                  <td className={`${tdCls} text-muted-foreground`}>{label}</td>
                  {overview.cash.map((c) => <td key={c.ym} className={`${tdCls} text-right tabular-nums`}>{c[key] ? `${sign < 0 ? "−" : ""}${inr(c[key])}` : "—"}</td>)}
                </tr>
              ))}
              <tr className="border-t border-border bg-muted/20 font-semibold">
                <td className={tdCls}>Net cash</td>
                {overview.cash.map((c) => <td key={c.ym} className={`${tdCls} text-right tabular-nums ${c.net < 0 ? "text-red-700" : ""}`}>{inr(c.net)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="flex items-center gap-2 border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground"><Receipt className="h-3.5 w-3.5" /> This month so far: {inr(cashNow?.net ?? 0)} net. Cash sales at the shop and owner withdrawals are not tracked yet.</p>
      </Panel>
    </div>
  );
}
