import { prisma } from "@/lib/db/prisma";

export type OrderEventType = "STATUS" | "PAYMENT" | "SHIPMENT" | "REFUND" | "RETURN" | "NOTE";

/** Appends to an order's audit trail. Pass a transaction client when inside one. */
export async function logOrderEvent(
  db: any,
  event: { orderId: string; type: OrderEventType; message: string; actor: string; fromStatus?: string; toStatus?: string }
) {
  try {
    await (db ?? prisma).orderEvent.create({ data: event });
  } catch (e) {
    // Never let audit logging break the actual operation.
    console.error("[ORDER EVENT] Failed to log:", e);
  }
}
