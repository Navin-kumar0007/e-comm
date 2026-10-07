import { requirePagePermission } from "@/lib/auth-guard";
import { getSuppliers } from "@/app/actions/admin-purchasing";
import { SuppliersClient } from "./suppliers-client";

export default async function SuppliersPage() {
  await requirePagePermission("purchases.manage");
  const suppliers = await getSuppliers();
  return <SuppliersClient suppliers={suppliers} />;
}
