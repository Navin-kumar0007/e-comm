"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Download, Printer, Landmark } from "lucide-react";
import { gstPeriod, lastMonths, monthLabel, toCsv } from "@/lib/finance-core";
import { PageHeader, Panel, Stat, inputCls, btnSecondary, thCls, tdCls, inr, dateFmt } from "@/components/admin/ui";

const n2 = (v: number) => (Math.round(v * 100) / 100).toFixed(2);

function download(name: string, csv: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
}

export function GstClient({ data }: { data: any }) {
  const router = useRouter();
  const { gstr1: g, itc, outward, payable, cnTotals } = data;
  const period = gstPeriod(data.ym);
  const totalPayable = Math.max(0, payable.igst) + Math.max(0, payable.cgst) + Math.max(0, payable.sgst);

  const csv = {
    b2b: () => download(`GSTR1-B2B-${period}.csv`, toCsv(
      ["GSTIN of recipient", "Receiver name", "Invoice number", "Invoice date", "Invoice value", "Place of supply", "Reverse charge", "Invoice type", "Rate", "Taxable value", "IGST", "CGST", "SGST"],
      g.b2b.map((r: any) => [r.gstin, r.name, r.invoice, r.date, n2(r.value), r.pos, "N", "Regular B2B", r.rate, n2(r.taxable), n2(r.igst), n2(r.cgst), n2(r.sgst)]))),
    b2cl: () => download(`GSTR1-B2CL-${period}.csv`, toCsv(
      ["Invoice number", "Invoice date", "Invoice value", "Place of supply", "Rate", "Taxable value", "IGST"],
      g.b2cl.map((r: any) => [r.invoice, r.date, n2(r.value), r.pos, r.rate, n2(r.taxable), n2(r.igst)]))),
    b2cs: () => download(`GSTR1-B2CS-${period}.csv`, toCsv(
      ["Type", "Place of supply", "Rate", "Taxable value", "IGST", "CGST", "SGST", "E-commerce GSTIN"],
      g.b2cs.map((r: any) => ["OE", r.pos, r.rate, n2(r.taxable), n2(r.igst), n2(r.cgst), n2(r.sgst), ""]))),
    hsn: () => download(`GSTR1-HSN-${period}.csv`, toCsv(
      ["HSN", "Description", "UQC", "Total quantity", "Total value", "Rate", "Taxable value", "IGST", "CGST", "SGST"],
      g.hsn.map((r: any) => [r.hsn, r.description, "NOS-NUMBERS", r.qty, n2(r.value), r.rate, n2(r.taxable), n2(r.igst), n2(r.cgst), n2(r.sgst)]))),
    cn: () => download(`Refunds-credit-notes-${period}.csv`, toCsv(
      ["Date", "Original invoice", "Customer", "Refund", "Taxable", "GST", "Reason"],
      data.creditNotes.map((c: any) => [new Date(c.date).toISOString().slice(0, 10), c.invoice, c.customer, n2(c.amount), n2(c.taxable), n2(c.tax), c.reason]))),
    itc: () => download(`ITC-purchases-${period}.csv`, toCsv(
      ["Supplier / expense", "GSTIN", "Bill no.", "Date", "Taxable", "GST", "Same state"],
      data.itcRows.map((r: any) => [r.source, r.gstin, r.billNo, new Date(r.date).toISOString().slice(0, 10), n2(r.taxable), n2(r.tax), r.sameState ? "Yes" : "No"]))),
  };

  const sec = (title: string, rows: number, onCsv: () => void, children: React.ReactNode, hint?: string) => (
    <Panel title={<span>{title} <span className="ml-1 text-xs font-normal text-muted-foreground">{rows} row{rows === 1 ? "" : "s"}</span></span>} action={<button className={`${btnSecondary} h-8 print:hidden`} onClick={onCsv} disabled={!rows}><Download className="h-3.5 w-3.5" /> CSV</button>}>
      {hint && <p className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">{hint}</p>}
      {rows === 0 ? <p className="p-4 text-sm text-muted-foreground">Nothing this month.</p> : <div className="overflow-x-auto">{children}</div>}
    </Panel>
  );
  const taxCells = (r: any) => <>
    <td className={`${tdCls} text-right tabular-nums`}>{inr(r.taxable, 2)}</td>
    <td className={`${tdCls} text-right tabular-nums`}>{r.igst ? inr(r.igst, 2) : "—"}</td>
    <td className={`${tdCls} text-right tabular-nums`}>{r.cgst ? inr(r.cgst, 2) : "—"}</td>
    <td className={`${tdCls} text-right tabular-nums`}>{r.sgst ? inr(r.sgst, 2) : "—"}</td>
  </>;
  const taxHead = <><th className={`${thCls} text-right`}>Taxable</th><th className={`${thCls} text-right`}>IGST</th><th className={`${thCls} text-right`}>CGST</th><th className={`${thCls} text-right`}>SGST</th></>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="GST returns"
        subtitle={<>Figures for GSTR-1 and GSTR-3B for {data.legalName ?? "your business"}{data.gstin ? <> · GSTIN <span className="font-mono">{data.gstin}</span></> : null}. Share the CSVs with your CA to file.</>}
        actions={<div className="flex gap-2 print:hidden">
          <select className={`${inputCls} w-44`} value={data.ym} onChange={(e) => router.push(`/admin/gst?m=${e.target.value}`)} aria-label="Return period">
            {lastMonths(12).reverse().map((m) => <option key={m} value={m}>{monthLabel(m, true)}</option>)}
          </select>
          <button className={btnSecondary} onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
        </div>}
      />

      {(data.missingHsn > 0 || !data.gstin || data.uninvoiced.count > 0) && (
        <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 print:hidden">
          {!data.gstin && <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> No GSTIN in Settings.</p>}
          {data.uninvoiced.count > 0 && <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {data.uninvoiced.count} confirmed order{data.uninvoiced.count === 1 ? "" : "s"} this month ({inr(data.uninvoiced.value)}) have no invoice number, so they are not in these figures. They were placed before invoice numbering started; ask your CA how to report them.</p>}
          {data.missingHsn > 0 && <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {data.missingHsn} item line{data.missingHsn === 1 ? " was" : "s were"} sold without an HSN code (shown as "—"). Add HSN codes on each product; new orders will carry them.</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Invoices" value={data.invoiceCount} hint={<>{g.docs.count ? `${g.docs.from} → ${g.docs.to}` : "None"}{data.cancelledInvoices.length ? <><br />{data.cancelledInvoices.length} cancelled: {data.cancelledInvoices.join(", ")}</> : null}</>} />
        <Stat label="Output GST" value={inr(outward.igst + outward.cgst + outward.sgst, 2)} hint={`On ${inr(outward.taxable)} taxable, after refunds`} />
        <Stat label="Input credit" value={inr(itc.igst + itc.cgst + itc.sgst, 2)} hint="From purchases and bills with GSTIN" tone="good" />
        <Stat label="GST to pay (est.)" value={inr(totalPayable, 2)} hint={`Due by 20 ${monthLabel(nextYm(data.ym))}`} tone={totalPayable ? "warn" : undefined} />
      </div>

      <Panel title={<span className="flex items-center gap-2"><Landmark className="h-4 w-4 text-[#c9a45a]" /> GSTR-3B summary · {monthLabel(data.ym, true)}</span>}>
        <table className="w-full text-sm">
          <thead className="bg-muted/30"><tr><th className={thCls}></th>{taxHead}</tr></thead>
          <tbody className="divide-y divide-border/60">
            <tr><td className={tdCls}>3.1(a) Sales (from GSTR-1)</td>{taxCells(g.totals)}</tr>
            <tr><td className={`${tdCls} text-muted-foreground`}>Less: refunds / credit notes</td>{taxCells({ taxable: -cnTotals.taxable, igst: -cnTotals.igst, cgst: -cnTotals.cgst, sgst: -cnTotals.sgst })}</tr>
            <tr className="bg-muted/20 font-semibold"><td className={tdCls}>Output tax</td>{taxCells(outward)}</tr>
            <tr><td className={tdCls}>4(A)(5) Input tax credit, all other ITC</td><td className={tdCls}></td><td className={`${tdCls} text-right tabular-nums`}>{inr(itc.igst, 2)}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(itc.cgst, 2)}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(itc.sgst, 2)}</td></tr>
            <tr className="border-t-2 border-[#6E1A2C]/30 bg-[#fbf6ee] font-bold"><td className={tdCls}>Payable in cash (estimate)</td><td className={tdCls}></td>
              {(["igst", "cgst", "sgst"] as const).map((k) => <td key={k} className={`${tdCls} text-right tabular-nums ${payable[k] < 0 ? "text-emerald-700" : ""}`}>{payable[k] < 0 ? `${inr(-payable[k], 2)} credit` : inr(payable[k], 2)}</td>)}
            </tr>
          </tbody>
        </table>
        <p className="border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">Estimate only. Your CA applies set-off rules (IGST credit first), carries forward unused credit, and checks ITC against GSTR-2B before filing. Refunds should be issued as credit notes against the original invoice.</p>
      </Panel>

      {sec("B2B: sales to GST-registered buyers (table 4A)", g.b2b.length, csv.b2b, (
        <table className="w-full text-sm"><thead className="bg-muted/30"><tr><th className={thCls}>Buyer GSTIN</th><th className={thCls}>Invoice</th><th className={thCls}>Place of supply</th><th className={`${thCls} text-right`}>Rate</th>{taxHead}</tr></thead>
          <tbody className="divide-y divide-border/60">{g.b2b.map((r: any, i: number) => <tr key={i}><td className={`${tdCls} font-mono text-xs`}>{r.gstin}<p className="font-sans text-muted-foreground">{r.name}</p></td><td className={tdCls}>{r.invoice}<p className="text-xs text-muted-foreground">{dateFmt(r.date)}</p></td><td className={tdCls}>{r.pos}</td><td className={`${tdCls} text-right`}>{r.rate}%</td>{taxCells(r)}</tr>)}</tbody></table>
      ), "Orders where the customer gave a GSTIN. Each invoice is reported separately.")}

      {g.b2cl.length > 0 && sec("B2C large: other-state invoices above ₹1 lakh (table 5)", g.b2cl.length, csv.b2cl, (
        <table className="w-full text-sm"><thead className="bg-muted/30"><tr><th className={thCls}>Invoice</th><th className={thCls}>Place of supply</th><th className={`${thCls} text-right`}>Rate</th>{taxHead}</tr></thead>
          <tbody className="divide-y divide-border/60">{g.b2cl.map((r: any, i: number) => <tr key={i}><td className={tdCls}>{r.invoice}</td><td className={tdCls}>{r.pos}</td><td className={`${tdCls} text-right`}>{r.rate}%</td>{taxCells(r)}</tr>)}</tbody></table>
      ))}

      {sec("B2C small: consumer sales by state and rate (table 7)", g.b2cs.length, csv.b2cs, (
        <table className="w-full text-sm"><thead className="bg-muted/30"><tr><th className={thCls}>Place of supply</th><th className={thCls}>Type</th><th className={`${thCls} text-right`}>Rate</th>{taxHead}</tr></thead>
          <tbody className="divide-y divide-border/60">{g.b2cs.map((r: any, i: number) => <tr key={i}><td className={tdCls}>{r.pos}</td><td className={tdCls}>{r.type}</td><td className={`${tdCls} text-right`}>{r.rate}%</td>{taxCells(r)}</tr>)}</tbody></table>
      ), "Delivery charges are included with the goods they were charged on, at the same rate.")}

      {sec("HSN-wise summary (table 12)", g.hsn.length, csv.hsn, (
        <table className="w-full text-sm"><thead className="bg-muted/30"><tr><th className={thCls}>HSN</th><th className={thCls}>Description</th><th className={`${thCls} text-right`}>Qty</th><th className={`${thCls} text-right`}>Rate</th>{taxHead}</tr></thead>
          <tbody className="divide-y divide-border/60">{g.hsn.map((r: any, i: number) => <tr key={i}><td className={`${tdCls} font-mono`}>{r.hsn}</td><td className={tdCls}>{r.description}</td><td className={`${tdCls} text-right tabular-nums`}>{r.qty}</td><td className={`${tdCls} text-right`}>{r.rate}%</td>{taxCells(r)}</tr>)}</tbody></table>
      ))}

      {sec("Refunds this month (issue as credit notes, table 9B)", data.creditNotes.length, csv.cn, (
        <table className="w-full text-sm"><thead className="bg-muted/30"><tr><th className={thCls}>Date</th><th className={thCls}>Original invoice</th><th className={thCls}>Customer</th><th className={`${thCls} text-right`}>Refund</th><th className={`${thCls} text-right`}>Taxable</th><th className={`${thCls} text-right`}>GST</th></tr></thead>
          <tbody className="divide-y divide-border/60">{data.creditNotes.map((c: any, i: number) => <tr key={i}><td className={tdCls}>{dateFmt(c.date)}</td><td className={tdCls}>{c.invoice ?? "—"}</td><td className={tdCls}>{c.customer}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(c.amount, 2)}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(c.taxable, 2)}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(c.tax, 2)}</td></tr>)}</tbody></table>
      ))}

      {sec("Input tax credit: purchases and bills", data.itcRows.length, csv.itc, (
        <table className="w-full text-sm"><thead className="bg-muted/30"><tr><th className={thCls}>From</th><th className={thCls}>GSTIN</th><th className={thCls}>Bill</th><th className={`${thCls} text-right`}>Taxable</th><th className={`${thCls} text-right`}>GST</th><th className={thCls}>Type</th></tr></thead>
          <tbody className="divide-y divide-border/60">{data.itcRows.map((r: any, i: number) => <tr key={i}><td className={tdCls}>{r.source}</td><td className={`${tdCls} font-mono text-xs`}>{r.gstin}</td><td className={tdCls}>{r.billNo ?? "—"}<p className="text-xs text-muted-foreground">{dateFmt(r.date)}</p></td><td className={`${tdCls} text-right tabular-nums`}>{inr(r.taxable, 2)}</td><td className={`${tdCls} text-right tabular-nums`}>{inr(r.tax, 2)}</td><td className={tdCls}>{r.sameState ? "CGST + SGST" : "IGST"}</td></tr>)}</tbody></table>
      ), "Purchase orders received from GST-registered suppliers, expenses with a vendor GSTIN, and Razorpay's GST on its fees. Claim only what shows in your GSTR-2B.")}
    </div>
  );
}

function nextYm(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
}
