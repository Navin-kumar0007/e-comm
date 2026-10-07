import { requirePagePermission } from "@/lib/auth-guard";
import { getAdminCustomers } from "@/app/actions/admin-customers";
import CustomersClient from "./customers-client";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePagePermission("customers.view");
  const [customers, { q }] = await Promise.all([getAdminCustomers(), searchParams]);
  return <CustomersClient initialCustomers={customers} initialQuery={q ?? ""} />;
}
