import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const NOT_FOUND = "No order found with that Order ID and email. Please check both and try again.";

export async function GET(req: Request) {
  const { allowed } = rateLimit(clientKey(req, "track"), 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId")?.trim() || "";
  const email = url.searchParams.get("email")?.trim().toLowerCase() || "";

  if (!orderId || !email) {
    return NextResponse.json({ error: "Order ID and email are both required" }, { status: 400 });
  }

  // Accept the full id, or the short "NW-XXXXXXXX" code (last 8 chars of the id).
  const short = orderId.replace(/^NW-/i, "").replace(/^#/, "").toLowerCase();
  const candidates = await prisma.order.findMany({
    where: {
      customerEmail: { equals: email, mode: "insensitive" },
      status: { not: "DELETED" },
      OR: [{ id: orderId }, ...(short.length === 8 ? [{ id: { endsWith: short } }] : [])],
    },
    select: { id: true },
    take: 2,
  });

  // Same response for "wrong id" and "wrong email" so this can't be used to probe orders.
  if (candidates.length !== 1) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  return NextResponse.json({ orderId: candidates[0].id });
}
