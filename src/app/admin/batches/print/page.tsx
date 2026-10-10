import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { BatchStickerSheet, type BatchSticker } from "./batch-stickers";

export const dynamic = "force-dynamic";

export default async function BatchStickerPage({ searchParams }: { searchParams: Promise<{ items?: string; size?: string }> }) {
  await requirePagePermission("inventory.manage");
  const { items = "", size = "50x25" } = await searchParams;
  // items = "<lotId>:<copies>,…"
  const wanted = new Map(items.split(",").filter(Boolean).slice(0, 200).map((p) => {
    const [id, n] = p.split(":");
    return [id, Math.min(1000, Math.max(1, Number(n) || 1))] as const;
  }));
  const [lots, settings] = await Promise.all([
    prisma.stockLot.findMany({
      where: { id: { in: [...wanted.keys()] }, kind: "PACK" },
      include: {
        product: { select: { name: true, weight: true, mrp: true, price: true, salePrice: true, barcode: true } },
        variant: { select: { label: true, mrp: true, price: true, salePrice: true, barcode: true } },
      },
      orderBy: { lotNumber: "asc" },
    }),
    getStoreSettings(),
  ]);
  const one: BatchSticker[] = lots.map((l: any) => ({
    name: l.product?.name ?? "",
    pack: l.variant?.label ?? l.product?.weight ?? "",
    mrp: l.variant ? l.variant.mrp ?? l.variant.salePrice ?? l.variant.price : l.product?.mrp ?? l.product?.salePrice ?? l.product?.price ?? null,
    lotNumber: l.lotNumber,
    mfgDate: l.mfgDate?.toISOString() ?? null,
    expiryDate: l.expiryDate?.toISOString() ?? null,
    barcode: l.variant?.barcode ?? l.product?.barcode ?? null,
    copies: wanted.get(l.id) ?? 1,
  }));
  const stickers = one.flatMap((s) => Array.from({ length: s.copies }, () => s));
  return <BatchStickerSheet stickers={stickers} size={size === "a4" ? "a4" : "50x25"} fssai={settings.fssaiLicense ?? null} />;
}
