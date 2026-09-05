import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // Fail closed: never validate tokens against a hardcoded fallback secret.
    console.error("AUTH_SECRET is not set — refusing to authorize protected routes.");
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  const token = await getToken({ req, secret });
  const isLoggedIn = !!token;
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const role = token?.role;

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/account', req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && (isAdminRoute || req.nextUrl.pathname.startsWith('/account'))) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/login", "/register"],
}
