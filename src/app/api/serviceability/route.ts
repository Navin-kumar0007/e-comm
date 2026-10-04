import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { checkDelivery } from "@/lib/shipping/service";

export async function GET(req: Request) {
  const { allowed } = rateLimit(clientKey(req, "serviceability"), 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(req.url);
  const pincode = (url.searchParams.get("pincode") || "").trim();
  const orderValue = Number(url.searchParams.get("value")) || undefined;

  const result = await checkDelivery(pincode, { orderValue });
  return NextResponse.json({
    serviceable: result.serviceable,
    codAvailable: result.codAvailable,
    message: result.message,
  });
}
