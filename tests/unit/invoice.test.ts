import { describe, it, expect } from "vitest";
import { computeInvoice } from "@/lib/invoice";

const settings = { storeName: "Spicy Nuts", contactEmail: "x@y.com", gstRate: 5, gstin: "29ABCDE1234F1Z5", legalName: null, businessAddress: null, businessState: "Karnataka" };
const order = {
  id: "ckxyz12345678", createdAt: new Date(), status: "PROCESSING", paymentMethod: "COD", total: 1050, subtotal: 1000, discount: 0, shippingFee: 50, taxAmount: 50,
  shippingAddress: "1 Road, Bengaluru, Karnataka, 560001", shippingState: "Karnataka", invoiceNumber: "SN/2026-27/00001", items: [{ price: 500, quantity: 2 }],
};

describe("invoice", () => {
  it("splits GST into CGST + SGST for same-state orders", () => {
    const inv = computeInvoice(order, settings);
    expect(inv.taxLines.map((l) => l.label)).toEqual(["CGST (2.5%)", "SGST (2.5%)"]);
    expect(inv.taxLines[0].amount + inv.taxLines[1].amount).toBeCloseTo(50);
    expect(inv.taxableValue).toBe(1000);
    expect(inv.isTaxInvoice).toBe(true);
  });

  it("uses IGST for other states", () => {
    const inv = computeInvoice({ ...order, shippingState: "Maharashtra" }, settings);
    expect(inv.taxLines).toEqual([{ label: "IGST (5%)", amount: 50 }]);
  });

  it("works out tax for legacy orders that didn't store it (prices are GST-inclusive)", () => {
    const inv = computeInvoice({ ...order, taxAmount: 0, subtotal: null, shippingState: null }, settings);
    expect(inv.taxTotal).toBe(50); // 1050 × 5/105
    expect(inv.taxLines[0].label).toBe("CGST (2.5%)"); // state read from address
  });

  it("is a plain invoice without GSTIN, and an order summary before confirmation", () => {
    expect(computeInvoice(order, { ...settings, gstin: null }).isTaxInvoice).toBe(false);
    expect(computeInvoice({ ...order, invoiceNumber: null }, settings).isFinalInvoice).toBe(false);
  });
});
