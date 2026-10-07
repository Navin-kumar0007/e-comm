import { requirePagePermission } from "@/lib/auth-guard";
import { getPurchaseOrders } from "@/app/actions/admin-purchasing";
import { PurchasesClient } from "./purchases-client";

export default async function PurchasesPage() {
  await requirePagePermission("purchases.manage");
  const orders = await getPurchaseOrders();
  return <PurchasesClient orders={orders} />;
}
