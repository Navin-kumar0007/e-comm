import { prisma } from "@/lib/db/prisma";
import { BOOKED_STATUSES } from "@/lib/analytics";
import { getWarehouseOverview } from "@/lib/wms";
import { getPositions } from "@/lib/finance";
import { expiryStatus } from "@/lib/wms-core";
import { sendOwnerDailySummary } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const IST = 5.5 * 36e5;
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Yesterday 00:00 → today 00:00, India time. */
function yesterday(now = new Date()) {
  const ist = new Date(now.getTime() + IST);
  ist.setUTCHours(0, 0, 0, 0);
  const end = new Date(ist.getTime() - IST);
  return { start: new Date(end.getTime() - 864e5), end };
}

/** The owner's morning report: yesterday's sales and today's to-do list. */
export async function buildDailySummary(now = new Date()) {
  const { start, end } = yesterday(now);
  const [orders, toPack, overview, positions, lowStock, returns, manualRefunds, unpaidOnline, failed2fa] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: start, lt: end }, status: { in: BOOKED_STATUSES } }, select: { total: true, paymentMethod: true } }),
    prisma.order.count({ where: { status: { in: ["PROCESSING", "CONFIRMED"] }, shipments: { none: { status: { not: "CANCELLED" } } } } }),
    getWarehouseOverview(now),
    getPositions(),
    prisma.product.count({ where: { status: "ACTIVE", stock: { lte: 5 } } }),
    prisma.returnRequest.count({ where: { status: { in: ["REQUESTED", "APPROVED"] } } }),
    prisma.refund.count({ where: { method: "MANUAL", status: "PENDING" } }),
    prisma.order.count({ where: { createdAt: { gte: start, lt: end }, paymentMethod: "ONLINE", status: { in: ["EXPIRED", "FAILED"] } } }),
    prisma.auditLog.count({ where: { action: "auth.2fa_failed", createdAt: { gte: start, lt: end } } }),
  ]);

  const sales = orders.reduce((s: number, o: any) => s + o.total, 0);
  const cod = orders.filter((o: any) => o.paymentMethod === "COD").length;
  const expiringWeek = overview.expiring.filter((l: any) => expiryStatus(l.expiryDate, now, 7) !== "OK");
  const dayLabel = start.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

  const alerts: string[] = [];
  if (toPack) alerts.push(`${toPack} order${toPack === 1 ? "" : "s"} waiting to be packed and booked`);
  if (overview.reorder.length) alerts.push(`${overview.reorder.length} item${overview.reorder.length === 1 ? "" : "s"} to reorder (${overview.reorder.slice(0, 3).map((r: any) => `${r.name} ${r.pack}`).join(", ")}${overview.reorder.length > 3 ? "…" : ""})`);
  if (lowStock) alerts.push(`${lowStock} product${lowStock === 1 ? "" : "s"} with 5 or fewer packs left`);
  if (expiringWeek.length) alerts.push(`${expiringWeek.length} batch${expiringWeek.length === 1 ? "" : "es"} expired or expiring within 7 days`);
  if (returns) alerts.push(`${returns} return request${returns === 1 ? "" : "s"} to handle`);
  if (manualRefunds) alerts.push(`${manualRefunds} refund${manualRefunds === 1 ? "" : "s"} to pay by UPI/bank`);
  if (positions.codDue > 0 && positions.codOldest && now.getTime() - new Date(positions.codOldest).getTime() > 10 * 864e5) alerts.push(`COD money ${inr(positions.codDue)} still with the courier (oldest over 10 days)`);
  if (positions.unpaidExpenseCount) alerts.push(`${positions.unpaidExpenseCount} unpaid bill${positions.unpaidExpenseCount === 1 ? "" : "s"} (${inr(positions.unpaidExpenses)})`);
  if (unpaidOnline) alerts.push(`${unpaidOnline} online checkout${unpaidOnline === 1 ? "" : "s"} not completed yesterday: follow up from Insights`);
  if (failed2fa >= 3) alerts.push(`${failed2fa} wrong two-step codes entered on admin logins: check the Activity log`);

  const rows: Array<[string, string]> = [
    ["Orders", `${orders.length}${cod ? ` (${cod} COD)` : ""}`],
    ["Sales", inr(sales)],
    ["Average order", orders.length ? inr(sales / orders.length) : "—"],
    ["Waiting to pack", String(toPack)],
    ["Stock value", inr(overview.value.total)],
    ["Razorpay not yet in bank", inr(positions.razorpayUnsettled)],
    ["COD with courier", inr(positions.codDue)],
    ["Owed to suppliers", inr(positions.supplierDue)],
  ];

  return { dayLabel, orders: orders.length, sales, toPack, rows, alerts };
}

export async function sendDailySummary(now = new Date()) {
  const s = await buildDailySummary(now);
  const title = `Spicy Nuts · ${s.dayLabel}: ${s.orders} orders, ${inr(s.sales)}`;
  const email = await sendOwnerDailySummary(title, `Daily report for ${s.dayLabel}`, s.rows, s.alerts);

  let whatsapp: string = "skipped (set OWNER_WHATSAPP)";
  const to = process.env.OWNER_WHATSAPP;
  if (to) {
    const attention = s.alerts.length ? s.alerts.slice(0, 3).join("; ") : "nothing";
    const res = await sendWhatsAppMessage({
      to,
      type: "OWNER_SUMMARY",
      template: { key: "owner_daily_summary", params: [s.dayLabel, s.orders, Math.round(s.sales).toLocaleString("en-IN"), `${s.toPack} orders`, attention, "https://www.spicynuts.in/admin"] },
      message: `*Spicy Nuts · ${s.dayLabel}*\n${s.rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${s.alerts.length ? `*Needs attention*\n${s.alerts.map((a) => `• ${a}`).join("\n")}` : "Nothing needs attention today."}\n\nhttps://www.spicynuts.in/admin`,
    });
    whatsapp = res.status;
  }
  return { ...s, email: email.success ? "sent" : "failed", whatsapp };
}
