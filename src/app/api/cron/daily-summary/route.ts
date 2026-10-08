import { NextResponse } from "next/server";
import { sendDailySummary } from "@/lib/daily-summary";

/**
 * Owner's morning report by email (and WhatsApp when OWNER_WHATSAPP is set).
 * Runs daily from vercel.json; Vercel sends: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await sendDailySummary();
  return NextResponse.json({ ok: true, day: res.dayLabel, orders: res.orders, alerts: res.alerts.length, email: res.email, whatsapp: res.whatsapp });
}
