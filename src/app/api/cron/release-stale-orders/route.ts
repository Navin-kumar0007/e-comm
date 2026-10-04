import { NextResponse } from "next/server";
import { releaseStaleOrders } from "@/lib/orders";

/**
 * Expires unpaid online orders and returns their stock/points.
 * Call every ~10 minutes from a scheduler with header:
 *   Authorization: Bearer <CRON_SECRET>
 * (Vercel Cron sends this header automatically when CRON_SECRET is set.)
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await releaseStaleOrders();
  return NextResponse.json(result);
}
