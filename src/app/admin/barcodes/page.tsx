import { requirePagePermission } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getBarcodeRows } from "@/app/actions/admin-barcodes";
import { BarcodesClient } from "./barcodes-client";

export default async function BarcodesPage() {
  const staff = await requirePagePermission("dashboard.view");
  if (!staff.can("inventory.manage") && !staff.can("catalog.manage")) redirect("/admin?denied=1");
  const rows = await getBarcodeRows();
  return <BarcodesClient rows={rows} />;
}
