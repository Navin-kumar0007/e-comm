import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";

/**
 * Batch lookup for the code printed on a jar (e.g. B2610-001). Answers only from the
 * warehouse's packed lots: what is in the jar, when it was packed and its best-before date.
 * Supplier, cost and quantity details stay private.
 */
export async function GET(req: Request, { params }: { params: Promise<{ batchNumber: string }> }) {
  const { allowed } = rateLimit(clientKey(req, "traceability"), 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many lookups. Please wait a minute." }, { status: 429 });
  }

  const { batchNumber } = await params;
  const code = decodeURIComponent(batchNumber).trim().toUpperCase().slice(0, 40);
  if (!/^[A-Z0-9-]{3,40}$/.test(code)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const lot = await prisma.stockLot.findFirst({
      where: { lotNumber: { equals: code, mode: "insensitive" }, kind: "PACK" },
      select: {
        lotNumber: true,
        mfgDate: true,
        expiryDate: true,
        receivedAt: true,
        product: { select: { name: true, slug: true } },
        variant: { select: { label: true } },
      },
    });
    if (!lot?.product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      lotNumber: lot.lotNumber,
      productName: lot.product.name,
      productSlug: lot.product.slug,
      pack: lot.variant?.label ?? null,
      packedOn: (lot.mfgDate ?? lot.receivedAt).toISOString(),
      bestBefore: lot.expiryDate?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Traceability lookup failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
