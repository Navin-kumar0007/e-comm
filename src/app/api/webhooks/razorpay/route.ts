import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { markOrderPaid, toPaise } from "@/lib/orders";
import { applyRazorpayRefundEvent } from "@/lib/refunds";

/**
 * Razorpay webhook. Confirms orders even when the customer closes the browser
 * before the in-page verify call runs.
 *
 * Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://<your-domain>/api/webhooks/razorpay
 *   Secret: same value as RAZORPAY_WEBHOOK_SECRET
 *   Events: payment.captured, order.paid, refund.processed, refund.failed
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[RZP WEBHOOK] RAZORPAY_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  if (event.event === "refund.processed" || event.event === "refund.failed") {
    const refundId = event.payload?.refund?.entity?.id;
    if (refundId) {
      try {
        await applyRazorpayRefundEvent(refundId, event.event);
      } catch (e) {
        console.error("[RZP WEBHOOK] Refund event failed:", e);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id || !payment?.id) {
    return NextResponse.json({ ok: true, ignored: "no payment entity" });
  }

  try {
    const order = await prisma.order.findFirst({ where: { razorpayOrderId: payment.order_id } });
    if (!order) {
      console.warn(`[RZP WEBHOOK] No order for Razorpay order ${payment.order_id}`);
      return NextResponse.json({ ok: true, ignored: "unknown order" });
    }
    if (Number(payment.amount) !== toPaise(order.total)) {
      console.error(`[RZP WEBHOOK] Amount mismatch for order ${order.id}: paid ${payment.amount}, expected ${toPaise(order.total)}`);
      return NextResponse.json({ ok: true, ignored: "amount mismatch" });
    }

    const result = await markOrderPaid({ orderId: order.id, razorpayOrderId: payment.order_id, paymentId: payment.id });
    // Gateway fee (incl. GST on the fee), in paise, for profit and GST reports.
    if (payment.fee !== undefined && payment.fee !== null) {
      await prisma.order
        .update({ where: { id: order.id }, data: { paymentFee: Number(payment.fee) / 100, paymentFeeTax: Number(payment.tax ?? 0) / 100 } })
        .catch((e: unknown) => console.error("[RZP WEBHOOK] Saving fee failed:", e));
    }
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    // 5xx makes Razorpay retry later.
    console.error("[RZP WEBHOOK] Processing failed:", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
