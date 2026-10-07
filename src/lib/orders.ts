import { after } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/db/prisma";
import { sendOrderConfirmation, notifyAdminNewOrder } from "@/lib/email";
import { sendWhatsAppMessage, buildOrderConfirmationWhatsAppMessage } from "@/lib/whatsapp";
import { getStoreSettings } from "@/lib/store-settings";
import { logOrderEvent } from "@/lib/order-events";
import { adjustStock } from "@/lib/inventory";

/** Gives a coupon use back when an order never completes (inside a tx). */
export async function releaseCouponUse(tx: any, couponCode: string | null) {
  if (!couponCode) return;
  await tx.coupon.updateMany({ where: { code: couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
}

/** How long an unpaid online order keeps its stock reserved. */
export const PAYMENT_WINDOW_MINUTES = 30;

export function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id === "rzp_test_mockedkey123") return null;
  return new Razorpay({ key_id, key_secret });
}

/** Mock payments: never in production, and only when explicitly enabled. */
export function mockPaymentsAllowed() {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_PAYMENTS === "true";
}

export function toPaise(amount: number) {
  return Math.round(amount * 100);
}

/** Indian financial year label (April–March, IST), e.g. "2026-27". */
function financialYear(date = new Date()) {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** Allocates the next sequential GST invoice number inside a transaction. */
export async function allocateInvoiceNumber(tx: any) {
  const fy = financialYear();
  const counter = await tx.invoiceCounter.upsert({
    where: { id: fy },
    create: { id: fy, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  const { invoicePrefix } = await getStoreSettings();
  return `${invoicePrefix}/${fy}/${String(counter.seq).padStart(5, "0")}`;
}

/**
 * Customer + admin notifications after an order is confirmed (COD placed or
 * online payment captured). Failures are logged, never thrown.
 */
export async function sendOrderConfirmedNotifications(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  const paymentLabel = order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment (Prepaid)";

  try {
    await sendOrderConfirmation(order.customerEmail, order.id, order.total);
  } catch (e) {
    console.error("Order confirmation email failed:", e);
  }

  if (order.customerPhone) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spicynuts.in";
      const message = buildOrderConfirmationWhatsAppMessage({
        orderId: order.id,
        customerName: order.customerName,
        total: order.total,
        paymentMethod: paymentLabel,
        items: order.items.map((i: any) => ({ name: i.productName, quantity: i.quantity, weight: i.weight })),
        trackingUrl: `${siteUrl}/track/${order.id}`,
      });
      await sendWhatsAppMessage({
        to: order.customerPhone,
        message,
        type: "ORDER_UPDATE",
        template: {
          key: "order_confirmed",
          params: [order.customerName, order.id.slice(-8).toUpperCase(), order.total.toFixed(0), paymentLabel, `${siteUrl}/track/${order.id}`],
        },
      });
    } catch (e) {
      console.error("WhatsApp order confirmation failed:", e);
    }
  }

  try {
    await notifyAdminNewOrder(order.id, order.total, order.customerName, order.paymentMethod);
  } catch (e) {
    console.error("Admin new-order notification failed:", e);
  }

  // Courier booking runs after the response so checkout / payment callbacks stay fast.
  const book = async () => {
    const { autoBookShipment } = await import("@/lib/shipping/service"); // dynamic: avoids an import cycle
    await autoBookShipment(order.id);
  };
  try {
    after(book);
  } catch {
    await book(); // called outside a request (scripts / tests)
  }
}

/**
 * In-app notification for a confirmed order (inside a tx). Cashback is NOT
 * credited here — it's credited on delivery (see lib/order-status.ts), so
 * cancelled / refused COD orders never earn points.
 */
export async function creditOrderRewards(tx: any, order: { id: string; userId: string | null; total: number; paymentMethod: string }) {
  await logOrderEvent(tx, {
    orderId: order.id,
    type: "PAYMENT",
    toStatus: "PROCESSING",
    message: order.paymentMethod === "COD" ? "Cash on Delivery order placed" : "Online payment received",
    actor: "system",
  });
  if (!order.userId) return;
  await tx.notification.create({
    data: {
      userId: order.userId,
      title: order.paymentMethod === "COD" ? "Order Placed Successfully" : "Payment Successful",
      message:
        order.paymentMethod === "COD"
          ? `Your Cash on Delivery order #${order.id.slice(-8).toUpperCase()} is confirmed.`
          : `Your payment for order #${order.id.slice(-8).toUpperCase()} was successful. We are now processing it.`,
      type: "ORDER",
      link: "/account/orders",
    },
  });
}

export type MarkPaidResult =
  | { ok: true; orderId: string; alreadyProcessed: boolean }
  | { ok: false; reason: "NOT_FOUND" | "ORDER_CLOSED" };

/**
 * Marks an online order as paid. Idempotent and safe to call from both the
 * browser verify step and the Razorpay webhook. The caller MUST have already
 * verified the payment (signature + amount + Razorpay order id).
 */
export async function markOrderPaid(params: { orderId: string; razorpayOrderId: string; paymentId: string }): Promise<MarkPaidResult> {
  const result: MarkPaidResult = await prisma.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({ where: { id: params.orderId }, include: { items: true } });
    if (!order) return { ok: false, reason: "NOT_FOUND" } as const;

    if (["PROCESSING", "CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status)) {
      return { ok: true, orderId: order.id, alreadyProcessed: true } as const;
    }
    if (order.status !== "PENDING" && order.status !== "EXPIRED") {
      // Paid after being cancelled/deleted — needs a manual refund.
      console.error(`[PAYMENT] Payment ${params.paymentId} captured for ${order.status} order ${order.id}. Refund required.`);
      return { ok: false, reason: "ORDER_CLOSED" } as const;
    }

    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: "PROCESSING",
        razorpayOrderId: params.razorpayOrderId,
        paymentId: params.paymentId,
        paidAt: new Date(),
      },
    });
    if (claimed.count === 0) return { ok: true, orderId: order.id, alreadyProcessed: true } as const;

    if (!order.invoiceNumber) {
      await tx.order.update({ where: { id: order.id }, data: { invoiceNumber: await allocateInvoiceNumber(tx) } });
    }

    if (order.status === "EXPIRED") {
      // Customer paid after the reservation lapsed: re-reserve what was released.
      console.warn(`[PAYMENT] Late payment for expired order ${order.id}; re-reserving stock.`);
      for (const item of order.items) {
        if (item.productId) {
          await adjustStock(tx, { productId: item.productId, variantId: item.variantId, delta: -item.quantity, reason: "SALE", orderId: order.id, actor: "system", note: "Late payment after expiry", force: true });
        }
      }
      if (order.userId && order.pointsUsed > 0) {
        await tx.user.updateMany({
          where: { id: order.userId, points: { gte: order.pointsUsed } },
          data: { points: { decrement: order.pointsUsed } },
        });
      }
    }

    await creditOrderRewards(tx, order);
    return { ok: true, orderId: order.id, alreadyProcessed: false } as const;
  });

  if (result.ok && !result.alreadyProcessed) {
    await sendOrderConfirmedNotifications(result.orderId);
  }

  if (!result.ok && result.reason === "ORDER_CLOSED") {
    // Customer paid for an order that was already cancelled: give the money back automatically.
    const order = await prisma.order.findUnique({ where: { id: params.orderId } });
    if (order && !order.paymentId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: params.paymentId, razorpayOrderId: params.razorpayOrderId, paidAt: new Date() },
      });
      const { issueRefund } = await import("@/lib/refunds"); // dynamic: refunds.ts imports this file
      const refund = await issueRefund({ orderId: order.id, reason: "Payment received after order was closed", actor: "system" });
      if (!refund.ok) console.error(`[PAYMENT] Auto-refund failed for closed order ${order.id}: ${refund.error}`);
    }
  }
  return result;
}

/**
 * Returns reserved stock and redeemed points for an order that will never be
 * paid, moving it to `newStatus`. Only acts on PENDING orders, so it can't
 * double-release.
 */
export async function releaseOrderReservation(orderId: string, newStatus: "EXPIRED" | "CANCELLED" = "EXPIRED") {
  return prisma.$transaction(async (tx: any) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING", paymentId: null },
      data: { status: newStatus, cashbackPending: false },
    });
    if (claimed.count === 0) return false;
    await logOrderEvent(tx, {
      orderId,
      type: "STATUS",
      fromStatus: "PENDING",
      toStatus: newStatus,
      message: newStatus === "EXPIRED" ? "Payment not completed in time — stock released" : "Checkout failed — stock released",
      actor: "system",
    });

    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    for (const item of order.items) {
      if (item.productId) {
        await adjustStock(tx, { productId: item.productId, variantId: item.variantId, delta: item.quantity, reason: "RELEASE", orderId, actor: "system" });
      }
    }
    await releaseCouponUse(tx, order.couponCode);
    if (order.userId && order.pointsUsed > 0) {
      await tx.user.update({ where: { id: order.userId }, data: { points: { increment: order.pointsUsed } } });
    }
    return true;
  });
}

/**
 * Expires unpaid online orders older than the payment window. Before expiring,
 * asks Razorpay whether the order was actually paid (covers missed webhooks).
 */
export async function releaseStaleOrders(limit = 25) {
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_MINUTES * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", paymentMethod: "ONLINE", paymentId: null, createdAt: { lt: cutoff } },
    select: { id: true, total: true, razorpayOrderId: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const razorpay = getRazorpay();
  let expired = 0;
  let recovered = 0;

  for (const order of stale) {
    try {
      if (razorpay && order.razorpayOrderId) {
        const payments: any = await razorpay.orders.fetchPayments(order.razorpayOrderId);
        const items: any[] = payments?.items ?? [];
        const captured = items.find((p) => p.status === "captured" && p.amount === toPaise(order.total));
        if (captured) {
          await markOrderPaid({ orderId: order.id, razorpayOrderId: order.razorpayOrderId, paymentId: captured.id });
          recovered++;
          continue;
        }
        // Money is blocked but not captured yet — don't expire, check again later.
        if (items.some((p) => p.status === "authorized")) continue;
      }
      if (await releaseOrderReservation(order.id, "EXPIRED")) expired++;
    } catch (e) {
      console.error(`[STALE ORDERS] Failed to process ${order.id}:`, e);
    }
  }

  return { checked: stale.length, expired, recovered };
}
