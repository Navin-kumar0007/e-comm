import { prisma } from "@/lib/db/prisma";

// Slows down password guessing on email sign-in. Failures are kept in the audit log, so the count
// is shared by every server instance (the in-memory rate limiter is not, on Vercel).
// Google sign-in is unaffected, so a locked-out customer or owner can still get in that way.
const WINDOW_MS = 15 * 60 * 1000;
const PER_EMAIL = 5; // wrong passwords for one account
const PER_IP = 20; // wrong passwords from one network, across accounts
const ACTION = "login.failed";

export function requestIp(request: Request | undefined) {
  const fwd = request?.headers.get("x-forwarded-for") || request?.headers.get("x-real-ip") || "";
  return fwd.split(",")[0].trim() || null;
}

/** True when this email or network has had too many wrong passwords in the last 15 minutes. */
export async function signInBlocked(email: string, ip: string | null) {
  const since = new Date(Date.now() - WINDOW_MS);
  try {
    const [byEmail, byIp] = await Promise.all([
      prisma.auditLog.count({ where: { action: ACTION, entityId: email, createdAt: { gte: since } } }),
      ip ? prisma.auditLog.count({ where: { action: ACTION, ip, createdAt: { gte: since } } }) : Promise.resolve(0),
    ]);
    return byEmail >= PER_EMAIL || byIp >= PER_IP;
  } catch (e) {
    console.error("[LOGIN GUARD] Count failed:", e);
    return false; // never lock everyone out because the log is unreachable
  }
}

export async function recordFailedSignIn(email: string, ip: string | null) {
  try {
    await prisma.auditLog.create({
      data: { actor: `customer:${email}`, action: ACTION, entity: "Login", entityId: email, summary: "Wrong email or password", ip },
    });
  } catch (e) {
    console.error("[LOGIN GUARD] Record failed:", e);
  }
}
