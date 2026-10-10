import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";

/** Bump when the privacy notice changes, so each consent shows which wording the person saw. */
export const NOTICE_VERSION = "2026-10";

export type ConsentPurpose = "TERMS" | "WHATSAPP_OFFERS" | "EMAIL_OFFERS" | "ANALYTICS";
export type ConsentSource = "SIGNUP" | "CHECKOUT" | "ACCOUNT" | "POPUP" | "ADMIN";

/** Records a consent given or withdrawn. Never throws: failing to log must not block the customer. */
export async function recordConsent(c: { purpose: ConsentPurpose; granted: boolean; source: ConsentSource; userId?: string | null; phone?: string | null; email?: string | null }) {
  try {
    const ip = await headers()
      .then((h) => (h.get("x-forwarded-for") || h.get("x-real-ip") || "").split(",")[0].trim() || null)
      .catch(() => null);
    await prisma.consentRecord.create({
      data: { purpose: c.purpose, granted: c.granted, source: c.source, userId: c.userId ?? null, phone: c.phone ?? null, email: c.email ?? null, noticeVersion: NOTICE_VERSION, ip },
    });
  } catch (e) {
    console.error("[CONSENT] Failed to record", c.purpose, e);
  }
}
