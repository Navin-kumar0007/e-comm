"use client";

import { usePathname } from "next/navigation";

/** Renders its children everywhere except the admin workspace (which has its own chrome). */
export function StorefrontOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}

/** Bills and invoices are documents: no floating cart bar, chat buttons or popups over them. */
export const isDocumentRoute = (pathname: string) => pathname.startsWith("/bill/") || pathname.startsWith("/account/orders/invoice/");

export function NotOnDocuments({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  if (isDocumentRoute(pathname)) return null;
  return <>{children}</>;
}
