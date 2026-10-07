import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

/**
 * Meta WhatsApp Cloud API webhook.
 * In the Meta app → WhatsApp → Configuration:
 *   Callback URL:  https://www.spicynuts.in/api/webhooks/whatsapp
 *   Verify token:  the value of WHATSAPP_VERIFY_TOKEN
 *   Webhook fields: subscribe to "messages"
 *
 * Env: WHATSAPP_VERIFY_TOKEN (required), WHATSAPP_APP_SECRET (recommended:
 * App settings → Basic → App secret; used to check Meta's signature).
 */

// Meta calls this once when you click "Verify and save".
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token") || "";
  const challenge = url.searchParams.get("hub.challenge") || "";
  const expected = process.env.WHATSAPP_VERIFY_TOKEN || "";
  if (mode === "subscribe" && expected && token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Customer replies and delivery statuses.
export async function POST(req: Request) {
  const raw = await req.text();

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const sig = req.headers.get("x-hub-signature-256") || "";
    const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(raw).digest("hex");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ error: "Bad signature" }, { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  try {
    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value ?? {};
        // Messages customers send to the brand number: keep them in the WhatsApp log.
        for (const m of value.messages ?? []) {
          const text = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? `[${m.type ?? "message"}]`;
          await prisma.whatsAppLog.create({
            data: { phone: String(m.from ?? ""), message: String(text).slice(0, 2000), type: "INBOUND", status: "RECEIVED" },
          });
        }
        for (const s of value.statuses ?? []) {
          if (s.status === "failed") console.warn("[WhatsApp] Delivery failed:", s.recipient_id, JSON.stringify(s.errors ?? []).slice(0, 300));
        }
      }
    }
  } catch (e) {
    console.error("[WhatsApp webhook] Failed:", e);
  }
  // Always 200 so Meta doesn't keep retrying.
  return NextResponse.json({ ok: true });
}
