import { after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendWhatsAppMessage, buildOrderConfirmationWhatsAppMessage } from "@/lib/whatsapp";
import { logOrderEvent } from "@/lib/order-events";

// Website cash-on-delivery orders wait for the customer to tap "Yes, confirm" on WhatsApp before
// they are packed or booked with the courier. Fake or impulse COD orders are the main cause of
// parcels coming back (RTO), which costs courier charges both ways.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.spicynuts.in";
export const COD_YES = "COD_YES:";
export const COD_NO = "COD_NO:";

const isWhatsAppReady = () => !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WA_TEMPLATE_COD_CONFIRM);

/**
 * Asks the customer to confirm a COD order. Returns true if the order is now on hold.
 * If WhatsApp isn't set up or the message fails, the order is not held (old behaviour).
 */
export async function requestCodConfirmation(order: { id: string; customerName: string; customerPhone: string; total: number }) {
  if (!order.customerPhone || !isWhatsAppReady()) return false;
  const num = order.id.slice(-8).toUpperCase();
  const res = await sendWhatsAppMessage({
    to: order.customerPhone,
    type: "COD_CONFIRM",
    template: { key: "cod_confirm", params: [order.customerName.split(" ")[0] || "there", num, order.total.toFixed(0)], buttonPayloads: [`${COD_YES}${order.id}`, `${COD_NO}${order.id}`] },
    message: `Please confirm your Spicy Nuts COD order #${num} for ₹${order.total.toFixed(0)}.`,
  });
  if (res.status !== "SENT") return false;
  await prisma.order.update({ where: { id: order.id }, data: { codStatus: "PENDING" } });
  await logOrderEvent(null, { orderId: order.id, type: "NOTE", message: "Asked the customer to confirm this COD order on WhatsApp. It won't be booked until they tap Yes.", actor: "system" });
  return true;
}

/** Customer tapped Yes, or staff confirmed by phone: send the usual confirmation and release for packing. */
export async function confirmCodOrder(orderId: string, actor: string, how: string) {
  const claimed = await prisma.order.updateMany({ where: { id: orderId, codStatus: "PENDING" }, data: { codStatus: "CONFIRMED", codConfirmedAt: new Date() } });
  if (!claimed.count) return false;
  await logOrderEvent(null, { orderId, type: "NOTE", message: `COD order confirmed ${how}.`, actor });
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (order?.customerPhone) {
    await sendWhatsAppMessage({
      to: order.customerPhone,
      type: "ORDER_UPDATE",
      template: { key: "order_confirmed", params: [order.customerName, order.id.slice(-8).toUpperCase(), order.total.toFixed(0), "Cash on Delivery", `${SITE}/track/${order.id}`] },
      message: buildOrderConfirmationWhatsAppMessage({
        orderId: order.id, customerName: order.customerName, total: order.total, paymentMethod: "Cash on Delivery",
        items: order.items.map((i: any) => ({ name: i.productName, quantity: i.quantity, weight: i.weight })), trackingUrl: `${SITE}/track/${order.id}`,
      }),
    }).catch((e) => console.error("[COD] confirmation message failed", e));
  }
  const book = async () => {
    const { autoBookShipment } = await import("@/lib/shipping/service");
    await autoBookShipment(orderId);
  };
  try { after(book); } catch { await book(); }
  return true;
}

/** Customer tapped Cancel, or staff cancelled an unconfirmed order: cancel it and put the stock back. */
export async function declineCodOrder(orderId: string, actor: string, how: string) {
  const claimed = await prisma.order.updateMany({ where: { id: orderId, codStatus: "PENDING" }, data: { codStatus: "DECLINED" } });
  if (!claimed.count) return false;
  const { transitionOrder } = await import("@/lib/order-status");
  await transitionOrder(orderId, "CANCELLED", { actor, reason: `COD order not confirmed (${how})` });
  return true;
}

/** Handles a WhatsApp button tap. The phone must match the order's phone. */
export async function handleCodButton(payload: string, fromPhone: string) {
  const yes = payload.startsWith(COD_YES);
  const no = payload.startsWith(COD_NO);
  if (!yes && !no) return false;
  const orderId = payload.slice(yes ? COD_YES.length : COD_NO.length);
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { customerPhone: true, codStatus: true } });
  const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
  if (!order || digits(order.customerPhone) !== digits(fromPhone)) return false;
  if (order.codStatus !== "PENDING") return true; // already handled; ignore repeat taps
  if (yes) await confirmCodOrder(orderId, "customer", "by the customer on WhatsApp");
  else await declineCodOrder(orderId, "customer", "customer tapped Cancel on WhatsApp");
  return true;
}
