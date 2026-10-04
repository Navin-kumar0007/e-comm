import { prisma } from "@/lib/db/prisma";
import { getRazorpay, toPaise } from "@/lib/orders";
import { logOrderEvent } from "@/lib/order-events";
import { sendRefundInitiated } from "@/lib/email";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Money actually received for an order (online: once paid; COD: once delivered/collected). */
export function amountPaid(order: { paymentMethod: string; paymentId: string | null; paidAt: Date | null; status: string; total: number }) {
  if (order.paymentMethod === "ONLINE") return order.paymentId ? order.total : 0;
  // COD: collected on delivery (older orders have no paidAt, so fall back to status).
  return order.paidAt || ["DELIVERED", "RETURNED"].includes(order.status) ? order.total : 0;
}

export type RefundResult = { ok: true; refundId: string; status: string } | { ok: false; error: string };

/**
 * Refunds (part of) an order.
 * - Online orders: refunded through Razorpay to the original payment method.
 * - COD orders: recorded as a MANUAL refund for the admin to pay by UPI/bank and mark processed.
 */
export async function issueRefund(params: { orderId: string; amount?: number; reason: string; actor: string }): Promise<RefundResult> {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order) return { ok: false, error: "Order not found" };

  const refundable = round2(amountPaid(order) - order.refundedAmount);
  const amount = round2(params.amount ?? refundable);
  if (refundable <= 0) return { ok: false, error: "Nothing left to refund on this order." };
  if (!(amount > 0) || amount > refundable) return { ok: false, error: `Refund must be between ₹0.01 and ₹${refundable.toFixed(2)}.` };

  const method = order.paymentMethod === "ONLINE" ? "RAZORPAY" : "MANUAL";

  // Reserve the amount first (optimistic lock on refundedAmount) so two clicks can't double-refund.
  const reserved = await prisma.order.updateMany({
    where: { id: order.id, refundedAmount: order.refundedAmount },
    data: { refundedAmount: { increment: amount } },
  });
  if (reserved.count === 0) return { ok: false, error: "Order was updated at the same time. Please retry." };

  const refund = await prisma.refund.create({
    data: { orderId: order.id, amount, method, status: "PENDING", reason: params.reason.slice(0, 500), actor: params.actor },
  });

  if (method === "RAZORPAY") {
    const isMock = !order.paymentId || order.paymentId.startsWith("pay_mock") || order.razorpayOrderId?.startsWith("mock_rzp_");
    const razorpay = getRazorpay();
    try {
      if (isMock) {
        await prisma.refund.update({ where: { id: refund.id }, data: { status: "PROCESSED", razorpayRefundId: `rfnd_mock_${refund.id}` } });
      } else {
        if (!razorpay) throw new Error("Razorpay is not configured");
        const rzpRefund: any = await razorpay.payments.refund(order.paymentId!, {
          amount: toPaise(amount),
          notes: { orderId: order.id, refundId: refund.id },
        });
        await prisma.refund.update({
          where: { id: refund.id },
          data: { razorpayRefundId: rzpRefund.id, status: rzpRefund.status === "processed" ? "PROCESSED" : "PENDING" },
        });
      }
    } catch (e: any) {
      console.error(`[REFUND] Razorpay refund failed for order ${order.id}:`, e);
      await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED" } });
      await prisma.order.update({ where: { id: order.id }, data: { refundedAmount: { decrement: amount } } });
      const detail = e?.error?.description || e?.message || "unknown error";
      await logOrderEvent(null, { orderId: order.id, type: "REFUND", message: `Refund of ₹${amount} failed: ${detail}`, actor: params.actor });
      return { ok: false, error: `Razorpay refund failed: ${detail}` };
    }
  }

  await logOrderEvent(null, {
    orderId: order.id,
    type: "REFUND",
    message: `Refund of ₹${amount.toFixed(2)} ${method === "RAZORPAY" ? "initiated via Razorpay" : "recorded (pay manually via UPI/bank)"} — ${params.reason}`,
    actor: params.actor,
  });

  try {
    await sendRefundInitiated(order.customerEmail, order.id, amount, method);
  } catch (e) {
    console.error("Refund email failed:", e);
  }

  if (order.userId) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Refund Initiated",
        message: `A refund of ₹${amount.toFixed(2)} for order #${order.id.slice(-8).toUpperCase()} has been initiated.`,
        type: "ORDER",
        link: "/account/orders",
      },
    });
  }

  const final = await prisma.refund.findUnique({ where: { id: refund.id } });
  return { ok: true, refundId: refund.id, status: final?.status ?? "PENDING" };
}

/** Admin confirms a manual (COD) refund was paid. */
export async function markManualRefundProcessed(refundId: string, reference: string, actor: string) {
  const refund = await prisma.refund.findUnique({ where: { id: refundId } });
  if (!refund || refund.method !== "MANUAL" || refund.status !== "PENDING") return { ok: false as const, error: "Refund not found or already processed" };
  await prisma.refund.update({ where: { id: refundId }, data: { status: "PROCESSED", reference: reference.slice(0, 100) } });
  await logOrderEvent(null, {
    orderId: refund.orderId,
    type: "REFUND",
    message: `Manual refund of ₹${refund.amount.toFixed(2)} paid${reference ? ` (ref ${reference})` : ""}`,
    actor,
  });
  return { ok: true as const };
}

/** Razorpay refund webhook: refund.processed / refund.failed. */
export async function applyRazorpayRefundEvent(razorpayRefundId: string, event: "refund.processed" | "refund.failed") {
  const refund = await prisma.refund.findFirst({ where: { razorpayRefundId } });
  if (!refund || refund.status !== "PENDING") return;
  if (event === "refund.processed") {
    await prisma.refund.update({ where: { id: refund.id }, data: { status: "PROCESSED" } });
    await logOrderEvent(null, { orderId: refund.orderId, type: "REFUND", message: `Refund of ₹${refund.amount.toFixed(2)} processed by Razorpay`, actor: "system" });
  } else {
    await prisma.$transaction([
      prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED" } }),
      prisma.order.update({ where: { id: refund.orderId }, data: { refundedAmount: { decrement: refund.amount } } }),
    ]);
    await logOrderEvent(null, { orderId: refund.orderId, type: "REFUND", message: `Refund of ₹${refund.amount.toFixed(2)} FAILED at Razorpay — retry from admin`, actor: "system" });
  }
}
