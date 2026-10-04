// Order lifecycle rules. Pure data — safe to import from client components.
//
//   PENDING ──pay──▶ PROCESSING ──▶ CONFIRMED ──▶ SHIPPED ──▶ DELIVERED ──▶ RETURNED
//      │                 │              │            │
//      ├─▶ EXPIRED       └──────────────┴─▶ CANCELLED └─▶ RTO (returned to us undelivered)
//      └─▶ CANCELLED

export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "RETURNED",
  "RTO",
  "CANCELLED",
  "EXPIRED",
  "DELETED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED", "EXPIRED"],
  PROCESSING: ["CONFIRMED", "SHIPPED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RTO"],
  DELIVERED: ["RETURNED"],
  RETURNED: ["DELETED"],
  RTO: ["DELETED"],
  CANCELLED: ["DELETED"],
  EXPIRED: ["DELETED"],
  DELETED: [],
};

/** Statuses an admin may pick by hand (PROCESSING/EXPIRED/RETURNED come from payments & returns flows). */
export const ADMIN_SELECTABLE: OrderStatus[] = ["CONFIRMED", "SHIPPED", "DELIVERED", "RTO", "CANCELLED"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Awaiting Payment",
  PROCESSING: "Processing",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RETURNED: "Returned",
  RTO: "Returned to Origin",
  CANCELLED: "Cancelled",
  EXPIRED: "Payment Not Completed",
  DELETED: "Deleted",
};

export function canTransition(from: string, to: string) {
  return (ORDER_TRANSITIONS[from as OrderStatus] ?? []).includes(to as OrderStatus);
}

export function nextAdminStatuses(from: string): OrderStatus[] {
  return (ORDER_TRANSITIONS[from as OrderStatus] ?? []).filter((s) => ADMIN_SELECTABLE.includes(s));
}

/** Customers may cancel until the parcel is handed to the courier. */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PENDING", "PROCESSING", "CONFIRMED"];

export const RETURN_REASONS = {
  DAMAGED: "Item arrived damaged / leaking",
  WRONG_ITEM: "Wrong item received",
  MISSING_ITEM: "Item missing from package",
  QUALITY: "Quality issue (stale, insects, spoiled)",
  OTHER: "Other",
} as const;
