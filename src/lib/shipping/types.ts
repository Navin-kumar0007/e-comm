// Contract every delivery partner adapter implements.
// To add a new courier (Delhivery, Shiprocket, DTDC...): create a file next to
// xpressbees.ts implementing ShippingProvider, then register it in ./index.ts.

import type { ShipmentStatus } from "./status";

export type PaymentMode = "COD" | "PREPAID";

export interface Address {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PickupAddress extends Address {
  warehouseName: string;
}

export interface ServiceabilityQuery {
  pickupPincode: string;
  deliveryPincode: string;
  paymentMode: PaymentMode;
  orderValue: number;
  weightGrams: number;
}

export interface CourierOption {
  id: string;
  name: string;
  charge?: number;
  etaDays?: number;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  options: CourierOption[];
}

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string; // human-facing, e.g. NW-1A2B3C4D
  paymentMode: PaymentMode;
  orderValue: number;
  codAmount: number;
  consignee: Address;
  pickup: PickupAddress | null;
  items: Array<{ name: string; sku: string; quantity: number; price: number }>;
  weightGrams: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  courierId?: string; // pick a specific service from serviceability options
  manual?: { awb: string; courierName: string; trackingUrl?: string };
}

export interface CreateShipmentResult {
  awb: string;
  courierName: string;
  trackingUrl?: string;
  labelUrl?: string;
  providerShipmentId?: string;
  charge?: number;
  status: ShipmentStatus;
}

export interface TrackingEvent {
  at: string; // ISO timestamp
  status: ShipmentStatus;
  rawStatus: string;
  location?: string;
  message?: string;
}

export interface TrackingResult {
  status: ShipmentStatus;
  rawStatus: string;
  events: TrackingEvent[];
}

export interface WebhookUpdate {
  awb: string;
  status: ShipmentStatus;
  rawStatus: string;
  at?: string;
  location?: string;
  message?: string;
}

export interface ShippingProvider {
  id: string;
  name: string;
  /** Credentials present? Unconfigured providers are hidden and never called. */
  isConfigured(): boolean;
  capabilities: {
    serviceability: boolean;
    autoBooking: boolean; // creates AWB + label via API
    tracking: boolean;
    cancel: boolean;
  };
  checkServiceability?(q: ServiceabilityQuery): Promise<ServiceabilityResult>;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  trackShipment?(awb: string): Promise<TrackingResult>;
  cancelShipment?(awb: string): Promise<void>;
  parseWebhook?(body: unknown): WebhookUpdate[];
  publicTrackingUrl?(awb: string): string;
}

/** Message is safe to show to an admin. */
export class ShippingError extends Error {}
