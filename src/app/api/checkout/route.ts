import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { Prisma, Product } from "@prisma/client";
import Razorpay from "razorpay";
import { sendOrderConfirmation } from "@/lib/email";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "mock_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_key_secret",
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items, shippingDetails, paymentMethod, couponCode, usePoints } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Basic per-item shape validation.
    for (const item of items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // Ensure a default category exists for custom blends.
    let defaultCategory = await prisma.category.findFirst();
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: "Custom Blends",
          slug: "custom-blends",
          description: "Signature bespoke formulations",
        },
      });
    }

    // Persist any custom-blend products so orders can reference them.
    for (const item of items) {
      if (item.productId.startsWith("custom-")) {
        const exists = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!exists) {
          await prisma.product.create({
            data: {
              id: item.productId,
              name: item.name || "Custom Spice Blend",
              slug: item.slug || item.productId,
              description: "Custom Spice Blend formulation.",
              price: Number(item.price) || 0,
              images: JSON.stringify([
                item.image || "https://placehold.co/600x400.png?text=Custom+Spice+Blend",
              ]),
              stock: 9999,
              status: "ACTIVE",
              categoryId: defaultCategory.id,
              tags: "custom,spice,blend",
            },
          });
        }
      }
    }

    // Resolve authoritative prices from the DB (never trust client prices for
    // catalogue products). Custom blends fall back to their created price.
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const priceById = new Map<string, Product>(
      dbProducts.map((p: Product) => [p.id, p] as const)
    );

    let subtotal = 0;
    const orderItems: Array<{ productId: string; quantity: number; price: number; weight: string }> = [];
    for (const item of items) {
      const product = priceById.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      // Enforce stock for catalogue products.
      if (!item.productId.startsWith("custom-") && product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 409 }
        );
      }
      const unitPrice = (product as any).salePrice ?? product.price;
      subtotal += unitPrice * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: unitPrice,
        weight: item.weight || "150g",
      });
    }

    // Loyalty points discount (validated, applied inside the transaction).
    let discount = 0;
    let pointsToDeduct = 0;
    if (usePoints && user.points > 0) {
      const maxPointsDiscount = Math.floor(user.points / 10);
      const applicablePointsDiscount = Math.min(maxPointsDiscount, subtotal);
      discount += applicablePointsDiscount;
      pointsToDeduct = applicablePointsDiscount * 10;
    }

    // Coupon (validate active + expiry + minimum purchase).
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.active) {
        const notExpired = !coupon.expiryDate || new Date() <= coupon.expiryDate;
        const meetsMin = !coupon.minPurchase || subtotal >= coupon.minPurchase;
        if (notExpired && meetsMin) {
          discount +=
            coupon.discountType === "PERCENTAGE"
              ? subtotal * (coupon.discountValue / 100)
              : coupon.discountValue;
        }
      }
    }

    const finalTotal = Math.max(0, subtotal - discount);

    const name = shippingDetails?.name || user.name || "Customer";
    const email = shippingDetails?.email || user.email || "customer@example.com";
    const phone = shippingDetails?.phone || "0000000000";
    const address = shippingDetails?.address || "Address";
    const city = shippingDetails?.city || "City";
    const state = shippingDetails?.state || "State";
    const pincode = shippingDetails?.pincode || "000000";

    // Create the order (and deduct points atomically) in a single transaction.
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (pointsToDeduct > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: { points: { decrement: pointsToDeduct } },
        });
      }
      return tx.order.create({
        data: {
          userId: user.id,
          total: finalTotal,
          status: paymentMethod === "cod" ? "PROCESSING" : "PENDING",
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: `${address}, ${city}, ${state}, ${pincode}`,
          items: { create: orderItems },
        },
      });
    });

    if (paymentMethod === "cod") {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: Math.floor(finalTotal * 0.05) } },
        }),
        prisma.notification.create({
          data: {
            userId: user.id,
            title: "Order Placed Successfully",
            message: `Your Cash on Delivery order #${order.id} is confirmed.`,
            type: "ORDER",
            link: "/account/orders",
          },
        }),
      ]);
      await sendOrderConfirmation(email, order.id, finalTotal);
      return NextResponse.json({ success: true, orderId: order.id });
    }

    // Online payment via Razorpay.
    const options = {
      amount: Math.round(finalTotal * 100),
      currency: "INR",
      receipt: order.id,
    };

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== "rzp_test_mockedkey123") {
      const rzpOrder = await razorpay.orders.create(options);
      return NextResponse.json({
        success: true,
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
      });
    } else {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        razorpayOrderId: "mock_rzp_" + order.id,
        amount: options.amount,
      });
    }
  } catch (error: any) {
    console.error("Checkout Error:", error?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
