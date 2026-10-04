// Courier-agnostic shipment statuses. Each adapter maps its own codes to these.

export const SHIPMENT_STATUSES = [
  "CREATED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "NDR", // delivery attempt failed (customer unavailable, refused, wrong address...)
  "DELIVERED",
  "RTO_INITIATED",
  "RTO_IN_TRANSIT",
  "RTO_DELIVERED",
  "CANCELLED",
  "LOST",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  CREATED: "Booked",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  NDR: "Delivery Attempt Failed",
  DELIVERED: "Delivered",
  RTO_INITIATED: "Returning to Sender",
  RTO_IN_TRANSIT: "Returning to Sender",
  RTO_DELIVERED: "Returned to Sender",
  CANCELLED: "Cancelled",
  LOST: "Lost",
};

/** Statuses after which the shipment can't change any more. */
export const FINAL_SHIPMENT_STATUSES: ShipmentStatus[] = ["DELIVERED", "RTO_DELIVERED", "CANCELLED", "LOST"];

/** Shipments that can still be cancelled with the courier (not yet picked up). */
export const CANCELLABLE_SHIPMENT_STATUSES: ShipmentStatus[] = ["CREATED", "PICKUP_SCHEDULED"];

/** Which order status a shipment status implies (null = no change). */
export function orderStatusForShipment(status: ShipmentStatus): "SHIPPED" | "DELIVERED" | "RTO" | null {
  switch (status) {
    case "PICKED_UP":
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
    case "NDR":
    case "RTO_INITIATED":
    case "RTO_IN_TRANSIT":
      return "SHIPPED";
    case "DELIVERED":
      return "DELIVERED";
    case "RTO_DELIVERED":
      return "RTO";
    default:
      return null;
  }
}
