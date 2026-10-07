import { requirePagePermission } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getBarcodeRows } from "@/app/actions/admin-barcodes";
import { StickerSheet } from "./sticker-sheet";

export default async function StickerPrintPage({ searchParams }: { searchParams: Promise<{ items?: string; size?: string }> }) {
  const staff = await requirePagePermission("dashboard.view");
  if (!staff.can("inventory.manage") && !staff.can("catalog.manage")) redirect("/admin?denied=1");
  const { items = "", size = "50x25" } = await searchParams;
  // items = "<rowId>:<copies>,…"
  const wanted = new Map(items.split(",").filter(Boolean).map((p) => { const [id, n] = p.split(":"); return [id, Math.min(500, Math.max(1, Number(n) || 1))] as const; }));
  const rows = (await getBarcodeRows()).filter((r) => wanted.has(r.id) && r.barcode);
  const stickers = rows.flatMap((r) => Array.from({ length: wanted.get(r.id)! }, () => r));
  return <StickerSheet stickers={stickers} size={size === "a4" ? "a4" : "50x25"} />;
}
