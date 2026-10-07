import { requirePagePermission } from "@/lib/auth-guard";
import { getInventory } from "@/app/actions/admin-inventory";
import { InventoryClient } from "./inventory-client";

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePagePermission("inventory.manage");
  const [products, { q }] = await Promise.all([getInventory(), searchParams]);
  return <InventoryClient products={JSON.parse(JSON.stringify(products))} initialQuery={q ?? ""} />;
}
