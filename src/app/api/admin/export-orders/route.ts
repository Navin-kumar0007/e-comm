import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getStaffContext } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit";

const STATUS: Record<string, string> = {
  Pending: "PENDING", Processing: "PROCESSING", Confirmed: "CONFIRMED", Shipped: "SHIPPED", Delivered: "DELIVERED",
  Cancelled: "CANCELLED", RTO: "RTO", Returned: "RETURNED", Expired: "EXPIRED",
};
const CHANNEL: Record<string, string> = { WEBSITE: "Website", SHOP: "Shop counter", PHONE: "Phone", WHOLESALE: "Wholesale" };

/** Orders as an Excel workbook, following the filters on the Orders page (status, channel, search, dates). */
export async function GET(req: Request) {
  const staff = await getStaffContext();
  if (!staff?.can("orders.export")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const status = STATUS[url.searchParams.get("status") ?? ""];
  const channel = url.searchParams.get("channel") || undefined;
  const q = url.searchParams.get("q")?.trim().replace(/^NW-/i, "").replace(/^#/, "");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const orders = await prisma.order.findMany({
    where: {
      status: status ?? { not: "DELETED" },
      ...(channel && CHANNEL[channel] ? { channel } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(`${from}T00:00:00+05:30`) } : {}), ...(to ? { lt: new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 864e5) } : {}) } } : {}),
      ...(q ? { OR: [{ id: { endsWith: q.toLowerCase() } }, { customerName: { contains: q, mode: "insensitive" as const } }, { customerEmail: { contains: q, mode: "insensitive" as const } }, { customerPhone: { contains: q } }] } : {}),
    },
    include: { items: true, shipments: { where: { type: "FORWARD" }, orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 20000,
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Orders");
  ws.columns = [
    { header: "Order", key: "ref", width: 14 },
    { header: "Invoice", key: "invoice", width: 20 },
    { header: "Date", key: "date", width: 12 },
    { header: "Channel", key: "channel", width: 13 },
    { header: "Status", key: "status", width: 12 },
    { header: "Payment", key: "payment", width: 10 },
    { header: "Customer", key: "name", width: 22 },
    { header: "Phone", key: "phone", width: 14 },
    { header: "Email", key: "email", width: 26 },
    { header: "City", key: "city", width: 14 },
    { header: "State", key: "state", width: 14 },
    { header: "Pincode", key: "pincode", width: 9 },
    { header: "Items", key: "items", width: 46 },
    { header: "Units", key: "units", width: 7 },
    { header: "Items total", key: "subtotal", width: 12, style: { numFmt: "#,##0.00" } },
    { header: "Discount", key: "discount", width: 10, style: { numFmt: "#,##0.00" } },
    { header: "Shipping", key: "shipping", width: 10, style: { numFmt: "#,##0.00" } },
    { header: "GST included", key: "tax", width: 12, style: { numFmt: "#,##0.00" } },
    { header: "Total", key: "total", width: 12, style: { numFmt: "#,##0.00" } },
    { header: "Refunded", key: "refunded", width: 10, style: { numFmt: "#,##0.00" } },
    { header: "Coupon", key: "coupon", width: 10 },
    { header: "Courier", key: "courier", width: 14 },
    { header: "AWB", key: "awb", width: 18 },
  ];
  for (const o of orders as any[]) {
    const parts = String(o.shippingAddress || "").split(",").map((p: string) => p.trim());
    const pincode = /^\d{6}$/.test(parts[parts.length - 1] ?? "") ? parts[parts.length - 1] : "";
    ws.addRow({
      ref: `NW-${o.id.slice(-8).toUpperCase()}`,
      invoice: o.invoiceNumber ?? "",
      date: new Date(o.createdAt.getTime() + 5.5 * 36e5).toISOString().slice(0, 10),
      channel: CHANNEL[o.channel] ?? o.channel,
      status: o.status,
      payment: o.paymentMethod,
      name: o.customerName,
      phone: o.customerPhone,
      email: o.customerEmail,
      city: parts.length >= 4 ? parts[parts.length - 3] : "",
      state: o.shippingState ?? (parts.length >= 3 ? parts[parts.length - 2] : ""),
      pincode,
      items: o.items.map((i: any) => `${i.productName} ${i.weight} ×${i.quantity}`).join("; "),
      units: o.items.reduce((s: number, i: any) => s + i.quantity, 0),
      subtotal: o.subtotal ?? o.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0),
      discount: o.discount || 0,
      shipping: o.shippingFee || 0,
      tax: o.taxAmount || 0,
      total: o.total,
      refunded: o.refundedAmount || 0,
      coupon: o.couponCode ?? "",
      courier: o.shipments[0]?.courierName ?? "",
      awb: o.shipments[0]?.awb ?? o.trackingNumber ?? "",
    });
  }
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6E1A2C" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: "A1", to: "W1" };

  await audit({ action: "order.export", summary: `Exported ${orders.length} orders to Excel`, data: { status: status ?? "all", channel: channel ?? "all", q: q ?? "" } });

  const buf = await wb.xlsx.writeBuffer();
  const stamp = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="spicy-nuts-orders-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
