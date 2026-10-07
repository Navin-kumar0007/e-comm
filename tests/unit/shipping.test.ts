import { describe, it, expect } from "vitest";
import { parseWeightGrams, estimateOrderWeight } from "@/lib/shipping/weight";
import { mapXpressbeesStatus } from "@/lib/shipping/xpressbees";
import { mapShiprocketStatus, shiprocketProvider } from "@/lib/shipping/shiprocket";
import { orderStatusForShipment } from "@/lib/shipping/status";

describe("weights", () => {
  it("parses common label formats", () => {
    expect(parseWeightGrams("150g")).toBe(150);
    expect(parseWeightGrams("1 kg")).toBe(1000);
    expect(parseWeightGrams("1.5KG")).toBe(1500);
    expect(parseWeightGrams("500 gm")).toBe(500);
    expect(parseWeightGrams("Standard")).toBeNull();
  });

  it("uses the ordered pack size, adds packaging, respects the minimum box", () => {
    const items = [{ quantity: 2, weight: "1kg", product: { weight: "100g", shippingWeightGrams: null } }];
    expect(estimateOrderWeight(items, { defaultPackageWeightGrams: 500 })).toBe(2300);
    expect(estimateOrderWeight([{ quantity: 1, weight: "50g" }], { defaultPackageWeightGrams: 500 })).toBe(500);
  });
});

describe("courier status mapping", () => {
  it.each([
    ["PP", "PICKUP_SCHEDULED"], ["PKD", "PICKED_UP"], ["IT", "IN_TRANSIT"], ["OFD", "OUT_FOR_DELIVERY"],
    ["DL", "DELIVERED"], ["EX", "NDR"], ["RT", "RTO_INITIATED"], ["RT-IT", "RTO_IN_TRANSIT"], ["RT-DL", "RTO_DELIVERED"],
    ["Delivered", "DELIVERED"], ["out for delivery", "OUT_FOR_DELIVERY"], ["Shipment Lost", "LOST"],
  ])("%s → %s", (raw, expected) => {
    expect(mapXpressbeesStatus(raw)).toBe(expected);
  });

  it("drives the order status", () => {
    expect(orderStatusForShipment("PICKED_UP")).toBe("SHIPPED");
    expect(orderStatusForShipment("DELIVERED")).toBe("DELIVERED");
    expect(orderStatusForShipment("RTO_DELIVERED")).toBe("RTO");
    expect(orderStatusForShipment("PICKUP_SCHEDULED")).toBeNull();
  });
});

describe("shiprocket", () => {
  it.each([
    ["NEW", "CREATED"], ["PICKUP SCHEDULED", "PICKUP_SCHEDULED"], ["OUT FOR PICKUP", "PICKUP_SCHEDULED"],
    ["PICKED UP", "PICKED_UP"], ["SHIPPED", "PICKED_UP"], ["IN TRANSIT", "IN_TRANSIT"],
    ["REACHED AT DESTINATION HUB", "IN_TRANSIT"], ["OUT FOR DELIVERY", "OUT_FOR_DELIVERY"],
    ["UNDELIVERED", "NDR"], ["DELIVERED", "DELIVERED"], ["RTO INITIATED", "RTO_INITIATED"],
    ["RTO IN TRANSIT", "RTO_IN_TRANSIT"], ["RTO DELIVERED", "RTO_DELIVERED"], ["CANCELED", "CANCELLED"], ["LOST", "LOST"],
  ])("%s → %s", (raw, expected) => {
    expect(mapShiprocketStatus(raw)).toBe(expected);
  });

  it("reads webhook pushes", () => {
    const updates = shiprocketProvider.parseWebhook!({
      awb: "1234567890", current_status: "OUT FOR DELIVERY", current_timestamp: "2026-10-08 10:15:00",
      scans: [{ date: "2026-10-08 10:15:00", activity: "Out for delivery", location: "Bidar" }],
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ awb: "1234567890", status: "OUT_FOR_DELIVERY", location: "Bidar" });
    expect(shiprocketProvider.parseWebhook!({ hello: "world" })).toHaveLength(0);
  });
});
