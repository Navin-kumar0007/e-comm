import { prisma } from "@/lib/db/prisma";
import { parseBlendSpec, blendDisplayName, BLEND_WEIGHT, type BlendSpec } from "@/lib/blend-pricing";
import { getStoreSettings, type StoreSettings } from "@/lib/store-settings";
import { splitGst } from "@/lib/gst";

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
  variantId?: string; // pack size, when the product has sizes
  name: string;
  unitPrice: number;
  quantity: number;
  weight: string;
  blend?: BlendSpec;
  gstRate: number; // % (product's own rate, else store default)
  hsnCode: string | null;
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
  /** Identity for per-customer coupon rules (logged-in user and/or checkout email). */
  customer?: { userId?: string | null; email?: string | null };
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
    ? await prisma.product.findMany({
        where: { id: { in: catalogueIds } },
        include: { variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { price: "asc" }] } },
      })
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
        gstRate: settings.gstRate,
        hsnCode: null,
      });
      continue;
    }

    const product = productById.get(item.productId);
    if (!product || product.status !== "ACTIVE") {
      throw new CheckoutError(`"${item.name || "An item"}" is no longer available. Please remove it from your cart.`);
    }

    // Products with pack sizes: price + stock come from the chosen size
    // (by id, else by label, else the default size).
    const variants: any[] = product.variants ?? [];
    const variant = variants.length
      ? (item.variantId && variants.find((v) => v.id === item.variantId)) ||
        variants.find((v) => v.label === item.weight) ||
        (!item.variantId ? variants[0] : null)
      : null;
    if (variants.length && !variant) {
      throw new CheckoutError(`The selected size of ${product.name} is no longer available. Please remove it from your cart.`);
    }

    const stockKey = variant ? `v:${variant.id}` : product.id;
    const available = variant ? variant.stock : product.stock;
    const label = variant ? `${product.name} (${variant.label})` : product.name;
    const totalQty = (qtyByProduct.get(stockKey) ?? 0) + item.quantity;
    qtyByProduct.set(stockKey, totalQty);
    if (available < totalQty) {
      throw new CheckoutError(
        available > 0 ? `Only ${available} left of ${label}. Please reduce the quantity.` : `${label} is out of stock.`,
        409
      );
    }
    lines.push({
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      unitPrice: variant ? variant.salePrice ?? variant.price : product.salePrice ?? product.price,
      quantity: item.quantity,
      weight: variant ? variant.label : product.weight || item.weight || "Standard",
      gstRate: product.gstRate ?? settings.gstRate,
      hsnCode: product.hsnCode ?? null,
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
    else if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
      couponError = "This coupon has been fully redeemed.";
    else {
      couponError = await customerCouponError(coupon, input.customer);
      if (!couponError) {
        let raw = coupon.discountType === "PERCENTAGE" ? subtotal * (coupon.discountValue / 100) : coupon.discountValue;
        if (coupon.maxDiscount) raw = Math.min(raw, coupon.maxDiscount);
        couponDiscount = round2(Math.min(raw, subtotal));
        appliedCouponCode = coupon.code;
      }
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
  const taxAmount = splitGst({
    lines: lines.map((l) => ({ amount: l.unitPrice * l.quantity, gstRate: l.gstRate })),
    discount: couponDiscount + pointsDiscount,
    shipping: shippingFee,
    defaultRate: gstRate,
  }).taxTotal;

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

const USED_ORDER_STATUSES = { notIn: ["PENDING", "CANCELLED", "EXPIRED", "DELETED"] };

/** Per-customer coupon rules. Guests are checked by email once it's known at checkout. */
async function customerCouponError(
  coupon: { code: string; perUserLimit: number | null; firstOrderOnly: boolean },
  customer?: { userId?: string | null; email?: string | null }
): Promise<string | null> {
  const who = [
    ...(customer?.userId ? [{ userId: customer.userId }] : []),
    ...(customer?.email ? [{ customerEmail: { equals: customer.email, mode: "insensitive" as const } }] : []),
  ];
  if (who.length === 0) return null;

  if (coupon.firstOrderOnly) {
    const previous = await prisma.order.count({ where: { OR: who, status: USED_ORDER_STATUSES } });
    if (previous > 0) return "This coupon is only valid on your first order.";
  }
  if (coupon.perUserLimit) {
    const used = await prisma.order.count({ where: { OR: who, couponCode: coupon.code, status: { notIn: ["CANCELLED", "EXPIRED", "DELETED"] } } });
    if (used >= coupon.perUserLimit) return "You've already used this coupon.";
  }
  return null;
}
