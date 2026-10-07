import type { ShipmentStatus } from "./status";
import {
  ShippingError,
  type ShippingProvider,
  type TrackingEvent,
  type WebhookUpdate,
} from "./types";

/**
 * Shiprocket adapter (apiv2.shiprocket.in, "external" API).
 *
 * Booking is three calls: create the order, assign an AWB (Shiprocket picks the
 * courier by your panel's courier rules unless one is chosen), then request
 * pickup and fetch the label. All Shiprocket field names live in this file.
 *
 * Env:
 *   SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD   (API user from Settings → API, not your login)
 *   SHIPROCKET_BASE_URL                     (optional, default below)
 *
 * Pickup: Admin → Settings → Shipping "Contact / Warehouse Name" must match the
 * pickup location nickname in Shiprocket exactly.
 */
const BASE_URL = (process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in/v1/external").replace(/\/$/, "");
const TIMEOUT_MS = 20_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function login(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json: any = await res.json().catch(() => null);
  if (!res.ok || !json?.token) {
    throw new ShippingError(`Shiprocket login failed (${res.status}). Check SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD (use the API user).`);
  }
  // Tokens last 10 days; refresh well before that.
  cachedToken = { value: json.token, expiresAt: Date.now() + 8 * 24 * 60 * 60 * 1000 };
  return json.token;
}

async function call(path: string, init: { method: "GET" | "POST"; body?: unknown }, retry = true): Promise<any> {
  const token = await login();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: init.method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 401 && retry) {
    cachedToken = null;
    return call(path, init, false);
  }
  const json: any = await res.json().catch(() => null);
  if (!res.ok) {
    const errs = json?.errors ? Object.values(json.errors).flat().join(" ") : "";
    const msg = json?.message || errs || `HTTP ${res.status}`;
    throw new ShippingError(`Shiprocket: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
  }
  return json;
}

/** Maps Shiprocket status text (current_status / sr-status-label) to our normalized statuses. */
export function mapShiprocketStatus(raw: string): ShipmentStatus {
  const s = (raw || "").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (/rto.*deliver|return.*deliver/.test(s)) return "RTO_DELIVERED";
  if (/rto.*(transit|ofd|out for delivery|in transit|reached)/.test(s)) return "RTO_IN_TRANSIT";
  if (/\brto\b|return to origin/.test(s)) return "RTO_INITIATED";
  if (/^delivered|^delivery done/.test(s)) return "DELIVERED";
  if (/out for delivery/.test(s)) return "OUT_FOR_DELIVERY";
  if (/undelivered|ndr|not delivered|delivery attempt|exception|misrouted/.test(s)) return "NDR";
  if (/\blost\b|damaged|destroyed/.test(s)) return "LOST";
  if (/cancel/.test(s)) return "CANCELLED";
  if (/picked up|pickup done|^shipped/.test(s)) return "PICKED_UP";
  if (/transit|reached|destination hub|dispatched|connected|origin hub/.test(s)) return "IN_TRANSIT";
  if (/pickup|manifest|awb assigned|label generated|ready to ship/.test(s)) return "PICKUP_SCHEDULED";
  return "CREATED";
}

function toIso(value: unknown): string {
  const d = value ? new Date(String(value).replace(" ", "T")) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/** Shiprocket wants a 10-digit Indian mobile number. */
function phone10(p: string): string {
  const digits = (p || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function orderDate(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString();
  return `${ist.slice(0, 10)} ${ist.slice(11, 16)}`;
}

export const shiprocketProvider: ShippingProvider = {
  id: "SHIPROCKET",
  name: "Shiprocket",
  isConfigured: () => !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD),
  capabilities: { serviceability: true, autoBooking: true, tracking: true, cancel: true },

  publicTrackingUrl: (awb) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`,

  async checkServiceability(q) {
    const params = new URLSearchParams({
      pickup_postcode: q.pickupPincode,
      delivery_postcode: q.deliveryPincode,
      weight: String(Math.max(0.1, q.weightGrams / 1000)),
      cod: q.paymentMode === "COD" ? "1" : "0",
      declared_value: String(Math.round(q.orderValue || 0)),
    });
    let json: any;
    try {
      json = await call(`/courier/serviceability/?${params}`, { method: "GET" });
    } catch (e) {
      // Shiprocket answers 404 when no courier serves the pincode.
      if (e instanceof ShippingError && /no courier|not serviceable|404/i.test(e.message)) return { serviceable: false, options: [] };
      throw e;
    }
    const list: any[] = Array.isArray(json?.data?.available_courier_companies) ? json.data.available_courier_companies : [];
    return {
      serviceable: list.length > 0,
      options: list.map((c) => ({
        id: String(c.courier_company_id),
        name: String(c.courier_name ?? "Courier"),
        charge: c.rate !== undefined ? Number(c.rate) : undefined,
        etaDays: c.estimated_delivery_days !== undefined ? Number(c.estimated_delivery_days) : undefined,
      })),
    };
  },

  async createShipment(input) {
    if (!input.pickup) throw new ShippingError("Set your pickup address in Admin → Settings → Shipping first.");
    const isCod = input.paymentMode === "COD";
    const [first, ...rest] = input.consignee.name.trim().split(/\s+/);

    // 1. Create the order in Shiprocket.
    const created = await call("/orders/create/adhoc", {
      method: "POST",
      body: {
        order_id: input.orderNumber,
        order_date: orderDate(),
        pickup_location: input.pickup.warehouseName,
        billing_customer_name: first || input.consignee.name,
        billing_last_name: rest.join(" "),
        billing_address: input.consignee.address,
        billing_city: input.consignee.city,
        billing_pincode: input.consignee.pincode,
        billing_state: input.consignee.state,
        billing_country: "India",
        billing_email: input.consignee.email || "",
        billing_phone: phone10(input.consignee.phone),
        shipping_is_billing: true,
        order_items: input.items.map((i) => ({ name: i.name, sku: i.sku, units: i.quantity, selling_price: i.price })),
        payment_method: isCod ? "COD" : "Prepaid",
        sub_total: input.orderValue,
        length: input.lengthCm,
        breadth: input.breadthCm,
        height: input.heightCm,
        weight: Math.max(0.1, input.weightGrams / 1000),
      },
    });
    const shipmentId = created?.shipment_id;
    if (!shipmentId) throw new ShippingError(`Shiprocket did not create the shipment${created?.message ? `: ${created.message}` : ""}.`);

    // 2. Assign an AWB (courier chosen by Shiprocket's rules unless one was picked).
    const assigned = await call("/courier/assign/awb", {
      method: "POST",
      body: { shipment_id: shipmentId, ...(input.courierId ? { courier_id: input.courierId } : {}) },
    });
    const a = assigned?.response?.data ?? {};
    const awb = String(a.awb_code ?? "");
    if (!awb) {
      const why = assigned?.response?.data?.awb_assign_error || assigned?.message || "no courier available or low wallet balance";
      throw new ShippingError(`Shiprocket could not assign an AWB: ${why}. The order is saved in your Shiprocket panel.`);
    }

    // 3. Ask for pickup and fetch the label. Failures here don't undo the booking.
    let status: ShipmentStatus = "CREATED";
    try {
      await call("/courier/generate/pickup", { method: "POST", body: { shipment_id: [shipmentId] } });
      status = "PICKUP_SCHEDULED";
    } catch (e) {
      console.error("[SHIPROCKET] Pickup request failed, schedule it from the Shiprocket panel:", e);
    }
    let labelUrl: string | undefined;
    try {
      const label = await call("/courier/generate/label", { method: "POST", body: { shipment_id: [shipmentId] } });
      labelUrl = label?.label_url ? String(label.label_url) : undefined;
    } catch (e) {
      console.error("[SHIPROCKET] Label generation failed:", e);
    }

    return {
      awb,
      courierName: String(a.courier_name ?? "Shiprocket"),
      trackingUrl: shiprocketProvider.publicTrackingUrl!(awb),
      labelUrl,
      providerShipmentId: String(shipmentId),
      charge: a.freight_charges !== undefined ? Number(a.freight_charges) : undefined,
      status,
    };
  },

  async trackShipment(awb) {
    const json = await call(`/courier/track/awb/${encodeURIComponent(awb)}`, { method: "GET" });
    const t = json?.tracking_data ?? {};
    const activities: any[] = Array.isArray(t.shipment_track_activities) ? t.shipment_track_activities : [];
    const events: TrackingEvent[] = activities.map((h) => {
      const raw = String(h["sr-status-label"] ?? h.activity ?? h.status ?? "");
      return {
        at: toIso(h.date),
        status: mapShiprocketStatus(raw),
        rawStatus: raw,
        location: h.location ? String(h.location) : undefined,
        message: h.activity ? String(h.activity) : undefined,
      };
    });
    events.sort((x, y) => x.at.localeCompare(y.at));
    const current = Array.isArray(t.shipment_track) ? t.shipment_track[0]?.current_status : undefined;
    const rawStatus = String(current ?? events[events.length - 1]?.rawStatus ?? "");
    return { status: mapShiprocketStatus(rawStatus), rawStatus, events };
  },

  async cancelShipment(awb) {
    await call("/orders/cancel/shipment/awbs", { method: "POST", body: { awbs: [awb] } });
  },

  parseWebhook(body) {
    const list = Array.isArray(body) ? body : [body];
    const updates: WebhookUpdate[] = [];
    for (const item of list as any[]) {
      const awb = item?.awb ?? item?.awb_code;
      const raw = item?.current_status ?? item?.shipment_status;
      if (!awb || !raw) continue;
      const lastScan = Array.isArray(item?.scans) ? item.scans[item.scans.length - 1] : undefined;
      updates.push({
        awb: String(awb),
        status: mapShiprocketStatus(String(raw)),
        rawStatus: String(raw),
        at: toIso(item?.current_timestamp ?? lastScan?.date),
        location: lastScan?.location ? String(lastScan.location) : undefined,
        message: lastScan?.activity ? String(lastScan.activity) : undefined,
      });
    }
    return updates;
  },
};
