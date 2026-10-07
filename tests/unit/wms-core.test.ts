import { describe, it, expect } from "vitest";
import {
  planFefo, weightedAvgCost, parseGrams, purchaseTotals, repackPlan, reorderSuggestion, expiryStatus, formatLotNumber, formatDocNumber,
} from "@/lib/wms-core";

const lot = (id: string, qtyLeft: number, expiry: string | null, received = "2026-01-01") => ({ id, qtyLeft, expiryDate: expiry, receivedAt: received });

describe("planFefo", () => {
  it("takes from the lot that expires first", () => {
    const { takes, short } = planFefo([lot("late", 10, "2027-06-01"), lot("early", 3, "2027-01-01")], 5);
    expect(takes.map((t) => [t.lot.id, t.take])).toEqual([["early", 3], ["late", 2]]);
    expect(short).toBe(0);
  });
  it("puts lots without expiry last and reports shortfall", () => {
    const { takes, short } = planFefo([lot("none", 2, null), lot("dated", 1, "2027-01-01")], 5);
    expect(takes.map((t) => t.lot.id)).toEqual(["dated", "none"]);
    expect(short).toBe(2);
  });
  it("breaks ties by receipt date and skips empty lots", () => {
    const { takes } = planFefo([lot("b", 5, null, "2026-03-01"), lot("empty", 0, null, "2025-01-01"), lot("a", 5, null, "2026-02-01")], 6);
    expect(takes.map((t) => [t.lot.id, t.take])).toEqual([["a", 5], ["b", 1]]);
  });
});

describe("costing", () => {
  it("weighted average cost", () => {
    expect(weightedAvgCost(10, 800, 10, 900)).toBe(850);
    expect(weightedAvgCost(0, 0, 5, 700)).toBe(700);
    expect(weightedAvgCost(-2, 500, 4, 600)).toBe(600);
  });
  it("purchase totals share freight by value and leave claimable GST out of cost", () => {
    const t = purchaseTotals([{ qty: 10, rate: 800, gstRate: 5 }, { qty: 100, rate: 20, gstRate: 18 }], 500, true);
    expect(t.subtotal).toBe(10000);
    expect(t.taxTotal).toBe(400 + 360);
    expect(t.total).toBe(10000 + 760 + 500);
    expect(t.landed).toEqual([840, 21]);
  });
  it("adds GST to cost when it can't be claimed", () => {
    expect(purchaseTotals([{ qty: 10, rate: 100, gstRate: 5 }], 0, false).landed).toEqual([105]);
  });
});

describe("parseGrams", () => {
  it("reads pack weights", () => {
    expect(parseGrams("250g")).toBe(250);
    expect(parseGrams("1kg")).toBe(1000);
    expect(parseGrams("1.5 Kg")).toBe(1500);
    expect(parseGrams("500 gm")).toBe(500);
    expect(parseGrams("Standard")).toBeNull();
  });
});

describe("repackPlan", () => {
  it("spreads wastage cost over the packs made", () => {
    const r = repackPlan({ inputKg: 10, costPerKg: 900, packingCost: 12, outputs: [{ grams: 250, packs: 38 }] });
    expect(r.outputKg).toBe(9.5);
    expect(r.wastageKg).toBe(0.5);
    expect(r.wastagePct).toBe(5);
    expect(r.packCosts[0]).toBe(Math.round(((9000 / 9.5) * 0.25 + 12) * 100) / 100);
    expect(r.error).toBeNull();
  });
  it("refuses more output than input", () => {
    expect(repackPlan({ inputKg: 1, costPerKg: 900, packingCost: 0, outputs: [{ grams: 500, packs: 3 }] }).error).toMatch(/more than/);
  });
});

describe("reorderSuggestion", () => {
  it("flags items that run out before new stock can arrive", () => {
    const r = reorderSuggestion({ stock: 10, sold: 60, leadDays: 7 }); // 2/day, needs 28 cover
    expect(r.status).toBe("REORDER");
    expect(r.daysLeft).toBe(5);
    expect(r.suggestQty).toBe(2 * 37 - 10);
  });
  it("leaves healthy stock alone", () => {
    expect(reorderSuggestion({ stock: 200, sold: 30 }).status).toBe("OK");
    expect(reorderSuggestion({ stock: 0, sold: 0 }).status).toBe("OUT");
    expect(reorderSuggestion({ stock: 5, sold: 0, threshold: 10 }).status).toBe("REORDER");
  });
});

describe("expiry and numbers", () => {
  const now = new Date("2026-10-08T00:00:00Z");
  it("classifies expiry", () => {
    expect(expiryStatus("2026-10-01", now)).toBe("EXPIRED");
    expect(expiryStatus("2026-10-30", now)).toBe("SOON");
    expect(expiryStatus("2027-03-01", now)).toBe("OK");
    expect(expiryStatus(null, now)).toBe("NONE");
  });
  it("formats lot and document numbers in India time", () => {
    expect(formatLotNumber(new Date("2026-10-31T20:00:00Z"), 7)).toBe("B2611-007");
    expect(formatDocNumber("PO", 2026, 12)).toBe("PO-2026-0012");
  });
});
