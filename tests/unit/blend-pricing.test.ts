import { describe, it, expect } from "vitest";
import { parseBlendSpec, calculateBlendPrice, BLEND_MIN_PRICE } from "@/lib/blend-pricing";

const spec = { blendName: "My Mix", base: "cumin", heat: "ghost", aromatic: "nutmeg", basePct: 50, heatPct: 30, aromaticPct: 20 };

describe("custom blend pricing", () => {
  it("prices from ingredient rates, not from the client", () => {
    // 50×3.0 + 30×5.5 + 20×6.2 = 439
    expect(parseBlendSpec({ ...spec, price: 1 })?.price).toBe(439);
  });

  it("never goes below the packaging floor", () => {
    expect(calculateBlendPrice({ base: "coriander", heat: "mild", aromatic: "cinnamon", basePct: 100, heatPct: 0, aromaticPct: 0 })).toBe(BLEND_MIN_PRICE);
  });

  it("rejects bad ratios, unknown ingredients and empty names", () => {
    expect(parseBlendSpec({ ...spec, basePct: 90 })).toBeNull();
    expect(parseBlendSpec({ ...spec, basePct: 50.5, heatPct: 29.5 })).toBeNull();
    expect(parseBlendSpec({ ...spec, heat: "gunpowder" })).toBeNull();
    expect(parseBlendSpec({ ...spec, blendName: "<>!!" })).toBeNull();
    expect(parseBlendSpec(null)).toBeNull();
  });

  it("strips markup from names", () => {
    expect(parseBlendSpec({ ...spec, blendName: "Hot <b>Mix</b>" })?.spec.blendName).toBe("Hot bMixb");
  });
});
