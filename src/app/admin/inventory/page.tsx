import { requirePagePermission } from "@/lib/auth-guard";
import { getInventory } from "@/app/actions/admin-inventory";
import { InventoryClient } from "./inventory-client";

export default async function AdminInventoryPage() {
  await requirePagePermission("inventory.manage");
  const products = await getInventory();
  return <InventoryClient products={JSON.parse(JSON.stringify(products))} />;
}
