import { NextResponse } from "next/server";
import { runCustomerMessages } from "@/lib/automations";

/**
 * Payment reminders, cart coupons, COD follow-up and review requests (see src/lib/automations.ts).
 * Call every 15 minutes with header:
 *   Authorization: Bearer <CRON_SECRET>
 * Add ?dry=1 to see what would be sent without sending anything.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  return NextResponse.json(await runCustomerMessages({ dryRun }));
}
