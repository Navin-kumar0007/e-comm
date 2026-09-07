import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  let orderId = url.searchParams.get("orderId")?.trim() || "";
  const email = url.searchParams.get("email")?.trim().toLowerCase() || "";

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  // Support both full CUID and short NW-XXXXXXXX format
  // If the user enters a short format, try to find by suffix match
  let order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerEmail: true, status: true },
  });

  // If not found by exact ID, try suffix match (last 8 chars)
  if (!order) {
    const cleanId = orderId.replace(/^NW-/i, "").replace(/^#/, "");
    const allOrders = await prisma.order.findMany({
      where: { status: { not: "DELETED" } },
      select: { id: true, customerEmail: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    order = allOrders.find(
      (o) => o.id.slice(-8).toUpperCase() === cleanId.toUpperCase()
    ) as any;
  }

  if (!order || (order as any).status === "DELETED") {
    return NextResponse.json({ error: "Order not found. Please check your Order ID." }, { status: 404 });
  }

  // If email provided, verify it matches (privacy protection)
  if (email && order.customerEmail.toLowerCase() !== email) {
    return NextResponse.json({ error: "Email does not match this order." }, { status: 403 });
  }

  return NextResponse.json({ orderId: order.id });
}
