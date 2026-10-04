import { ShippingError, type ShippingProvider } from "./types";

/**
 * Manual handling: you book the parcel yourself (courier counter, any
 * partner's own panel, local delivery) and enter the AWB here. Always available.
 */
export const manualProvider: ShippingProvider = {
  id: "MANUAL",
  name: "Manual (enter AWB yourself)",
  isConfigured: () => true,
  capabilities: { serviceability: false, autoBooking: false, tracking: false, cancel: false },

  async createShipment(input) {
    const awb = input.manual?.awb?.trim();
    const courierName = input.manual?.courierName?.trim();
    if (!courierName) throw new ShippingError("Enter the courier name.");
    return {
      awb: awb || "",
      courierName,
      trackingUrl: input.manual?.trackingUrl?.trim() || undefined,
      status: "PICKED_UP",
    };
  },
};
