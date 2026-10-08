import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isStaffRole, roleCan, type Permission, type StaffRole } from "@/lib/permissions";
import { checkTwoStep, TWO_STEP_COOKIE } from "@/lib/totp";

/**
 * The signed-in staff member, with their role read fresh from the database
 * (the role in the login token can be stale after a demotion). Cached per request.
 * Staff who turned on two-step login get no permissions until this browser has
 * passed the code check (`twoStepOk`).
 */
export const getStaffContext = cache(async () => {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, role: true, totpEnabledAt: true } });
  if (!user || !isStaffRole(user.role)) return null;
  let twoStepOk = !user.totpEnabledAt;
  if (!twoStepOk) {
    try {
      twoStepOk = checkTwoStep((await cookies()).get(TWO_STEP_COOKIE)?.value, user.id);
    } catch {
      twoStepOk = false;
    }
  }
  return {
    session,
    user: { id: user.id, email: user.email, name: user.name, role: user.role } as { id: string; email: string; name: string; role: StaffRole },
    role: user.role as StaffRole,
    twoStepEnabled: !!user.totpEnabledAt,
    twoStepOk,
    can: (permission: Permission) => twoStepOk && roleCan(user.role, permission),
  };
});

/**
 * For server actions / API routes: throws unless the caller is staff with this permission.
 * Returns the session for convenience.
 */
export async function requirePermission(permission: Permission) {
  const ctx = await getStaffContext();
  if (!ctx || !ctx.can(permission)) {
    throw new Error(`Unauthorized: '${permission}' permission required`);
  }
  return ctx.session!;
}

/** For admin pages: redirects instead of throwing. */
export async function requirePagePermission(permission: Permission) {
  const ctx = await getStaffContext();
  if (!ctx) redirect("/login");
  if (!ctx.twoStepOk) redirect("/admin-verify");
  if (!ctx.can(permission)) redirect("/admin?denied=1");
  return ctx;
}

/** Owner-only (full ADMIN role). */
export async function requireAdmin() {
  return requirePermission("staff.manage");
}

/**
 * Ensures the current request comes from any authenticated user.
 * Throws if not. Returns the session.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: authentication required");
  }
  return session;
}

/** "admin:<email>"-style actor string for audit logs. */
export async function staffActor() {
  const ctx = await getStaffContext();
  return ctx ? `${ctx.role.toLowerCase()}:${ctx.user.email}` : "system";
}
