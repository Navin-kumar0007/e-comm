import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { getActiveProvider } from "@/lib/shipping";
import { FulfilmentClient, type QueueOrder } from "./fulfilment-client";

export default async function FulfilmentPage() {
  const staff = await requirePagePermission("orders.view");
  const [orders, settings] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["PROCESSING", "CONFIRMED"] } },
      orderBy: { createdAt: "asc" },
      take: 300,
      include: {
        items: { select: { quantity: true, productName: true, weight: true } },
        shipments: { where: { type: "FORWARD", status: { not: "CANCELLED" } }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    getStoreSettings(),
  ]);
  const provider = getActiveProvider(settings.shippingProvider);

  const queue: QueueOrder[] = orders.map((o: any) => ({
    id: o.id,
    ref: `NW-${o.id.slice(-8).toUpperCase()}`,
    createdAt: o.createdAt.toISOString(),
    customerName: o.customerName,
    city: o.shippingAddress.split(",").slice(-3, -2)[0]?.trim() || "",
    pincode: o.shippingAddress.match(/(\d{6})\s*$/)?.[1] || "",
    paymentMethod: o.paymentMethod,
    total: o.total,
    units: o.items.reduce((s: number, i: any) => s + i.quantity, 0),
    summary: o.items.map((i: any) => `${i.productName} ${i.weight}×${i.quantity}`).join(", "),
    awb: o.shipments[0]?.awb ?? null,
    courierName: o.shipments[0]?.courierName ?? null,
    labelUrl: o.shipments[0]?.labelUrl ?? null,
  }));

  return (
    <FulfilmentClient
      orders={queue}
      canBook={staff.can("shipping.manage") && provider.capabilities.autoBooking}
      providerName={provider.name}
    />
  );
}
