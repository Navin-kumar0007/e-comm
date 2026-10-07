import { requirePagePermission } from "@/lib/auth-guard";
import { getLots } from "@/app/actions/admin-warehouse";
import { BatchesClient } from "./batches-client";

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const staff = await requirePagePermission("inventory.manage");
  const [{ lots, unassigned }, { q }] = await Promise.all([getLots(), searchParams]);
  return <BatchesClient lots={lots} unassigned={unassigned} canTrace={staff.can("orders.view")} initialQuery={q ?? ""} />;
}
