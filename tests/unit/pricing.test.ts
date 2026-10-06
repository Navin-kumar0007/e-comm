import { describe, it, expect, vi, beforeEach } from "vitest";

// The pricing engine reads products/coupons/orders from the DB — replace it with in-memory data.
const db = vi.hoisted(() => ({
  products: [] as any[],
  coupons: {} as Record<string, any>,
  priorOrders: 0,
  couponUses: 0,
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn(async ({ where }: any) => db.products.filter((p) => where.id.in.includes(p.id))) },
    coupon: { findUnique: vi.fn(async ({ where }: any) => db.coupons[where.code] ?? null) },
    order: { count: vi.fn(async ({ where }: any) => (where.couponCode ? db.couponUses : db.priorOrders)) },
  },
}));
vi.mock("@/lib/store-settings", () => ({
  getStoreSettings: vi.fn(async () => ({ freeShippingThreshold: 999, flatShippingRate: 50, gstRate: 5 })),
}));

import { priceCart, CheckoutError } from "@/lib/pricing";

const product = (over: any = {}) => ({ id: "p1", name: "Cumin", status: "ACTIVE", price: 300, salePrice: null, stock: 10, weight: "250g", variants: [], ...over });
const coupon = (over: any = {}) => ({ code: "SAVE10", active: true, discountType: "PERCENTAGE", discountValue: 10, expiryDate: null, minPurchase: null, maxDiscount: null, usageLimit: null, usedCount: 0, perUserLimit: null, firstOrderOnly: false, ...over });

beforeEach(() => {
  db.products = [product()];
  db.coupons = {};
  db.priorOrders = 0;
  db.couponUses = 0;
});

describe("priceCart", () => {
  it("ignores prices sent by the browser and adds shipping under the threshold", async () => {
    const q = await priceCart({ items: [{ productId: "p1", quantity: 2, price: 1 }] });
    expect(q.subtotal).toBe(600);
    expect(q.shippingFee).toBe(50);
    expect(q.total).toBe(650);
    expect(q.taxAmount).toBeCloseTo(30.95); // GST inside the price: 650 × 5/105
  });

  it("uses the sale price and gives free shipping above the threshold", async () => {
    db.products = [product({ salePrice: 250 })];
    const q = await priceCart({ items: [{ productId: "p1", quantity: 4 }] });
    expect([q.subtotal, q.shippingFee, q.total]).toEqual([1000, 0, 1000]);
  });

  it("prices pack sizes by id, by label, or the default size", async () => {
    db.products = [product({ variants: [
      { id: "v100", label: "100g", price: 120, salePrice: null, stock: 5 },
      { id: "v500", label: "500g", price: 500, salePrice: 450, stock: 1 },
    ] })];
    expect((await priceCart({ items: [{ productId: "p1", variantId: "v500", quantity: 1 }] })).lines[0]).toMatchObject({ unitPrice: 450, weight: "500g", variantId: "v500" });
    expect((await priceCart({ items: [{ productId: "p1", weight: "500g", quantity: 1 }] })).lines[0].variantId).toBe("v500");
    expect((await priceCart({ items: [{ productId: "p1", quantity: 1 }] })).lines[0].variantId).toBe("v100");
    await expect(priceCart({ items: [{ productId: "p1", variantId: "v500", quantity: 2 }] })).rejects.toThrow("Only 1 left of Cumin (500g)");
  });

  it("counts the same product across cart lines against stock", async () => {
    db.products = [product({ stock: 3 })];
    await expect(priceCart({ items: [{ productId: "p1", quantity: 2 }, { productId: "p1", quantity: 2 }] })).rejects.toBeInstanceOf(CheckoutError);
  });

  it("rejects drafts, archived and unknown products", async () => {
    db.products = [product({ status: "DRAFT" })];
    await expect(priceCart({ items: [{ productId: "p1", quantity: 1 }] })).rejects.toThrow("no longer available");
    await expect(priceCart({ items: [{ productId: "nope", quantity: 1 }] })).rejects.toThrow("no longer available");
  });

  it("rejects silly quantities", async () => {
    for (const quantity of [0, -1, 1.5, 51]) {
      await expect(priceCart({ items: [{ productId: "p1", quantity }] })).rejects.toBeInstanceOf(CheckoutError);
    }
  });

  it("applies percentage coupons with a cap, and never below zero", async () => {
    db.coupons.SAVE10 = coupon({ discountValue: 50, maxDiscount: 100 });
    expect((await priceCart({ items: [{ productId: "p1", quantity: 2 }], couponCode: "save10" })).couponDiscount).toBe(100);
    db.coupons.BIG = coupon({ code: "BIG", discountType: "FIXED", discountValue: 5000 });
    expect((await priceCart({ items: [{ productId: "p1", quantity: 1 }], couponCode: "BIG" })).couponDiscount).toBe(300);
  });

  it("reports coupon problems instead of silently ignoring them", async () => {
    db.coupons.OLD = coupon({ code: "OLD", expiryDate: new Date("2020-01-01") });
    db.coupons.MIN = coupon({ code: "MIN", minPurchase: 5000 });
    db.coupons.DONE = coupon({ code: "DONE", usageLimit: 5, usedCount: 5 });
    db.coupons.ONCE = coupon({ code: "ONCE", perUserLimit: 1 });
    db.coupons.FIRST = coupon({ code: "FIRST", firstOrderOnly: true });
    const q = (code: string, customer?: any) => priceCart({ items: [{ productId: "p1", quantity: 1 }], couponCode: code, customer });
    expect((await q("NOPE")).couponError).toBe("Invalid coupon code.");
    expect((await q("OLD")).couponError).toBe("This coupon has expired.");
    expect((await q("MIN")).couponError).toContain("Minimum purchase");
    expect((await q("DONE")).couponError).toBe("This coupon has been fully redeemed.");
    db.couponUses = 1;
    expect((await q("ONCE", { email: "a@b.com" })).couponError).toBe("You've already used this coupon.");
    db.priorOrders = 2;
    expect((await q("FIRST", { email: "a@b.com" })).couponError).toBe("This coupon is only valid on your first order.");
  });

  it("converts loyalty points at 10 points = ₹1, capped by the order value", async () => {
    let q = await priceCart({ items: [{ productId: "p1", quantity: 1 }], usePoints: true, userPoints: 1234 });
    expect([q.pointsDiscount, q.pointsToDeduct]).toEqual([123, 1230]);
    q = await priceCart({ items: [{ productId: "p1", quantity: 1 }], usePoints: true, userPoints: 99999 });
    expect([q.pointsDiscount, q.pointsToDeduct]).toEqual([300, 3000]);
    q = await priceCart({ items: [{ productId: "p1", quantity: 1 }], usePoints: false, userPoints: 99999 });
    expect(q.pointsDiscount).toBe(0);
  });

  it("re-prices custom blends on the server", async () => {
    const blend = { blendName: "Mine", base: "cumin", heat: "ghost", aromatic: "nutmeg", basePct: 50, heatPct: 30, aromaticPct: 20 };
    const q = await priceCart({ items: [{ productId: "custom-1", quantity: 1, price: 0.01, blend }] });
    expect(q.lines[0]).toMatchObject({ productId: null, unitPrice: 439 });
    await expect(priceCart({ items: [{ productId: "custom-1", quantity: 1, price: 0.01 }] })).rejects.toThrow("custom blend");
  });
});
