import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import OrderHubClient from "./order-hub-client";
import { requireAdmin } from "@/lib/auth-guard";
import { getStoreSettings } from "@/lib/store-settings";

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
      }
    }
  });

  if (!order) {
    return notFound();
  }

  const settings = await getStoreSettings();
  return <OrderHubClient order={order} settings={settings} />;
}
