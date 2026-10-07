import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth-guard";
import { getStockCount } from "@/app/actions/admin-warehouse";
import { CountSheet } from "./count-sheet";

export default async function StockCountPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("inventory.manage");
  const { id } = await params;
  const count = await getStockCount(id);
  if (!count) notFound();
  return <CountSheet count={count} />;
}
