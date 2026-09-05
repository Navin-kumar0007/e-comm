import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import OrderHubClient from "./order-hub-client";

export default async function OrderHubPage({ params }: { params: Promise<{ id: string }> }) {
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

  return <OrderHubClient order={order} />;
}
