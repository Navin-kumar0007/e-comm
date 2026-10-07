import { requirePagePermission } from "@/lib/auth-guard";
import { getMaterials } from "@/app/actions/admin-warehouse";
import { MaterialsClient } from "./materials-client";

export default async function MaterialsPage() {
  await requirePagePermission("inventory.manage");
  const { materials, products } = await getMaterials();
  return <MaterialsClient materials={materials} products={products} />;
}
