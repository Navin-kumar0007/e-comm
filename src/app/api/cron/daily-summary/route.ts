import { NextResponse } from "next/server";
import { sendDailySummary } from "@/lib/daily-summary";
import { releaseStaleOrders } from "@/lib/orders";

/**
 * Owner's morning report by email (and WhatsApp when OWNER_WHATSAPP is set).
 * Runs daily from vercel.json; Vercel sends: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Safety net for unpaid online orders that no checkout or admin visit has swept yet.
  await releaseStaleOrders(100).catch((e) => console.error("[CRON] Stale order sweep failed:", e));
  const res = await sendDailySummary();
  return NextResponse.json({ ok: true, day: res.dayLabel, orders: res.orders, alerts: res.alerts.length, email: res.email, whatsapp: res.whatsapp });
}
