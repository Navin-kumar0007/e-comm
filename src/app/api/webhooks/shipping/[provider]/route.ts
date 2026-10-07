import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getProvider } from "@/lib/shipping";
import { applyShipmentUpdate } from "@/lib/shipping/service";

/**
 * Status push from a delivery partner.
 * Configure in the partner's panel as:
 *   https://www.spicynuts.in/api/webhooks/shipping/xpressbees?token=<SHIPPING_WEBHOOK_SECRET>
 * Shiprocket rejects webhook URLs containing "shiprocket", so it uses the alias
 *   https://www.spicynuts.in/api/webhooks/shipping/parcel   (token in the x-api-key header)
 * Polling (/api/cron/sync-shipments) remains the safety net if pushes are missed.
 */
const PROVIDER_ALIASES: Record<string, string> = { PARCEL: "SHIPROCKET" };

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const secret = process.env.SHIPPING_WEBHOOK_SECRET;
  const token = new URL(req.url).searchParams.get("token") || req.headers.get("x-webhook-token") || req.headers.get("x-api-key") || "";
  if (!secret || token.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider: providerParam } = await params;
  const key = providerParam.toUpperCase();
  const provider = getProvider(PROVIDER_ALIASES[key] ?? key);
  if (!provider?.parseWebhook) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const updates = provider.parseWebhook(body);
  let applied = 0;
  try {
    for (const u of updates) {
      const shipment = await prisma.shipment.findFirst({ where: { awb: u.awb, provider: provider.id }, orderBy: { createdAt: "desc" } });
      if (!shipment) continue;
      await applyShipmentUpdate(shipment, u, `courier:${provider.id.toLowerCase()}`);
      applied++;
    }
  } catch (e) {
    console.error("[SHIPPING WEBHOOK] Failed:", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  if (updates.length === 0) console.warn(`[SHIPPING WEBHOOK] ${provider.id}: no recognisable updates in payload`, JSON.stringify(body).slice(0, 500));
  return NextResponse.json({ ok: true, received: updates.length, applied });
}
