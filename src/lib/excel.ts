// Simple one-sheet Excel download for admin tables. Browser-only; ExcelJS loads on demand.

export async function downloadExcel(fileName: string, sheetName: string, headers: string[], rows: Array<Array<string | number | null | undefined>>, moneyColumns: number[] = []) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.slice(0, 31));
  ws.addRow(headers);
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6E1A2C" } };
  rows.forEach((r) => ws.addRow(r.map((v) => (v === undefined ? null : v))));
  ws.columns.forEach((c, i) => {
    c.width = Math.min(48, Math.max(10, headers[i].length + 2, ...rows.map((r) => String(r[i] ?? "").length + 2)));
    if (moneyColumns.includes(i)) c.numFmt = "#,##0.00";
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const buf = await wb.xlsx.writeBuffer();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
