import { requirePagePermission } from "@/lib/auth-guard";
import { getStockCounts } from "@/app/actions/admin-warehouse";
import { CountsClient } from "./counts-client";

export default async function StockCountsPage() {
  await requirePagePermission("inventory.manage");
  const counts = await getStockCounts();
  return <CountsClient counts={counts} />;
}
