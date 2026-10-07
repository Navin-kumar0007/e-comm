import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { priceCart, CheckoutError } from "@/lib/pricing";
import { checkDelivery } from "@/lib/shipping/service";
import { adjustStock, notifyLowStock, StockError, type StockResult } from "@/lib/inventory";
import {
  getRazorpay,
  mockPaymentsAllowed,
  toPaise,
  allocateInvoiceNumber,
  creditOrderRewards,
  sendOrderConfirmedNotifications,
  releaseOrderReservation,
} from "@/lib/orders";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_RE = /^[1-9][0-9]{5}$/;

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseShipping(raw: any) {
  const name = cleanText(raw?.name, 80);
  const email = cleanText(raw?.email, 120).toLowerCase();
  let phone = cleanText(raw?.phone, 20).replace(/\D/g, "");
  if (phone.length === 12 && phone.startsWith("91")) phone = phone.slice(2);
  const address = cleanText(raw?.address, 250);
  const city = cleanText(raw?.city, 60);
  const state = cleanText(raw?.state, 60);
  const pincode = cleanText(raw?.pincode, 6);

  if (name.length < 2) throw new CheckoutError("Please enter your full name.");
  if (!EMAIL_RE.test(email)) throw new CheckoutError("Please enter a valid email address.");
  if (!/^[6-9][0-9]{9}$/.test(phone)) throw new CheckoutError("Please enter a valid 10-digit Indian mobile number.");
  if (address.length < 5) throw new CheckoutError("Please enter your full street address.");
  if (!city || !state) throw new CheckoutError("Please enter your city and state.");
  if (!PINCODE_RE.test(pincode)) throw new CheckoutError("Please enter a valid 6-digit pincode.");

  return { name, email, phone, address, city, state, pincode };
}

export async function POST(req: Request) {
  const { allowed } = rateLimit(clientKey(req, "checkout"), 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
  }

  let reservedOrderId: string | null = null;
  try {
    const session = await auth();
    const user = session?.user?.email
      ? await prisma.user.findUnique({ where: { email: session.user.email } })
      : null;

    const body = await req.json();
    const isCod = body.paymentMethod === "cod";
    const shipping = parseShipping(body.shippingDetails);

    const razorpay = getRazorpay();
    if (!isCod && !razorpay && !mockPaymentsAllowed()) {
      return NextResponse.json({ error: "Online payment is temporarily unavailable. Please choose Cash on Delivery." }, { status: 503 });
    }

    const quote = await priceCart({
      items: body.items,
      couponCode: body.couponCode,
      usePoints: body.usePoints,
      userPoints: user?.points ?? 0,
      customer: { userId: user?.id, email: shipping.email },
    });
    // Don't silently charge more than the customer expected.
    if (quote.couponError) throw new CheckoutError(quote.couponError);
    const delivery = await checkDelivery(shipping.pincode, { orderValue: quote.total });
    if (!delivery.serviceable) throw new CheckoutError("Sorry, we don't deliver to this pincode yet.");
    if (isCod && !delivery.codAvailable) {
      throw new CheckoutError("Cash on Delivery isn't available for this pincode or order value. Please pay online.");
    }
    if (!isCod && quote.total < 1) {
      throw new CheckoutError("Online payments must be at least ₹1. Please use fewer points or choose Cash on Delivery.");
    }

    const stockResults: Array<StockResult | null> = [];
    const order = await prisma.$transaction(async (tx: any) => {
      // Points: only deduct if the balance still covers it (guards concurrent checkouts).
      if (user && quote.pointsToDeduct > 0) {
        const res = await tx.user.updateMany({
          where: { id: user.id, points: { gte: quote.pointsToDeduct } },
          data: { points: { decrement: quote.pointsToDeduct } },
        });
        if (res.count === 0) throw new CheckoutError("Your points balance changed. Please review your order.", 409);
      }

      // Coupon redemption counter (atomic, so a limited coupon can't be over-used).
      if (quote.appliedCouponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: quote.appliedCouponCode } });
        const res = await tx.coupon.updateMany({
          where: { code: quote.appliedCouponCode, ...(coupon?.usageLimit != null ? { usedCount: { lt: coupon.usageLimit } } : {}) },
          data: { usedCount: { increment: 1 } },
        });
        if (res.count === 0) throw new CheckoutError("This coupon has just been fully redeemed.", 409);
      }

      // Custom blends become hidden (status CUSTOM) products so order history can reference them.
      const orderItems = [];
      let blendCategoryId: string | null = null;
      for (const line of quote.lines) {
        let productId = line.productId;
        if (!productId) {
          if (!blendCategoryId) {
            const category = await tx.category.upsert({
              where: { slug: "custom-blends" },
              update: {},
              create: { name: "Custom Blends", slug: "custom-blends", description: "Signature bespoke formulations" },
            });
            blendCategoryId = category.id;
          }
          const id = `custom-${crypto.randomUUID()}`;
          await tx.product.create({
            data: {
              id,
              name: line.name,
              slug: id,
              description: "Custom Spice Blend formulation.",
              price: line.unitPrice,
              images: JSON.stringify(["https://placehold.co/600x400.png?text=Custom+Spice+Blend"]),
              weight: line.weight,
              stock: 0,
              status: "CUSTOM",
              categoryId: blendCategoryId,
              tags: "custom,spice,blend",
            },
          });
          productId = id;
        }
        orderItems.push({
          productId,
          variantId: line.variantId ?? null,
          productName: line.name,
          quantity: line.quantity,
          price: line.unitPrice,
          weight: line.weight,
          hsnCode: line.hsnCode,
          gstRate: line.gstRate,
        });
      }

      const created = await tx.order.create({
        data: {
          userId: user?.id ?? null,
          status: isCod ? "PROCESSING" : "PENDING",
          paymentMethod: isCod ? "COD" : "ONLINE",
          subtotal: quote.subtotal,
          discount: quote.couponDiscount + quote.pointsDiscount,
          couponCode: quote.appliedCouponCode,
          pointsUsed: quote.pointsToDeduct,
          shippingFee: quote.shippingFee,
          taxAmount: quote.taxAmount,
          total: quote.total,
          customerName: shipping.name,
          customerEmail: shipping.email,
          customerPhone: shipping.phone,
          shippingAddress: `${shipping.address}, ${shipping.city}, ${shipping.state}, ${shipping.pincode}`,
          shippingState: shipping.state,
          invoiceNumber: isCod ? await allocateInvoiceNumber(tx) : null,
          cashbackPending: !!user,
          items: { create: orderItems },
        },
      });

      // Stock: guarded decrement so two buyers can't both take the last unit; every change is logged.
      for (const line of quote.lines) {
        if (!line.productId) continue;
        try {
          stockResults.push(
            await adjustStock(tx, {
              productId: line.productId,
              variantId: line.variantId,
              delta: -line.quantity,
              reason: "SALE",
              orderId: created.id,
              actor: user ? `customer:${user.email}` : `guest:${shipping.email}`,
            })
          );
        } catch (e) {
          if (e instanceof StockError) throw new CheckoutError(`${line.name} (${line.weight}) just sold out. Please update your cart.`, 409);
          throw e;
        }
      }

      if (isCod) await creditOrderRewards(tx, created);
      return created;
    }, { timeout: 15000, maxWait: 5000 });

    await notifyLowStock(stockResults);

    const breakdown = {
      subtotal: quote.subtotal,
      discount: quote.couponDiscount + quote.pointsDiscount,
      shipping: quote.shippingFee,
      tax: quote.taxAmount,
      total: quote.total,
    };

    if (isCod) {
      await sendOrderConfirmedNotifications(order.id);
      return NextResponse.json({ success: true, orderId: order.id, ...breakdown });
    }

    // Online payment: from here on, any failure must release the reservation.
    reservedOrderId = order.id;

    if (!razorpay) {
      // Local/dev mock (mockPaymentsAllowed() was checked above).
      const mockId = `mock_rzp_${order.id}`;
      await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: mockId } });
      return NextResponse.json({ success: true, orderId: order.id, razorpayOrderId: mockId, amount: toPaise(quote.total), ...breakdown });
    }

    const rzpOrder = await razorpay.orders.create({
      amount: toPaise(quote.total),
      currency: "INR",
      receipt: order.id,
      notes: { orderId: order.id },
    });
    // Bind the Razorpay order to ours; verify + webhook only accept this id.
    await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzpOrder.id } });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      ...breakdown,
    });
  } catch (error: any) {
    if (reservedOrderId) {
      await releaseOrderReservation(reservedOrderId, "CANCELLED").catch((e) =>
        console.error("[Checkout] Failed to release reservation:", e)
      );
    }
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Checkout] Unexpected error:", error);
    return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 500 });
  }
}
