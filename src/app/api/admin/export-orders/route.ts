import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { status: { not: "DELETED" } },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV
  const headers = [
    "Order ID",
    "Date",
    "Customer Name",
    "Email",
    "Phone",
    "Status",
    "Payment Method",
    "Items",
    "Subtotal",
    "Discount",
    "Coupon Code",
    "Total",
    "Shipping Address",
    "Tracking Number",
  ];

  const rows = orders.map((o) => {
    const itemsSummary = o.items
      .map((i) => `${i.product?.name || (i as any).productName || "Product"} x${i.quantity}`)
      .join("; ");
    const subtotal = o.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return [
      `NW-${o.id.slice(-8).toUpperCase()}`,
      o.createdAt.toISOString().split("T")[0],
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.status,
      (o as any).paymentMethod || "ONLINE",
      itemsSummary,
      subtotal.toFixed(2),
      ((o as any).discount || 0).toFixed(2),
      (o as any).couponCode || "",
      o.total.toFixed(2),
      o.shippingAddress.replace(/,/g, " "),
      o.trackingNumber || "",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nutty-world-orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
