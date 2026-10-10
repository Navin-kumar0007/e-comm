// GST return downloads: an Excel workbook laid out like the GST offline tool, and a PDF summary.
// Browser-only; the libraries are loaded when the button is pressed so pages stay light.

import { gstPeriod, monthLabel } from "./finance-core";

const n2 = (v: number) => Math.round((Number(v) || 0) * 100) / 100;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** GST offline tool date format: 06-Oct-2026 */
const gstDate = (d: string | Date) => {
  const ist = new Date(new Date(d).getTime() + 5.5 * 36e5);
  return `${String(ist.getUTCDate()).padStart(2, "0")}-${MONTHS[ist.getUTCMonth()]}-${ist.getUTCFullYear()}`;
};

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

const MAROON = "FF6E1A2C";

export async function downloadGstExcel(data: any) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Spicy Nuts admin";
  wb.created = new Date();
  const g = data.gstr1;
  const period = gstPeriod(data.ym);

  const sheet = (name: string, headers: string[], rows: any[][], money: number[] = []) => {
    const ws = wb.addWorksheet(name);
    ws.addRow(headers);
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MAROON } };
    head.alignment = { vertical: "middle", wrapText: true };
    head.height = 30;
    rows.forEach((r) => ws.addRow(r));
    ws.columns.forEach((c, i) => {
      c.width = Math.min(42, Math.max(12, headers[i].length + 2, ...rows.map((r) => String(r[i] ?? "").length + 2)));
      if (money.includes(i)) c.numFmt = "#,##0.00";
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    return ws;
  };

  // Summary
  const sum = wb.addWorksheet("Summary");
  sum.addRows([
    ["GST return workings", ""],
    ["Business", data.legalName ?? ""],
    ["GSTIN", data.gstin ?? ""],
    ["Return period", `${monthLabel(data.ym, true)} (${period})`],
    ["Invoices", `${data.invoiceCount}${g.docs.count ? ` (${g.docs.from} to ${g.docs.to})` : ""}`],
    ["Generated", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
    [],
    ["GSTR-3B", "Taxable", "IGST", "CGST", "SGST"],
    ["3.1(a) Outward taxable supplies (after credit notes)", n2(data.outward.taxable), n2(data.outward.igst), n2(data.outward.cgst), n2(data.outward.sgst)],
    ["4(A)(5) Input tax credit", "", n2(data.itc.igst), n2(data.itc.cgst), n2(data.itc.sgst)],
    ["Payable in cash (estimate)", "", n2(data.payable.igst), n2(data.payable.cgst), n2(data.payable.sgst)],
    [],
    ["Estimate only: your CA applies set-off rules and checks input credit against GSTR-2B before filing."],
  ]);
  sum.getCell("A1").font = { bold: true, size: 14, color: { argb: MAROON } };
  sum.getRow(8).font = { bold: true };
  sum.getRow(11).font = { bold: true };
  sum.getColumn(1).width = 52;
  [2, 3, 4, 5].forEach((c) => { sum.getColumn(c).width = 16; sum.getColumn(c).numFmt = "#,##0.00"; });

  sheet("b2b,sez,de", ["GSTIN/UIN of Recipient", "Receiver Name", "Invoice Number", "Invoice date", "Invoice Value", "Place Of Supply", "Reverse Charge", "Applicable % of Tax Rate", "Invoice Type", "E-Commerce GSTIN", "Rate", "Taxable Value", "Cess Amount"],
    g.b2b.map((r: any) => [r.gstin, r.name, r.invoice, gstDate(r.date), n2(r.value), r.pos, "N", "", "Regular B2B", "", r.rate, n2(r.taxable), 0]), [4, 11, 12]);
  sheet("b2cl", ["Invoice Number", "Invoice date", "Invoice Value", "Place Of Supply", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN"],
    g.b2cl.map((r: any) => [r.invoice, gstDate(r.date), n2(r.value), r.pos, "", r.rate, n2(r.taxable), 0, ""]), [2, 6, 7]);
  sheet("b2cs", ["Type", "Place Of Supply", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN"],
    g.b2cs.map((r: any) => ["OE", r.pos, "", r.rate, n2(r.taxable), 0, ""]), [4, 5]);
  const hsnHead = ["HSN", "Description", "UQC", "Total Quantity", "Total Value", "Rate", "Taxable Value", "Integrated Tax Amount", "Central Tax Amount", "State/UT Tax Amount", "Cess Amount"];
  const hsnRow = (r: any) => [r.hsn, r.description, "NOS-NUMBERS", r.qty, n2(r.value), r.rate, n2(r.taxable), n2(r.igst), n2(r.cgst), n2(r.sgst), 0];
  sheet("hsn(b2b)", hsnHead, (g.hsnB2b ?? []).map(hsnRow), [4, 6, 7, 8, 9, 10]);
  sheet("hsn(b2c)", hsnHead, (g.hsnB2c ?? g.hsn).map(hsnRow), [4, 6, 7, 8, 9, 10]);
  sheet("docs", ["Nature of Document", "Sr. No. From", "Sr. No. To", "Total Number", "Cancelled"],
    data.docsIssued?.total ? [["Invoices for outward supply", data.docsIssued.from, data.docsIssued.to, data.docsIssued.total, data.docsIssued.cancelled]] : []);
  sheet("Refunds (credit notes)", ["Date", "Original invoice", "Customer", "Refund", "Taxable", "GST", "Tax type", "Reason"],
    data.creditNotes.map((c: any) => [gstDate(c.date), c.invoice, c.customer, n2(c.amount), n2(c.taxable), n2(c.tax), c.sameState ? "CGST+SGST" : "IGST", c.reason]), [3, 4, 5]);
  sheet("Input credit", ["Supplier / expense", "GSTIN", "Bill no.", "Bill date", "Taxable", "GST", "Tax type"],
    data.itcRows.map((r: any) => [r.source, r.gstin, r.billNo ?? "", gstDate(r.date), n2(r.taxable), n2(r.tax), r.sameState ? "CGST+SGST" : "IGST"]), [4, 5]);

  const buf = await wb.xlsx.writeBuffer();
  save(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `GST-${period}-SpicyNuts.xlsx`);
}

export async function downloadGstPdf(data: any) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const g = data.gstr1;
  const period = gstPeriod(data.ym);
  const W = doc.internal.pageSize.getWidth();
  // The built-in PDF fonts have no ₹ sign, so amounts are written as "Rs".
  const rs = (v: number) => `Rs ${n2(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const maroon: [number, number, number] = [110, 26, 44];

  doc.setFillColor(...maroon);
  doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("GST Return Summary", 14, 11);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.legalName ?? ""}  |  GSTIN ${data.gstin ?? "-"}  |  ${monthLabel(data.ym, true)} (${period})`, 14, 18);
  doc.setTextColor(0, 0, 0);

  let y = 32;
  const table = (title: string, head: string[], body: any[][], note?: string) => {
    if (y > 250) { doc.addPage(); y = 18; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...maroon);
    doc.text(title, 14, y);
    doc.setTextColor(0, 0, 0);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [head],
      body: body.length ? body : [[{ content: "Nothing this month", colSpan: head.length, styles: { textColor: [120, 120, 120] } }]],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.6 },
      headStyles: { fillColor: maroon, textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + (note ? 4 : 8);
    if (note) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(90, 90, 90);
      doc.text(doc.splitTextToSize(note, W - 28), 14, y);
      doc.setTextColor(0, 0, 0);
      y += 8;
    }
  };

  table("GSTR-3B summary", ["", "Taxable", "IGST", "CGST", "SGST"], [
    ["3.1(a) Sales (from GSTR-1)", rs(g.totals.taxable), rs(g.totals.igst), rs(g.totals.cgst), rs(g.totals.sgst)],
    ["Less: refunds / credit notes", rs(-data.cnTotals.taxable), rs(-data.cnTotals.igst), rs(-data.cnTotals.cgst), rs(-data.cnTotals.sgst)],
    ["Output tax", rs(data.outward.taxable), rs(data.outward.igst), rs(data.outward.cgst), rs(data.outward.sgst)],
    ["4(A)(5) Input tax credit", "", rs(data.itc.igst), rs(data.itc.cgst), rs(data.itc.sgst)],
    ["Payable in cash (estimate)", "", rs(data.payable.igst), rs(data.payable.cgst), rs(data.payable.sgst)],
  ], "Estimate only. Your CA applies set-off rules and checks input credit against GSTR-2B before filing.");
  table("B2B: sales to GST-registered buyers (table 4A)", ["Buyer GSTIN", "Invoice", "Date", "Place of supply", "Rate", "Taxable", "IGST", "CGST", "SGST"],
    g.b2b.map((r: any) => [r.gstin, r.invoice, gstDate(r.date), r.pos, `${r.rate}%`, rs(r.taxable), rs(r.igst), rs(r.cgst), rs(r.sgst)]));
  if (g.b2cl.length) table("B2C large (table 5)", ["Invoice", "Date", "Place of supply", "Rate", "Taxable", "IGST"], g.b2cl.map((r: any) => [r.invoice, gstDate(r.date), r.pos, `${r.rate}%`, rs(r.taxable), rs(r.igst)]));
  table("B2C small by state and rate (table 7)", ["Place of supply", "Type", "Rate", "Taxable", "IGST", "CGST", "SGST"],
    g.b2cs.map((r: any) => [r.pos, r.type, `${r.rate}%`, rs(r.taxable), rs(r.igst), rs(r.cgst), rs(r.sgst)]));
  table("HSN summary (table 12)", ["HSN", "Description", "Qty", "Rate", "Taxable", "IGST", "CGST", "SGST"],
    g.hsn.map((r: any) => [r.hsn, r.description, r.qty, `${r.rate}%`, rs(r.taxable), rs(r.igst), rs(r.cgst), rs(r.sgst)]));
  table("Documents issued (table 13)", ["Invoices", "From", "To", "Total", "Cancelled"],
    data.docsIssued?.total ? [["Outward supply", data.docsIssued.from, data.docsIssued.to, data.docsIssued.total, data.docsIssued.cancelled]] : []);
  table("Refunds to issue as credit notes (table 9B)", ["Date", "Original invoice", "Customer", "Refund", "Taxable", "GST"],
    data.creditNotes.map((c: any) => [gstDate(c.date), c.invoice ?? "-", c.customer, rs(c.amount), rs(c.taxable), rs(c.tax)]));
  table("Input tax credit", ["From", "GSTIN", "Bill", "Taxable", "GST", "Type"],
    data.itcRows.map((r: any) => [r.source, r.gstin, r.billNo ?? "-", rs(r.taxable), rs(r.tax), r.sameState ? "CGST+SGST" : "IGST"]));

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} from Spicy Nuts admin  |  Page ${i} of ${pages}`, 14, 290);
  }
  save(doc.output("blob"), `GST-${period}-SpicyNuts.pdf`);
}
