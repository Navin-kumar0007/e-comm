import { prisma } from "@/lib/db/prisma";
import { parseBlendSpec, blendDisplayName, BLEND_WEIGHT, type BlendSpec } from "@/lib/blend-pricing";
import { getStoreSettings, type StoreSettings } from "@/lib/store-settings";

/** An error whose message is safe to show to the customer. */
export class CheckoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const POINTS_PER_RUPEE = 10;
const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 50;

export interface PricedLine {
  productId: string | null; // null => custom blend, product row created at order time
  name: string;
  unitPrice: number;
  quantity: number;
  weight: string;
  blend?: BlendSpec;
}

export interface CartQuote {
  lines: PricedLine[];
  subtotal: number;
  couponDiscount: number;
  appliedCouponCode: string | null;
  couponError: string | null;
  pointsDiscount: number;
  pointsToDeduct: number;
  shippingFee: number;
  freeShippingThreshold: number;
  total: number;
  taxAmount: number; // GST contained in total (prices are tax-inclusive)
  gstRate: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Authoritative cart pricing. Used for both the checkout preview and order
 * creation so the customer always sees exactly what they will be charged.
 * Never trusts client-side prices.
 */
export async function priceCart(input: {
  items: unknown;
  couponCode?: unknown;
  usePoints?: unknown;
  userPoints?: number;
  settings?: StoreSettings;
}): Promise<CartQuote> {
  const { items } = input;
  if (!Array.isArray(items) || items.length === 0) throw new CheckoutError("Your cart is empty.");
  if (items.length > MAX_LINES) throw new CheckoutError("Too many items in cart.");

  for (const item of items) {
    if (
      !item ||
      typeof item.productId !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QTY_PER_LINE
    ) {
      throw new CheckoutError("Your cart has an invalid item. Please refresh and try again.");
    }
  }

  const settings = input.settings ?? (await getStoreSettings());

  const catalogueIds = items.filter((i: any) => !i.productId.startsWith("custom-")).map((i: any) => i.productId);
  const products = catalogueIds.length
    ? await prisma.product.findMany({ where: { id: { in: catalogueIds } } })
    : [];
  const productById = new Map<string, any>(products.map((p: any) => [p.id, p]));

  const lines: PricedLine[] = [];
  const qtyByProduct = new Map<string, number>();

  for (const item of items as any[]) {
    if (item.productId.startsWith("custom-")) {
      const parsed = parseBlendSpec(item.blend);
      if (!parsed) {
        throw new CheckoutError("A custom blend in your cart is no longer valid. Please remove it and create it again.");
      }
      lines.push({
        productId: null,
        name: blendDisplayName(parsed.spec),
        unitPrice: parsed.price,
        quantity: item.quantity,
        weight: BLEND_WEIGHT,
        blend: parsed.spec,
      });
      continue;
    }

    const product = productById.get(item.productId);
    if (!product || product.status !== "ACTIVE") {
      throw new CheckoutError(`"${item.name || "An item"}" is no longer available. Please remove it from your cart.`);
    }
    const totalQty = (qtyByProduct.get(product.id) ?? 0) + item.quantity;
    qtyByProduct.set(product.id, totalQty);
    if (product.stock < totalQty) {
      throw new CheckoutError(
        product.stock > 0
          ? `Only ${product.stock} left of ${product.name}. Please reduce the quantity.`
          : `${product.name} is out of stock.`,
        409
      );
    }
    lines.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.salePrice ?? product.price,
      quantity: item.quantity,
      weight: product.weight || item.weight || "Standard",
    });
  }

  const subtotal = round2(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));

  // Coupon
  let couponDiscount = 0;
  let appliedCouponCode: string | null = null;
  let couponError: string | null = null;
  const code = typeof input.couponCode === "string" ? input.couponCode.trim().toUpperCase() : "";
  if (code) {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.active) couponError = "Invalid coupon code.";
    else if (coupon.expiryDate && new Date() > coupon.expiryDate) couponError = "This coupon has expired.";
    else if (coupon.minPurchase && subtotal < coupon.minPurchase)
      couponError = `Minimum purchase of ₹${coupon.minPurchase} required for this coupon.`;
    else {
      const raw = coupon.discountType === "PERCENTAGE" ? subtotal * (coupon.discountValue / 100) : coupon.discountValue;
      couponDiscount = round2(Math.min(raw, subtotal));
      appliedCouponCode = coupon.code;
    }
  }

  // Loyalty points (whole rupees only)
  let pointsDiscount = 0;
  let pointsToDeduct = 0;
  const userPoints = input.userPoints ?? 0;
  if (input.usePoints === true && userPoints > 0) {
    const maxRupees = Math.floor(userPoints / POINTS_PER_RUPEE);
    pointsDiscount = Math.max(0, Math.min(maxRupees, Math.floor(subtotal - couponDiscount)));
    pointsToDeduct = pointsDiscount * POINTS_PER_RUPEE;
  }

  const merchandise = round2(subtotal - couponDiscount - pointsDiscount);
  const shippingFee = merchandise >= settings.freeShippingThreshold ? 0 : round2(settings.flatShippingRate);
  const total = round2(merchandise + shippingFee);
  const gstRate = settings.gstRate;
  const taxAmount = round2((total * gstRate) / (100 + gstRate));

  return {
    lines,
    subtotal,
    couponDiscount,
    appliedCouponCode,
    couponError,
    pointsDiscount,
    pointsToDeduct,
    shippingFee,
    freeShippingThreshold: settings.freeShippingThreshold,
    total,
    taxAmount,
    gstRate,
  };
}
