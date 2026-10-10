import { requirePagePermission } from "@/lib/auth-guard";
import { getCustomerDirectoryAction } from "@/app/actions/admin-customers";
import CustomersClient from "./customers-client";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; seg?: string }> }) {
  const staff = await requirePagePermission("customers.view");
  const [customers, { q, seg }] = await Promise.all([getCustomerDirectoryAction(), searchParams]);
  return <CustomersClient initialCustomers={customers} initialQuery={q ?? ""} initialSegment={seg ?? "all"} canEdit={staff.can("orders.create")} />;
}
