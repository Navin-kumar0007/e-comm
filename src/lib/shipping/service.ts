import { prisma } from "@/lib/db/prisma";
import { getStoreSettings, type StoreSettings } from "@/lib/store-settings";
import { logOrderEvent } from "@/lib/order-events";
import { transitionOrder } from "@/lib/order-status";
import { canTransition } from "@/lib/order-status-rules";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { siteUrl } from "@/lib/email";
import { getActiveProvider, getProvider } from "./index";
import {
  FINAL_SHIPMENT_STATUSES,
  SHIPMENT_STATUS_LABELS,
  orderStatusForShipment,
  type ShipmentStatus,
} from "./status";
import { ShippingError, type PaymentMode, type TrackingEvent } from "./types";
import { estimateOrderWeight } from "./weight";
export { parseWeightGrams, estimateOrderWeight } from "./weight";

export function parseAddress(order: { shippingAddress: string; shippingState?: string | null }) {
  // Stored as "street, city, state, pincode"
  const parts = order.shippingAddress.split(",").map((p) => p.trim());
  const pincode = parts.length >= 1 && /^\d{6}$/.test(parts[parts.length - 1]) ? parts.pop()! : "";
  const state = order.shippingState || parts.pop() || "";
  if (order.shippingState && parts[parts.length - 1] === order.shippingState) parts.pop();
  const city = parts.pop() || "";
  return { address: parts.join(", "), city, state, pincode };
}

function pickupFrom(settings: StoreSettings) {
  if (!settings.pickupAddress || !settings.pickupPincode || !settings.pickupPhone) return null;
  return {
    warehouseName: settings.pickupName || settings.storeName,
    name: settings.pickupName || settings.storeName,
    phone: settings.pickupPhone,
    address: settings.pickupAddress,
    city: settings.pickupCity || "",
    state: settings.pickupState || "",
    pincode: settings.pickupPincode,
  };
}

export interface BookShipmentOptions {
  providerId?: string;
  courierId?: string;
  weightGrams?: number;
  manual?: { awb: string; courierName: string; trackingUrl?: string };
}

/** Books a forward shipment for an order (API booking or manual AWB entry). */
export async function createShipmentForOrder(orderId: string, opts: BookShipmentOptions, actor: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, shipments: true },
  });
  if (!order) throw new ShippingError("Order not found");
  if (!["PROCESSING", "CONFIRMED"].includes(order.status)) {
    throw new ShippingError("Only paid / COD orders that haven't shipped yet can be booked.");
  }
  if (order.shipments.some((s: any) => s.type === "FORWARD" && s.status !== "CANCELLED")) {
    throw new ShippingError("This order already has an active shipment. Cancel it first.");
  }

  const settings = await getStoreSettings();
  const provider = opts.manual ? getProvider("MANUAL")! : getProvider(opts.providerId) ?? getActiveProvider(settings.shippingProvider);
  if (!provider.isConfigured()) throw new ShippingError(`${provider.name} is not configured.`);

  const weightGrams = opts.weightGrams && opts.weightGrams > 0 ? Math.round(opts.weightGrams) : estimateOrderWeight(order.items, settings);
  const isCod = order.paymentMethod === "COD";
  const addr = parseAddress(order);

  const booked = await provider.createShipment({
    orderId: order.id,
    orderNumber: `NW-${order.id.slice(-8).toUpperCase()}`,
    paymentMode: isCod ? "COD" : "PREPAID",
    orderValue: order.total,
    codAmount: isCod ? order.total : 0,
    consignee: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail || undefined, ...addr },
    pickup: pickupFrom(settings),
    items: order.items.map((i: any) => ({
      name: i.productName || i.product?.name || "Item",
      sku: (i.productId || i.id).slice(-12),
      quantity: i.quantity,
      price: i.price,
    })),
    weightGrams,
    lengthCm: settings.packageLengthCm,
    breadthCm: settings.packageBreadthCm,
    heightCm: settings.packageHeightCm,
    courierId: opts.courierId,
    manual: opts.manual,
  });

  const shipment = await prisma.shipment.create({
    data: {
      orderId: order.id,
      provider: provider.id,
      status: booked.status,
      awb: booked.awb || null,
      courierName: booked.courierName,
      trackingUrl: booked.trackingUrl || null,
      labelUrl: booked.labelUrl || null,
      providerShipmentId: booked.providerShipmentId || null,
      weightGrams,
      codAmount: isCod ? order.total : 0,
      charge: booked.charge ?? null,
    },
  });

  // Keep the legacy fields in sync (used by account pages and emails).
  await prisma.order.update({
    where: { id: order.id },
    data: { trackingNumber: booked.awb || null, trackingUrl: booked.trackingUrl || null },
  });
  await logOrderEvent(null, {
    orderId: order.id,
    type: "SHIPMENT",
    message: `Booked with ${booked.courierName}${booked.awb ? ` — AWB ${booked.awb}` : ""} (${weightGrams} g)`,
    actor,
  });

  await syncOrderWithShipment(order.id, booked.status, actor);
  return shipment;
}

/**
 * Books the courier automatically for a newly confirmed order (COD placed or
 * online payment captured). Off unless SHIPPING_AUTO_BOOK=true and the chosen
 * partner can book by API. Never throws: on failure the order stays ready for
 * manual booking and the admin is emailed.
 */
export async function autoBookShipment(orderId: string) {
  if (process.env.SHIPPING_AUTO_BOOK !== "true") return;
  try {
    const settings = await getStoreSettings();
    const provider = getActiveProvider(settings.shippingProvider);
    if (!provider.capabilities.autoBooking) return;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shipments: true } });
    if (!order || !["PROCESSING", "CONFIRMED"].includes(order.status)) return;
    if (order.codStatus === "PENDING") return; // waits for the customer's WhatsApp confirmation
    if (order.shipments.some((s: any) => s.type === "FORWARD" && s.status !== "CANCELLED")) return;
    await createShipmentForOrder(orderId, {}, "auto-booking");
  } catch (e) {
    const reason = e instanceof ShippingError ? e.message : "Unexpected error while booking";
    console.error(`[AUTO-BOOK] ${orderId}:`, e);
    await logOrderEvent(null, { orderId, type: "NOTE", message: `Automatic courier booking failed: ${reason}. Book it manually.`, actor: "auto-booking" }).catch(() => {});
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { customerName: true } });
      const { notifyAdminShippingIssue } = await import("@/lib/email");
      await notifyAdminShippingIssue(orderId, order?.customerName ?? "", reason);
    } catch (mailErr) {
      console.error("[AUTO-BOOK] Admin alert failed:", mailErr);
    }
  }
}

/** Moves the order along when the courier status implies it (CONFIRMED → SHIPPED → DELIVERED / RTO). */
async function syncOrderWithShipment(orderId: string, status: ShipmentStatus, actor: string) {
  const target = orderStatusForShipment(status);
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return;

  if (!target) {
    // Booked but not picked up yet: mark the order confirmed/packed.
    if (order.status === "PROCESSING" && status !== "CANCELLED") await transitionOrder(orderId, "CONFIRMED", { actor });
    return;
  }
  if (order.status === target) return;
  // Step through SHIPPED if a courier update skipped ahead (e.g. straight to DELIVERED).
  if (target !== "SHIPPED" && !canTransition(order.status, target) && canTransition(order.status, "SHIPPED")) {
    await transitionOrder(orderId, "SHIPPED", { actor });
  }
  const fresh = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (fresh && canTransition(fresh.status, target)) await transitionOrder(orderId, target, { actor });
}

/** Applies a tracking update from polling or a webhook. Idempotent. */
export async function applyShipmentUpdate(
  shipment: any,
  update: { status: ShipmentStatus; rawStatus: string; events?: TrackingEvent[]; message?: string; location?: string },
  actor: string
) {
  // A delivered / returned / cancelled shipment never changes again (late or out-of-order webhooks).
  const locked = FINAL_SHIPMENT_STATUSES.includes(shipment.status);
  const changed = !locked && shipment.status !== update.status;
  const events = update.events ?? appendEvent(shipment.events, update);
  await prisma.shipment.update({
    where: { id: shipment.id },
    data: { ...(locked ? {} : { status: update.status }), events: JSON.stringify(events.slice(-50)), lastSyncedAt: new Date() },
  });
  if (!changed) return;

  await logOrderEvent(null, {
    orderId: shipment.orderId,
    type: "SHIPMENT",
    message: `${SHIPMENT_STATUS_LABELS[update.status]}${update.location ? ` at ${update.location}` : ""} (${update.rawStatus})`,
    actor,
  });

  if (shipment.type === "FORWARD") {
    await syncOrderWithShipment(shipment.orderId, update.status, actor);
    await nudgeCustomer(shipment, update.status);
  }
}

function appendEvent(existing: string, update: { status: ShipmentStatus; rawStatus: string; message?: string; location?: string }) {
  let list: TrackingEvent[] = [];
  try {
    list = JSON.parse(existing || "[]");
  } catch {}
  list.push({ at: new Date().toISOString(), status: update.status, rawStatus: update.rawStatus, message: update.message, location: update.location });
  return list;
}

/** WhatsApp nudges that reduce failed deliveries (RTO is expensive). */
async function nudgeCustomer(shipment: any, status: ShipmentStatus) {
  if (status !== "OUT_FOR_DELIVERY" && status !== "NDR") return;
  const order = await prisma.order.findUnique({ where: { id: shipment.orderId } });
  if (!order?.customerPhone) return;
  const num = order.id.slice(-8).toUpperCase();
  const cod = order.paymentMethod === "COD" ? `\nPlease keep ₹${order.total.toFixed(0)} ready (cash/UPI).` : "";
  const message =
    status === "OUT_FOR_DELIVERY"
      ? `🚚 *Order #${num} is out for delivery today!*${cod}`
      : `⚠️ *We couldn't deliver order #${num}.*\nThe courier will try again. If you need to change the address or time, reply here or call us.\nTrack: ${shipment.trackingUrl || `${siteUrl()}/track/${order.id}`}`;
  try {
    const trackUrl = shipment.trackingUrl || `${siteUrl()}/track/${order.id}`;
    await sendWhatsAppMessage({
      to: order.customerPhone,
      message,
      type: "ORDER_UPDATE",
      template:
        status === "OUT_FOR_DELIVERY"
          ? { key: "order_out_for_delivery", params: [num, order.paymentMethod === "COD" ? `Please keep ₹${order.total.toFixed(0)} ready (cash or UPI).` : "No payment needed — it's prepaid."] }
          : { key: "order_delivery_failed", params: [num, trackUrl] },
    });
  } catch (e) {
    console.error("Delivery nudge failed:", e);
  }
}

export async function syncShipment(shipmentId: string, actor = "system") {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment?.awb) throw new ShippingError("Shipment has no AWB to track.");
  const provider = getProvider(shipment.provider);
  if (!provider?.trackShipment || !provider.isConfigured()) throw new ShippingError("This delivery partner doesn't support tracking sync — update the status manually.");
  const result = await provider.trackShipment(shipment.awb);
  await applyShipmentUpdate(shipment, { status: result.status, rawStatus: result.rawStatus, events: result.events }, actor);
  return result;
}

/** Cron: refresh tracking for shipments still on the move. */
export async function syncActiveShipments(limit = 40) {
  const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
  const shipments = await prisma.shipment.findMany({
    where: {
      status: { notIn: FINAL_SHIPMENT_STATUSES as unknown as string[] },
      awb: { not: null },
      provider: { not: "MANUAL" },
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleBefore } }],
    },
    orderBy: { lastSyncedAt: "asc" },
    take: limit,
    select: { id: true },
  });
  let synced = 0;
  let failed = 0;
  for (const s of shipments) {
    try {
      await syncShipment(s.id, "courier-sync");
      synced++;
    } catch (e) {
      failed++;
      console.error(`[SHIPMENT SYNC] ${s.id}:`, e);
      await prisma.shipment.update({ where: { id: s.id }, data: { lastSyncedAt: new Date() } }).catch(() => {});
    }
  }
  return { checked: shipments.length, synced, failed };
}

// ---------- Serviceability (checkout + product page) ----------

export interface DeliveryCheck {
  serviceable: boolean;
  codAvailable: boolean;
  checked: boolean; // false => courier API unavailable, we allowed the order anyway
  message: string;
}

const cache = new Map<string, { at: number; value: { serviceable: boolean; cod: boolean } }>();
const CACHE_MS = 6 * 60 * 60 * 1000;

export async function checkDelivery(pincode: string, opts: { orderValue?: number; weightGrams?: number; paymentMode?: PaymentMode } = {}): Promise<DeliveryCheck> {
  const settings = await getStoreSettings();
  const orderValue = opts.orderValue ?? 0;
  const codAllowedBySettings = settings.codEnabled && (!orderValue || orderValue <= settings.codMaxOrderValue);
  const provider = getActiveProvider(settings.shippingProvider);

  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return { serviceable: false, codAvailable: false, checked: true, message: "Enter a valid 6-digit pincode." };
  }

  if (!provider.capabilities.serviceability || !provider.checkServiceability || !settings.pickupPincode) {
    return {
      serviceable: true,
      codAvailable: codAllowedBySettings,
      checked: false,
      message: "Delivery available across India.",
    };
  }

  const key = `${provider.id}:${pincode}`;
  let entry = cache.get(key);
  if (!entry || Date.now() - entry.at > CACHE_MS) {
    try {
      const base = { pickupPincode: settings.pickupPincode, deliveryPincode: pincode, orderValue: orderValue || 500, weightGrams: opts.weightGrams || settings.defaultPackageWeightGrams };
      const [prepaid, cod] = await Promise.all([
        provider.checkServiceability({ ...base, paymentMode: "PREPAID" }),
        provider.checkServiceability({ ...base, paymentMode: "COD" }),
      ]);
      entry = { at: Date.now(), value: { serviceable: prepaid.serviceable || cod.serviceable, cod: cod.serviceable } };
      cache.set(key, entry);
    } catch (e) {
      // Fail open: never block sales because the courier API is down.
      console.error(`[SERVICEABILITY] ${provider.id} ${pincode}:`, e);
      return { serviceable: true, codAvailable: codAllowedBySettings, checked: false, message: "Delivery available." };
    }
  }

  const { serviceable, cod } = entry.value;
  const codAvailable = serviceable && cod && codAllowedBySettings;
  return {
    serviceable,
    codAvailable,
    checked: true,
    message: !serviceable
      ? "Sorry, we don't deliver to this pincode yet."
      : codAvailable
      ? "Delivery available · Cash on Delivery available."
      : "Delivery available · Prepaid only for this pincode/order.",
  };
}
