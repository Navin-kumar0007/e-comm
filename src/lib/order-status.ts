import { prisma } from "@/lib/db/prisma";
import { canTransition, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status-rules";
import { logOrderEvent } from "@/lib/order-events";
import { adjustStock } from "@/lib/inventory";
import { releaseCouponUse } from "@/lib/orders";
import { issueRefund } from "@/lib/refunds";
import { getProvider } from "@/lib/shipping";
import { CANCELLABLE_SHIPMENT_STATUSES, type ShipmentStatus } from "@/lib/shipping/status";
import { sendOrderShipped, sendOrderDelivered, sendOrderCancelled, siteUrl } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import type { TemplateRef } from "@/lib/whatsapp-templates";

const CASHBACK_RATE = 0.05;

export type TransitionResult = { ok: true; from: string; to: string } | { ok: false; error: string };

/**
 * The ONLY place order status should change (apart from payment confirmation
 * and expiry in lib/orders.ts). Enforces allowed transitions and applies the
 * side effects of each one:
 *
 *   CANCELLED  → stock + redeemed points returned, courier booking cancelled, prepaid refunded
 *   SHIPPED    → shippedAt, customer told (with tracking)
 *   DELIVERED  → deliveredAt, COD marked collected, 5% cashback credited
 *   RTO        → stock + redeemed points returned, prepaid refunded (COD: nothing collected)
 *   RETURNED   → cashback taken back (refund amount is decided in the returns flow)
 */
export async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  opts: { actor: string; reason?: string; refund?: boolean }
): Promise<TransitionResult> {
  const result = await prisma.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return { ok: false, error: "Order not found" } as const;
    const from = order.status;
    if (from === to) return { ok: true, from, to, noop: true } as const;
    if (!canTransition(from, to)) {
      return { ok: false, error: `Can't change an order from ${ORDER_STATUS_LABELS[from as OrderStatus] ?? from} to ${ORDER_STATUS_LABELS[to]}.` } as const;
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: to };
    if (to === "SHIPPED") data.shippedAt = order.shippedAt ?? now;
    if (to === "DELIVERED") {
      data.deliveredAt = now;
      if (order.paymentMethod === "COD" && !order.paidAt) data.paidAt = now;
    }
    if (to === "CANCELLED") {
      data.cancelledAt = now;
      data.cancelReason = opts.reason?.slice(0, 300) || null;
    }
    if (to === "CANCELLED" || to === "RTO") data.cashbackPending = false;

    // Claim the transition (guards against double clicks / concurrent courier updates).
    const claimed = await tx.order.updateMany({ where: { id: orderId, status: from }, data });
    if (claimed.count === 0) return { ok: false, error: "Order was updated at the same time. Please refresh." } as const;

    // Goods come back into stock when the order never left, or came back undelivered.
    if (to === "CANCELLED" || to === "RTO") {
      for (const item of order.items) {
        if (item.productId) {
          await adjustStock(tx, {
            productId: item.productId,
            variantId: item.variantId,
            delta: item.quantity,
            reason: to === "RTO" ? "RTO_RESTOCK" : "CANCEL_RESTOCK",
            orderId,
            actor: opts.actor,
          });
        }
      }
      if (to === "CANCELLED") await releaseCouponUse(tx, order.couponCode);
      if (order.userId && order.pointsUsed > 0) {
        await tx.user.update({ where: { id: order.userId }, data: { points: { increment: order.pointsUsed } } });
      }
    }

    if (to === "DELIVERED" && order.userId && order.cashbackPending) {
      const points = Math.floor(order.total * CASHBACK_RATE);
      await tx.user.update({ where: { id: order.userId }, data: { points: { increment: points } } });
      await tx.order.update({ where: { id: orderId }, data: { cashbackPending: false, cashbackPoints: points } });
    }

    if (to === "RETURNED" && order.userId && order.cashbackPoints > 0) {
      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { points: true } });
      const take = Math.min(user?.points ?? 0, order.cashbackPoints);
      if (take > 0) await tx.user.update({ where: { id: order.userId }, data: { points: { decrement: take } } });
      await tx.order.update({ where: { id: orderId }, data: { cashbackPoints: 0 } });
    }

    await logOrderEvent(tx, {
      orderId,
      type: "STATUS",
      fromStatus: from,
      toStatus: to,
      message: `${ORDER_STATUS_LABELS[from as OrderStatus] ?? from} → ${ORDER_STATUS_LABELS[to]}${opts.reason ? ` — ${opts.reason}` : ""}`,
      actor: opts.actor,
    });

    if (order.userId) {
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: `Order ${ORDER_STATUS_LABELS[to]}`,
          message: `Your order #${orderId.slice(-8).toUpperCase()} is now ${ORDER_STATUS_LABELS[to].toLowerCase()}.`,
          type: "ORDER",
          link: "/account/orders",
        },
      });
    }

    return { ok: true, from, to, noop: false } as const;
  });

  if (!result.ok) return result;
  if (result.noop) return { ok: true, from: result.from, to: result.to };

  // ---- Side effects outside the DB transaction (network calls) ----
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shipments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) return { ok: true, from: result.from, to };
  const activeShipment = order.shipments.find((s: any) => s.type === "FORWARD" && s.status !== "CANCELLED");

  if (to === "CANCELLED" && activeShipment) {
    await cancelCourierBooking(activeShipment, opts.actor);
  }

  // Prepaid money goes back automatically on cancel / RTO (pass refund:false to skip).
  if ((to === "CANCELLED" || to === "RTO") && opts.refund !== false && order.paymentMethod === "ONLINE" && order.paymentId) {
    const r = await issueRefund({ orderId, reason: to === "RTO" ? "Returned to origin (undelivered)" : opts.reason || "Order cancelled", actor: opts.actor });
    if (!r.ok) console.error(`[ORDER ${orderId}] Auto refund failed: ${r.error}`);
  }

  await notifyCustomer(order, to, activeShipment);
  return { ok: true, from: result.from, to };
}

async function cancelCourierBooking(shipment: any, actor: string) {
  if (!CANCELLABLE_SHIPMENT_STATUSES.includes(shipment.status as ShipmentStatus)) {
    await logOrderEvent(null, {
      orderId: shipment.orderId,
      type: "SHIPMENT",
      message: `Shipment ${shipment.awb || shipment.id} is already ${shipment.status} — cancel it with the courier manually / expect RTO.`,
      actor,
    });
    return;
  }
  const provider = getProvider(shipment.provider);
  try {
    if (provider?.cancelShipment && shipment.awb) await provider.cancelShipment(shipment.awb);
    await prisma.shipment.update({ where: { id: shipment.id }, data: { status: "CANCELLED" } });
    await logOrderEvent(null, { orderId: shipment.orderId, type: "SHIPMENT", message: `Courier booking ${shipment.awb || ""} cancelled`, actor });
  } catch (e: any) {
    console.error("[SHIPMENT] Cancel failed:", e);
    await logOrderEvent(null, {
      orderId: shipment.orderId,
      type: "SHIPMENT",
      message: `Could not cancel courier booking ${shipment.awb || ""}: ${e?.message || e}. Cancel it in the courier panel.`,
      actor,
    });
  }
}

async function notifyCustomer(order: any, to: OrderStatus, shipment: any) {
  const orderNum = order.id.slice(-8).toUpperCase();
  const trackingUrl = shipment?.trackingUrl || `${siteUrl()}/track/${order.id}`;
  try {
    if (to === "SHIPPED") await sendOrderShipped(order.customerEmail, order.id, shipment?.awb || order.trackingNumber || undefined, trackingUrl);
    if (to === "DELIVERED") await sendOrderDelivered(order.customerEmail, order.id);
    if (to === "CANCELLED") await sendOrderCancelled(order.customerEmail, order.id, order.paymentMethod === "ONLINE" && !!order.paymentId);
  } catch (e) {
    console.error("Status email failed:", e);
  }

  const wa: Partial<Record<OrderStatus, string>> = {
    SHIPPED: `📦 *Your Spicy Nuts order #${orderNum} has shipped!*\n\n${shipment?.courierName ? `Courier: ${shipment.courierName}\n` : ""}${shipment?.awb ? `AWB: ${shipment.awb}\n` : ""}Track: ${trackingUrl}`,
    DELIVERED: `✅ *Order #${orderNum} delivered!*\n\nWe hope you love it. Any issue? Report within 48 hours from My Orders: ${siteUrl()}/account/orders`,
    CANCELLED: `❌ *Order #${orderNum} cancelled.*${order.paymentMethod === "ONLINE" && order.paymentId ? "\n\nYour refund has been initiated (5-7 business days)." : ""}`,
  };
  const refundLine = order.paymentMethod === "ONLINE" && order.paymentId ? "Your refund has been initiated and will reach you in 5-7 business days." : "No payment was taken.";
  const templates: Partial<Record<OrderStatus, TemplateRef>> = {
    SHIPPED: { key: "order_shipped", params: [orderNum, shipment?.courierName || "our courier", shipment?.awb || "-", trackingUrl] },
    DELIVERED: { key: "order_delivered", params: [orderNum, `${siteUrl()}/account/orders`] },
    CANCELLED: { key: "order_cancelled", params: [orderNum, refundLine] },
  };
  if (wa[to] && order.customerPhone) {
    try {
      await sendWhatsAppMessage({ to: order.customerPhone, message: wa[to]!, type: "ORDER_UPDATE", template: templates[to] });
    } catch (e) {
      console.error("Status WhatsApp failed:", e);
    }
  }
}
