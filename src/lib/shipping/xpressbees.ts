import type { ShipmentStatus } from "./status";
import {
  ShippingError,
  type ShippingProvider,
  type TrackingEvent,
  type WebhookUpdate,
} from "./types";

/**
 * Xpressbees adapter (shipment.xpressbees.com API).
 *
 * Xpressbees shares the full API spec with your account credentials. All
 * request/response field names live in this file only — if your spec differs,
 * adjust the mappings below; nothing else in the app needs to change.
 *
 * Env:
 *   XPRESSBEES_EMAIL, XPRESSBEES_PASSWORD   (API user from Xpressbees)
 *   XPRESSBEES_BASE_URL                     (optional, default below)
 */
const BASE_URL = (process.env.XPRESSBEES_BASE_URL || "https://shipment.xpressbees.com/api").replace(/\/$/, "");
const TIMEOUT_MS = 15_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function login(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const res = await fetch(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.XPRESSBEES_EMAIL, password: process.env.XPRESSBEES_PASSWORD }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json: any = await res.json().catch(() => null);
  const token = typeof json?.data === "string" ? json.data : json?.data?.token ?? json?.token;
  if (!res.ok || !token) {
    throw new ShippingError(`Xpressbees login failed (${res.status}). Check XPRESSBEES_EMAIL / XPRESSBEES_PASSWORD.`);
  }
  cachedToken = { value: token, expiresAt: Date.now() + 6 * 60 * 60 * 1000 };
  return token;
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
  if (!res.ok || json?.status === false) {
    const msg = json?.message || json?.error || `HTTP ${res.status}`;
    throw new ShippingError(`Xpressbees: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
  }
  return json;
}

/** Maps Xpressbees status codes / text to our normalized statuses. */
export function mapXpressbeesStatus(raw: string): ShipmentStatus {
  const s = (raw || "").toLowerCase().trim();
  const code = s.toUpperCase();
  if (["RT-DL", "RTD"].includes(code) || /rto.*deliver|return.*deliver/.test(s)) return "RTO_DELIVERED";
  if (["RT-IT"].includes(code) || /rto.*transit|return.*transit/.test(s)) return "RTO_IN_TRANSIT";
  if (["RT"].includes(code) || /\brto\b|return to origin/.test(s)) return "RTO_INITIATED";
  if (["DL"].includes(code) || /^delivered/.test(s)) return "DELIVERED";
  if (["OFD"].includes(code) || /out for delivery/.test(s)) return "OUT_FOR_DELIVERY";
  if (["EX", "UD", "NDR"].includes(code) || /exception|undelivered|ndr|not delivered|attempt/.test(s)) return "NDR";
  if (["LT", "LOST"].includes(code) || /\blost\b/.test(s)) return "LOST";
  if (["CAN", "CANCELLED"].includes(code) || /cancel/.test(s)) return "CANCELLED";
  if (["PKD"].includes(code) || /picked|pickup done/.test(s)) return "PICKED_UP";
  if (["IT"].includes(code) || /transit|reached|dispatched|connected/.test(s)) return "IN_TRANSIT";
  if (["PP", "OP"].includes(code) || /pending pickup|pickup scheduled|out for pickup|manifest/.test(s)) return "PICKUP_SCHEDULED";
  return "CREATED";
}

function toIso(value: unknown): string {
  const d = value ? new Date(String(value)) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export const xpressbeesProvider: ShippingProvider = {
  id: "XPRESSBEES",
  name: "Xpressbees",
  isConfigured: () => !!(process.env.XPRESSBEES_EMAIL && process.env.XPRESSBEES_PASSWORD),
  capabilities: { serviceability: true, autoBooking: true, tracking: true, cancel: true },

  publicTrackingUrl: (awb) => `https://www.xpressbees.com/shipment/tracking?awbNo=${encodeURIComponent(awb)}`,

  async checkServiceability(q) {
    const json = await call("/courier/serviceability", {
      method: "POST",
      body: {
        origin: q.pickupPincode,
        destination: q.deliveryPincode,
        payment_type: q.paymentMode === "COD" ? "cod" : "prepaid",
        order_amount: String(q.orderValue),
        weight: String(q.weightGrams),
        length: "20",
        breadth: "15",
        height: "10",
      },
    });
    const list: any[] = Array.isArray(json?.data) ? json.data : [];
    return {
      serviceable: list.length > 0,
      options: list.map((c) => ({
        id: String(c.id),
        name: String(c.name ?? "Xpressbees"),
        charge: c.total_charges !== undefined ? Number(c.total_charges) : undefined,
      })),
    };
  },

  async createShipment(input) {
    if (!input.pickup) throw new ShippingError("Set your pickup address in Admin → Settings → Shipping first.");
    const isCod = input.paymentMode === "COD";
    const json = await call("/shipments2", {
      method: "POST",
      body: {
        order_number: input.orderNumber,
        payment_type: isCod ? "cod" : "prepaid",
        order_amount: input.orderValue,
        collectable_amount: isCod ? input.codAmount : 0,
        package_weight: input.weightGrams,
        package_length: input.lengthCm,
        package_breadth: input.breadthCm,
        package_height: input.heightCm,
        request_auto_pickup: "yes",
        ...(input.courierId ? { courier_id: input.courierId } : {}),
        consignee: {
          name: input.consignee.name,
          address: input.consignee.address,
          city: input.consignee.city,
          state: input.consignee.state,
          pincode: input.consignee.pincode,
          phone: input.consignee.phone,
        },
        pickup: {
          warehouse_name: input.pickup.warehouseName,
          name: input.pickup.name,
          address: input.pickup.address,
          city: input.pickup.city,
          state: input.pickup.state,
          pincode: input.pickup.pincode,
          phone: input.pickup.phone,
        },
        order_items: input.items.map((i) => ({ name: i.name, qty: String(i.quantity), price: String(i.price), sku: i.sku })),
      },
    });
    const d = json?.data ?? {};
    const awb = String(d.awb_number ?? d.awb ?? "");
    if (!awb) throw new ShippingError("Xpressbees did not return an AWB number.");
    return {
      awb,
      courierName: String(d.courier_name ?? "Xpressbees"),
      trackingUrl: xpressbeesProvider.publicTrackingUrl!(awb),
      labelUrl: d.label ? String(d.label) : undefined,
      providerShipmentId: d.shipment_id !== undefined ? String(d.shipment_id) : undefined,
      status: d.status ? mapXpressbeesStatus(String(d.status)) : "PICKUP_SCHEDULED",
    };
  },

  async trackShipment(awb) {
    const json = await call(`/shipments2/track/${encodeURIComponent(awb)}`, { method: "GET" });
    const d = json?.data ?? {};
    const history: any[] = Array.isArray(d.history) ? d.history : [];
    const events: TrackingEvent[] = history.map((h) => {
      const raw = String(h.status_code ?? h.status ?? h.message ?? "");
      return {
        at: toIso(h.event_time ?? h.date ?? h.time),
        status: mapXpressbeesStatus(raw),
        rawStatus: raw,
        location: h.location ? String(h.location) : undefined,
        message: h.message ? String(h.message) : undefined,
      };
    });
    events.sort((a, b) => a.at.localeCompare(b.at));
    const rawStatus = String(d.status ?? events[events.length - 1]?.rawStatus ?? "");
    return { status: mapXpressbeesStatus(rawStatus), rawStatus, events };
  },

  async cancelShipment(awb) {
    await call("/shipments2/cancel", { method: "POST", body: { awb } });
  },

  parseWebhook(body) {
    // Accept a single event or an array; field names vary between Xpressbees setups.
    const list = Array.isArray(body) ? body : [body];
    const updates: WebhookUpdate[] = [];
    for (const item of list as any[]) {
      const awb = item?.awb_number ?? item?.awb ?? item?.AWBNo;
      const raw = item?.status_code ?? item?.current_status ?? item?.status ?? item?.ShipmentStatus;
      if (!awb || !raw) continue;
      updates.push({
        awb: String(awb),
        status: mapXpressbeesStatus(String(raw)),
        rawStatus: String(raw),
        at: toIso(item?.event_time ?? item?.status_time ?? item?.timestamp),
        location: item?.location ? String(item.location) : undefined,
        message: item?.message ? String(item.message) : undefined,
      });
    }
    return updates;
  },
};
