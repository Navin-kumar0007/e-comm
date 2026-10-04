import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import OrderHubClient from "./order-hub-client";
import { requireAdmin } from "@/lib/auth-guard";
import { getStoreSettings } from "@/lib/store-settings";
import { listProviders } from "@/lib/shipping";
import { estimateOrderWeight } from "@/lib/shipping/service";
import { amountPaid } from "@/lib/refunds";

export default async function OrderHubPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const resolvedParams = await params;
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: {
        include: {
          product: true
        }
      },
      shipments: { orderBy: { createdAt: "desc" } },
      refunds: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 100 },
    }
  });

  if (!order) {
    return notFound();
  }

  const settings = await getStoreSettings();
  const fulfilment = {
    providers: listProviders().filter((p) => p.configured),
    defaultProvider: settings.shippingProvider,
    pickupConfigured: !!(settings.pickupAddress && settings.pickupPincode && settings.pickupPhone),
    estimatedWeightGrams: estimateOrderWeight(order.items, settings),
    refundable: Math.max(0, Math.round((amountPaid(order) - order.refundedAmount) * 100) / 100),
  };
  return <OrderHubClient order={order} settings={settings} fulfilment={fulfilment} />;
}
