import { auth } from "@/lib/auth";

/**
 * Ensures the current request comes from an authenticated ADMIN user.
 * Throws if not — call at the top of every privileged server action / route.
 * Returns the session for convenience.
 */
export async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== "ADMIN") {
    throw new Error("Unauthorized: admin access required");
  }
  return session;
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
