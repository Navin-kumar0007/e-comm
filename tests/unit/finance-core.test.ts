import { describe, it, expect } from "vitest";
import { buildGstr1, refundTax, itcTotals, monthRange, lastMonths, ymOf, gstPeriod, expenseCost, toCsv, receivedValue, type InvoiceForReturn } from "@/lib/finance-core";

const inv = (o: Partial<InvoiceForReturn>): InvoiceForReturn => ({
  invoiceNumber: "SN/26-27/0001", date: "2026-10-05T06:00:00Z", customerName: "A", customerGstin: null, placeOfSupply: "Karnataka", sameState: true, total: 1050,
  lines: [{ hsnCode: "0802", description: "Almonds", qty: 2, rate: 5, taxable: 952.38, tax: 47.62 }],
  shipping: { taxable: 47.62, tax: 2.38, rate: 5 },
  ...o,
});

describe("periods", () => {
  it("uses India time for month boundaries", () => {
    const { start, end } = monthRange("2026-10");
    expect(start.toISOString()).toBe("2026-09-30T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-10-31T18:30:00.000Z");
    expect(ymOf("2026-10-31T19:00:00Z")).toBe("2026-11");
    expect(lastMonths(3, new Date("2026-01-10T00:00:00Z"))).toEqual(["2025-11", "2025-12", "2026-01"]);
    expect(gstPeriod("2026-10")).toBe("102026");
  });
});

describe("buildGstr1", () => {
  it("puts consumer sales into B2CS by state and rate, with shipping folded into the main item", () => {
    const r = buildGstr1([inv({}), inv({ invoiceNumber: "SN/26-27/0002", placeOfSupply: "Maharashtra", sameState: false })], "Karnataka");
    expect(r.b2b).toHaveLength(0);
    expect(r.b2cs).toHaveLength(2);
    const ka = r.b2cs.find((x) => x.pos.includes("Karnataka"))!;
    expect(ka.pos).toBe("29-Karnataka");
    expect(ka.taxable).toBe(1000);
    expect(ka.cgst).toBe(25);
    expect(ka.sgst).toBe(25);
    const mh = r.b2cs.find((x) => x.pos.includes("Maharashtra"))!;
    expect(mh.igst).toBe(50);
    expect(r.hsn[0]).toMatchObject({ hsn: "0802", qty: 4, taxable: 2000, igst: 50, cgst: 25, sgst: 25 });
    expect(r.docs).toEqual({ from: "SN/26-27/0001", to: "SN/26-27/0002", count: 2 });
    expect(r.totals.taxable).toBe(2000);
  });
  it("lists business buyers invoice by invoice and big inter-state consumer invoices as B2CL", () => {
    const r = buildGstr1([
      inv({ customerGstin: "27ABCDE1234F1Z5", customerName: "Shop", sameState: false, placeOfSupply: "Maharashtra" }),
      inv({ invoiceNumber: "X2", total: 150000, sameState: false, placeOfSupply: "Goa", lines: [{ hsnCode: "0802", description: "A", qty: 1, rate: 5, taxable: 142857.14, tax: 7142.86 }], shipping: { taxable: 0, tax: 0, rate: 5 } }),
    ], "Karnataka");
    expect(r.b2b[0]).toMatchObject({ gstin: "27ABCDE1234F1Z5", igst: 50, pos: "27-Maharashtra" });
    expect(r.b2cl).toHaveLength(1);
    expect(r.b2cs).toHaveLength(0);
  });
});

describe("credit and ITC", () => {
  it("takes the tax share out of refunds", () => {
    expect(refundTax([{ amount: 525, orderTotal: 1050, orderTax: 50, sameState: true }])).toEqual({ taxable: 500, igst: 0, cgst: 12.5, sgst: 12.5 });
  });
  it("splits input credit by supplier state", () => {
    expect(itcTotals([{ tax: 100, sameState: true }, { tax: 40, sameState: false }])).toEqual({ taxable: 0, igst: 40, cgst: 50, sgst: 50 });
  });
  it("counts GST as cost only when the vendor isn't registered", () => {
    expect(expenseCost({ amount: 100, total: 118, vendorGstin: "29ABCDE1234F1Z5" })).toBe(100);
    expect(expenseCost({ amount: 100, total: 118, vendorGstin: null })).toBe(118);
  });
});

describe("csv", () => {
  it("quotes cells that need it", () => {
    expect(toCsv(["a", "b"], [["x,y", 'say "hi"'], [1, null]])).toBe('a,b\n"x,y","say ""hi"""\n1,');
  });
});

describe("supplier dues", () => {
  it("owes only for goods received, pro rata to the PO total", async () => {
    expect(receivedValue({ total: 10500, lines: [{ qty: 10, rate: 500, receivedQty: 10 }, { qty: 10, rate: 500, receivedQty: 0 }] })).toBe(5250);
    expect(receivedValue({ total: 0, lines: [] })).toBe(0);
  });
});

describe("hsn split", () => {
  it("reports HSN for business buyers and consumers separately", () => {
    const r = buildGstr1([inv({}), inv({ invoiceNumber: "X", customerGstin: "29ABCDE1234F1Z5" })], "Karnataka");
    expect(r.hsnB2b).toHaveLength(1);
    expect(r.hsnB2c).toHaveLength(1);
    expect(r.hsn[0].qty).toBe(4);
    expect(r.hsnB2b[0].qty).toBe(2);
  });
});
