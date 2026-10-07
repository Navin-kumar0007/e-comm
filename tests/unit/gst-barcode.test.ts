import { describe, it, expect } from "vitest";
import { splitGst, amountInWords, stateCode, isValidGstin } from "@/lib/gst";
import { ean13CheckDigit, isValidEan13, inStoreEan13, formatEan13 } from "@/lib/barcode";

describe("splitGst", () => {
  it("matches the single-rate formula when every item has the same rate", () => {
    const s = splitGst({ lines: [{ amount: 600, gstRate: 5 }, { amount: 400, gstRate: 5 }], shipping: 50, defaultRate: 5 });
    expect(s.total).toBe(1050);
    expect(s.taxTotal).toBeCloseTo(50, 1); // 1050 × 5/105
    expect(s.byRate).toEqual([{ rate: 5, taxable: expect.any(Number), tax: expect.any(Number) }]);
  });

  it("taxes each line at its own rate and spreads the discount by value", () => {
    const s = splitGst({ lines: [{ amount: 800, gstRate: 5 }, { amount: 200, gstRate: 12 }], discount: 100, defaultRate: 5 });
    expect(s.lines[0].discount).toBe(80);
    expect(s.lines[1].discount).toBe(20);
    expect(s.lines[0].tax).toBeCloseTo(720 - 720 / 1.05, 2);
    expect(s.lines[1].tax).toBeCloseTo(180 - 180 / 1.12, 2);
    expect(s.total).toBe(900);
    expect(s.byRate.map((r) => r.rate)).toEqual([5, 12]);
  });

  it("taxes shipping at the principal item's rate", () => {
    const s = splitGst({ lines: [{ amount: 100, gstRate: 5 }, { amount: 900, gstRate: 12 }], shipping: 56, defaultRate: 5 });
    expect(s.shipping.rate).toBe(12);
    expect(s.shipping.tax).toBeCloseTo(6, 2);
  });
});

describe("amountInWords", () => {
  it.each([
    [0, "Rupees Zero Only"],
    [105, "Rupees One Hundred Five Only"],
    [1234.5, "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only"],
    [250000, "Rupees Two Lakh Fifty Thousand Only"],
    [12345678, "Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only"],
  ])("%s", (n, words) => expect(amountInWords(n)).toBe(words));
});

describe("GST helpers", () => {
  it("knows state codes and GSTIN format", () => {
    expect(stateCode("Karnataka")).toBe("29");
    expect(stateCode("Tamil Nadu")).toBe("33");
    expect(stateCode("Nowhere")).toBeNull();
    expect(isValidGstin("29FCBPM9871D1Z6")).toBe(true);
    expect(isValidGstin("29FCBPM9871D1Y6")).toBe(false);
  });
});

describe("EAN-13", () => {
  it("computes and checks the check digit", () => {
    expect(ean13CheckDigit("400638133393")).toBe(1); // 4006381333931 is a known valid code
    expect(isValidEan13("4006381333931")).toBe(true);
    expect(isValidEan13("4006381333932")).toBe(false);
  });

  it("makes valid in-store codes", () => {
    const c = inStoreEan13(1);
    expect(c).toMatch(/^21\d{11}$/);
    expect(isValidEan13(c)).toBe(true);
    expect(formatEan13(c)).toBe(`${c[0]} ${c.slice(1, 7)} ${c.slice(7)}`);
  });
});
