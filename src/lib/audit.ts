import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { staffActor } from "@/lib/auth-guard";

export interface AuditEntry {
  action: string; // e.g. "product.update"
  entity?: string;
  entityId?: string | null;
  summary: string;
  data?: unknown;
  actor?: string; // defaults to the signed-in staff member
}

/** Records an admin change. Never throws: a failed log must not undo the change itself. */
export async function audit(entry: AuditEntry) {
  try {
    const [actor, ip] = await Promise.all([
      entry.actor ?? staffActor(),
      headers().then((h) => (h.get("x-forwarded-for") || h.get("x-real-ip") || "").split(",")[0].trim() || null).catch(() => null),
    ]);
    let data: string | null = null;
    if (entry.data !== undefined) {
      data = JSON.stringify(entry.data);
      if (data.length > 8000) data = data.slice(0, 8000);
    }
    await prisma.auditLog.create({
      data: { actor, action: entry.action, entity: entry.entity ?? null, entityId: entry.entityId ?? null, summary: entry.summary.slice(0, 300), data, ip },
    });
  } catch (e) {
    console.error("[AUDIT] Failed to record", entry.action, e);
  }
}

/** Only the fields that changed, for a compact before/after record. */
export function diff(before: Record<string, any> | null | undefined, after: Record<string, any>) {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of Object.keys(after)) {
    const a = before?.[k];
    const b = after[k];
    const same = a instanceof Date || b instanceof Date ? String(a) === String(b) : JSON.stringify(a) === JSON.stringify(b);
    if (!same && b !== undefined) out[k] = { from: a ?? null, to: b ?? null };
  }
  return out;
}
