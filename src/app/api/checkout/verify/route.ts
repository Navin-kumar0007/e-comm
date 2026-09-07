import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { sendOrderConfirmation, notifyAdminNewOrder } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Explicit, opt-in mock path for local/demo use only. Never active in production.
    const allowMock =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_MOCK_PAYMENTS === "true";

    // Fail closed if payments aren't configured and mock isn't explicitly enabled.
    if (!secret && !allowMock) {
      console.error("Payment verification blocked: RAZORPAY_KEY_SECRET is not configured.");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 503 }
      );
    }

    let signatureValid = false;
    if (secret) {
      const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");
      // Constant-time comparison to avoid timing attacks.
      signatureValid =
        !!razorpay_signature &&
        generated_signature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(
          Buffer.from(generated_signature),
          Buffer.from(razorpay_signature)
        );
    }

    if (signatureValid || allowMock) {
      // Verify the order exists before confirming.
      const existing = await prisma.order.findUnique({ where: { id: orderId } });
      if (!existing) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      let dbUser = null;
      if (session?.user?.email) {
        dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      }

      // If order was placed with an account, ensure caller matches
      if (existing.userId && dbUser && existing.userId !== dbUser.id) {
        console.error("Order verification access denied. Order User ID:", existing.userId, "Session User ID:", dbUser.id);
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Idempotency: if already processed, don't re-award points.
      if (existing.status !== "PENDING") {
        return NextResponse.json({ success: true, alreadyProcessed: true });
      }

      const updates: any[] = [
        prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PROCESSING",
            razorpayOrderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
          },
        }),
      ];

      if (dbUser) {
        updates.push(
          prisma.user.update({
            where: { id: dbUser.id },
            data: { points: { increment: Math.floor(existing.total * 0.05) } }, // 5% cashback
          }),
          prisma.notification.create({
            data: {
              userId: dbUser.id,
              title: "Payment Successful",
              message: `Your payment for order #${existing.id.slice(-8).toUpperCase()} was successful. We are now processing it.`,
              type: "ORDER",
              link: "/account/orders",
            },
          })
        );
      }

      const [order] = await prisma.$transaction(updates);

      try {
        await sendOrderConfirmation(order.customerEmail, order.id, order.total);
      } catch (err) {
        console.error("Failed to send order email:", err);
      }
      // Notify admin of new paid order
      try { await notifyAdminNewOrder(order.id, order.total, order.customerName, "ONLINE"); } catch (e) { console.error("Admin notification failed:", e); }

      return NextResponse.json({ success: true, orderId: order.id });
    } else {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
