import { NextResponse } from "next/server";
import { syncActiveShipments } from "@/lib/shipping/service";

/**
 * Polls delivery partners for tracking updates and moves orders along
 * (shipped → delivered / RTO). Call every 30–60 minutes with header:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await syncActiveShipments());
}
