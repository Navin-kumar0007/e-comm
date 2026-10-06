import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isStaffRole, roleCan, type Permission, type StaffRole } from "@/lib/permissions";

/**
 * The signed-in staff member, with their role read fresh from the database
 * (the role in the login token can be stale after a demotion). Cached per request.
 */
export const getStaffContext = cache(async () => {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, role: true } });
  if (!user || !isStaffRole(user.role)) return null;
  return {
    session,
    user: user as { id: string; email: string; name: string; role: StaffRole },
    role: user.role as StaffRole,
    can: (permission: Permission) => roleCan(user.role, permission),
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
