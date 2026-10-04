import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getRazorpay, mockPaymentsAllowed, markOrderPaid, toPaise } from "@/lib/orders";

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json();
    if (typeof orderId !== "string" || typeof razorpay_order_id !== "string" || typeof razorpay_payment_id !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentMethod !== "ONLINE" || !order.razorpayOrderId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // The payment must be for the Razorpay order we created for THIS order.
    // Without this, a valid signature from a cheap order could confirm an expensive one.
    if (razorpay_order_id !== order.razorpayOrderId) {
      return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
    }

    const razorpay = getRazorpay();
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpay || !secret) {
      if (!(mockPaymentsAllowed() && order.razorpayOrderId.startsWith("mock_rzp_"))) {
        console.error("Payment verification blocked: Razorpay is not configured.");
        return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
      }
    } else {
      const expected = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      if (typeof razorpay_signature !== "string" || !safeEqual(expected, razorpay_signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }

      // Confirm with Razorpay that this payment really is for our order and amount.
      let payment: any = await razorpay.payments.fetch(razorpay_payment_id);
      if (payment.order_id !== order.razorpayOrderId || Number(payment.amount) !== toPaise(order.total)) {
        console.error(`[VERIFY] Payment ${razorpay_payment_id} mismatch for order ${order.id}`);
        return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
      }
      if (payment.status === "authorized") {
        // Capture now (if auto-capture is off, Razorpay refunds uncaptured payments after a few days).
        try {
          payment = await razorpay.payments.capture(razorpay_payment_id, toPaise(order.total), "INR");
        } catch {
          payment = await razorpay.payments.fetch(razorpay_payment_id);
        }
      }
      if (payment.status !== "captured") {
        return NextResponse.json({ error: "Payment not completed yet. If money was debited, it will be confirmed shortly." }, { status: 402 });
      }
    }

    const result = await markOrderPaid({
      orderId: order.id,
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "This order was closed before payment completed. Your payment will be refunded — please contact support." },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true, orderId: order.id, alreadyProcessed: result.alreadyProcessed });
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
