import { randomInt } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { logOrderEvent } from "@/lib/order-events";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildTemplatePayload, type TemplateRef } from "@/lib/whatsapp-templates";
import { sendPaymentReminderEmail, sendCartCouponEmail, sendReviewRequestEmail } from "@/lib/email";
import { cartRestoreUrl, reviewUrl } from "@/lib/signed-link";
import { requestCodConfirmation, declineCodOrder } from "@/lib/cod";

// Customer-message robots, run every 15 minutes by /api/cron/customer-messages:
//   1. payment reminder   1 h after an online payment failed and the order expired
//   2. cart coupon        24 h later, 5% one-time code, only to customers who agreed to offers
//   3. COD follow-up      ask again after 12 h; cancel after 24 h with no reply
//   4. review request     3 days after delivery
// Each robot marks the order with an OrderEvent (actor below) so nothing is sent twice.
// Nothing goes to customers between 9 pm and 9 am India time.

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const COUPON_PERCENT = 5;
const COUPON_VALID_HOURS = 48;
/** Orders placed after the checkout notice started mentioning reminders and review requests. */
export const NOTICE_COVERS_REVIEWS_FROM = new Date("2026-10-23T00:00:00+05:30");

const ACTOR = {
  payment: "automation:payment-reminder",
  coupon: "automation:cart-coupon",
  codNudge: "automation:cod-nudge",
  review: "automation:review-request",
} as const;

/** 9 am to 9 pm in India (UTC+5:30). */
export function isSendingHours(now = new Date()) {
  const ist = new Date(now.getTime() + 330 * MIN);
  const h = ist.getUTCHours();
  return h >= 9 && h < 21;
}

/** One key per customer: last 10 phone digits, else lower-case email. */
export function customerKey(o: { customerPhone?: string | null; customerEmail?: string | null }) {
  const digits = (o.customerPhone || "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? digits : (o.customerEmail || "").trim().toLowerCase();
}

/** Readable coupon code without look-alike letters, e.g. BACK5-7KQ2. */
export function couponCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[randomInt(chars.length)];
  return `BACK${COUPON_PERCENT}-${s}`;
}

/** "24 Oct, 6 pm" in India time. */
export function istLabel(d: Date) {
  return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", hour12: true }).replace(/\s?(am|pm)/i, (m) => " " + m.trim().toLowerCase());
}

const firstName = (name: string) => (name || "").trim().split(/\s+/)[0] || "there";
const orderNum = (id: string) => id.slice(-8).toUpperCase();

type Result = { sent: number; skipped: number; planned: string[] };
const empty = (): Result => ({ sent: 0, skipped: 0, planned: [] });

/** Sends a template only when it's approved and configured; plain text would not be delivered anyway. */
async function whatsapp(phone: string | null | undefined, template: TemplateRef, type: "ORDER_UPDATE" | "OFFER", fallbackText: string) {
  if (!phone || !buildTemplatePayload(template)) return false;
  const res = await sendWhatsAppMessage({ to: phone, type, template, message: fallbackText });
  return res.status === "SENT";
}

/** Has this customer placed a real order (paid online, COD or at the shop) after `since`? */
async function boughtSince(o: { customerPhone: string; customerEmail: string }, since: Date) {
  const last10 = o.customerPhone.replace(/\D/g, "").slice(-10);
  const who = [
    ...(last10.length === 10 ? [{ customerPhone: { endsWith: last10 } }] : []),
    ...(o.customerEmail ? [{ customerEmail: { equals: o.customerEmail, mode: "insensitive" as const } }] : []),
  ];
  if (!who.length) return false;
  const n = await prisma.order.count({
    where: {
      createdAt: { gt: since },
      status: { notIn: ["EXPIRED", "CANCELLED", "DELETED"] },
      OR: [{ paymentId: { not: null } }, { paymentMethod: { not: "ONLINE" } }],
      AND: [{ OR: who }],
    },
  });
  return n > 0;
}

/** Marketing consent for this customer: account settings first, else the latest consent record. */
export async function offersConsent(o: { userId: string | null; customerPhone: string; customerEmail: string }) {
  const user = o.userId
    ? await prisma.user.findUnique({ where: { id: o.userId }, select: { whatsappOptIn: true, emailOptIn: true } })
    : o.customerEmail
      ? await prisma.user.findFirst({ where: { email: { equals: o.customerEmail, mode: "insensitive" } }, select: { whatsappOptIn: true, emailOptIn: true } })
      : null;
  if (user) return { whatsapp: user.whatsappOptIn, email: user.emailOptIn };
  const last10 = o.customerPhone.replace(/\D/g, "").slice(-10);
  const [wa, em] = await Promise.all([
    last10.length === 10
      ? prisma.consentRecord.findFirst({ where: { purpose: "WHATSAPP_OFFERS", phone: { endsWith: last10 } }, orderBy: { createdAt: "desc" }, select: { granted: true } })
      : null,
    o.customerEmail
      ? prisma.consentRecord.findFirst({ where: { purpose: "EMAIL_OFFERS", email: { equals: o.customerEmail, mode: "insensitive" } }, orderBy: { createdAt: "desc" }, select: { granted: true } })
      : null,
  ]);
  return { whatsapp: !!wa?.granted, email: !!em?.granted };
}

// 1 ─────────────────────────────────────────────────────────────────────────

export async function sendPaymentReminders(now = new Date(), dryRun = false): Promise<Result> {
  const r = empty();
  const orders = await prisma.order.findMany({
    where: {
      channel: "WEBSITE", paymentMethod: "ONLINE", paymentId: null, status: "EXPIRED",
      createdAt: { gte: new Date(now.getTime() - 2 * DAY), lte: new Date(now.getTime() - HOUR) },
      events: { none: { actor: ACTOR.payment } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  // Several failed tries by one person: remind about the newest only.
  const seen = new Set<string>();
  for (const o of orders) {
    const key = customerKey(o);
    const older = seen.has(key);
    seen.add(key);
    const skip = older ? "the same customer tried again later; only the newest try is reminded" : (await boughtSince(o, o.createdAt)) ? "customer has ordered since" : null;
    if (dryRun) { r.planned.push(`${orderNum(o.id)} ${skip ? `skip (${skip})` : "payment reminder"}`); continue; }
    if (skip) {
      r.skipped++;
      await logOrderEvent(null, { orderId: o.id, type: "NOTE", message: `No payment reminder: ${skip}.`, actor: ACTOR.payment });
      continue;
    }
    const link = cartRestoreUrl(o.id);
    const wa = await whatsapp(o.customerPhone, { key: "payment_pending", params: [firstName(o.customerName), orderNum(o.id), o.total.toFixed(0), link] }, "ORDER_UPDATE",
      `Your payment for Spicy Nuts order #${orderNum(o.id)} did not go through. Complete it here: ${link}`);
    const em = o.customerEmail ? (await sendPaymentReminderEmail(o.customerEmail, o.customerName, o.id, o.total, link)).success : false;
    r.sent++;
    await logOrderEvent(null, { orderId: o.id, type: "NOTE", message: `Payment reminder sent (${[wa && "WhatsApp", em && "email"].filter(Boolean).join(" + ") || "nothing delivered"}).`, actor: ACTOR.payment });
  }
  return r;
}

// 2 ─────────────────────────────────────────────────────────────────────────

export async function sendCartCoupons(now = new Date(), dryRun = false): Promise<Result> {
  const r = empty();
  const orders = await prisma.order.findMany({
    where: {
      channel: "WEBSITE", paymentMethod: "ONLINE", paymentId: null, status: "EXPIRED",
      createdAt: { gte: new Date(now.getTime() - 3 * DAY), lte: new Date(now.getTime() - DAY) },
      AND: [
        { events: { some: { actor: ACTOR.payment, message: { startsWith: "Payment reminder sent" } } } },
        { events: { none: { actor: ACTOR.coupon } } },
      ],
    },
    take: 50,
  });
  for (const o of orders) {
    const consent = await offersConsent(o);
    const skip = (await boughtSince(o, o.createdAt)) ? "customer has ordered since" : !consent.whatsapp && !consent.email ? "customer has not agreed to offers" : null;
    if (dryRun) { r.planned.push(`${orderNum(o.id)} ${skip ? `skip (${skip})` : `coupon via ${[consent.whatsapp && "WhatsApp", consent.email && "email"].filter(Boolean).join(" + ")}`}`); continue; }
    if (skip) {
      r.skipped++;
      await logOrderEvent(null, { orderId: o.id, type: "NOTE", message: `No coupon reminder: ${skip}.`, actor: ACTOR.coupon });
      continue;
    }
    const expiry = new Date(now.getTime() + COUPON_VALID_HOURS * HOUR);
    let code = couponCode();
    for (let i = 0; i < 3 && (await prisma.coupon.findUnique({ where: { code }, select: { id: true } })); i++) code = couponCode();
    await prisma.coupon.create({
      data: { code, discountType: "PERCENTAGE", discountValue: COUPON_PERCENT, active: true, expiryDate: expiry, usageLimit: 1, perUserLimit: 1 },
    });
    const link = cartRestoreUrl(o.id);
    const until = istLabel(expiry);
    const wa = consent.whatsapp
      ? await whatsapp(o.customerPhone, { key: "cart_coupon", params: [firstName(o.customerName), code, COUPON_PERCENT, until, link] }, "OFFER",
          `Use code ${code} for ${COUPON_PERCENT}% off your saved Spicy Nuts cart before ${until}: ${link}`)
      : false;
    const em = consent.email && o.customerEmail ? (await sendCartCouponEmail(o.customerEmail, o.customerName, code, COUPON_PERCENT, until, link)).success : false;
    r.sent++;
    await logOrderEvent(null, { orderId: o.id, type: "NOTE", message: `Coupon ${code} (${COUPON_PERCENT}% off, valid to ${until}) sent (${[wa && "WhatsApp", em && "email"].filter(Boolean).join(" + ") || "nothing delivered"}).`, actor: ACTOR.coupon });
  }
  return r;
}

// 3 ─────────────────────────────────────────────────────────────────────────

export async function followUpCodOrders(now = new Date(), dryRun = false): Promise<Result & { cancelled: number }> {
  const r = { ...empty(), cancelled: 0 };
  const waiting = await prisma.order.findMany({
    where: { codStatus: "PENDING", status: { notIn: ["CANCELLED", "EXPIRED", "DELETED"] }, createdAt: { lte: new Date(now.getTime() - 12 * HOUR) } },
    select: { id: true, customerName: true, customerPhone: true, total: true, createdAt: true, events: { where: { actor: ACTOR.codNudge }, select: { id: true } } },
    take: 50,
  });
  for (const o of waiting) {
    const age = now.getTime() - o.createdAt.getTime();
    if (age >= DAY) {
      if (dryRun) { r.planned.push(`${orderNum(o.id)} cancel COD (no reply in 24 h)`); continue; }
      if (await declineCodOrder(o.id, "system", "no reply on WhatsApp within 24 hours")) r.cancelled++;
    } else if (!o.events.length) {
      if (dryRun) { r.planned.push(`${orderNum(o.id)} ask again to confirm COD`); continue; }
      const ok = await requestCodConfirmation(o);
      r.sent += ok ? 1 : 0;
      await logOrderEvent(null, { orderId: o.id, type: "NOTE", message: ok ? "Asked again to confirm the COD order (no reply after 12 hours). It will be cancelled at 24 hours." : "Could not resend the COD confirmation.", actor: ACTOR.codNudge });
    }
  }
  return r;
}

// 4 ─────────────────────────────────────────────────────────────────────────

export async function sendReviewRequests(now = new Date(), dryRun = false): Promise<Result> {
  const r = empty();
  const orders = await prisma.order.findMany({
    where: {
      channel: "WEBSITE", status: "DELIVERED",
      deliveredAt: { gte: new Date(now.getTime() - 10 * DAY), lte: new Date(now.getTime() - 3 * DAY) },
      events: { none: { actor: ACTOR.review } },
    },
    include: { returnRequests: { select: { id: true } } },
    take: 50,
  });
  for (const o of orders) {
    const covered = o.createdAt >= NOTICE_COVERS_REVIEWS_FROM;
    const consent = covered ? { whatsapp: true, email: true } : await offersConsent(o);
    const skip = o.returnRequests.length ? "the customer reported a problem" : !consent.whatsapp && !consent.email ? "placed before the notice mentioned review requests" : null;
    if (dryRun) { r.planned.push(`${orderNum(o.id)} ${skip ? `skip (${skip})` : "review request"}`); continue; }
    if (skip) {
      r.skipped++;
      await logOrderEvent(null, { orderId: o.id, type: "NOTE", message: `No review request: ${skip}.`, actor: ACTOR.review });
      continue;
    }
    const link = reviewUrl(o.id);
    const wa = consent.whatsapp
      ? await whatsapp(o.customerPhone, { key: "review_request", params: [firstName(o.customerName), orderNum(o.id), link] }, "ORDER_UPDATE",
          `How was your Spicy Nuts order #${orderNum(o.id)}? Rate it here: ${link}`)
      : false;
    const em = consent.email && o.customerEmail ? (await sendReviewRequestEmail(o.customerEmail, o.customerName, o.id, link)).success : false;
    r.sent++;
    await logOrderEvent(null, { orderId: o.id, type: "NOTE", message: `Review request sent (${[wa && "WhatsApp", em && "email"].filter(Boolean).join(" + ") || "nothing delivered"}).`, actor: ACTOR.review });
  }
  return r;
}

/** Runs every robot in turn. One failing robot doesn't stop the others. */
export async function runCustomerMessages({ now = new Date(), dryRun = false } = {}) {
  if (!dryRun && !isSendingHours(now)) return { quietHours: true };
  const run = async <T,>(name: string, fn: () => Promise<T>) => {
    try { return await fn(); } catch (e) { console.error(`[AUTOMATION] ${name} failed:`, e); return { error: e instanceof Error ? e.message : String(e) }; }
  };
  return {
    paymentReminders: await run("payment reminders", () => sendPaymentReminders(now, dryRun)),
    cartCoupons: await run("cart coupons", () => sendCartCoupons(now, dryRun)),
    cod: await run("COD follow-up", () => followUpCodOrders(now, dryRun)),
    reviewRequests: await run("review requests", () => sendReviewRequests(now, dryRun)),
  };
}
