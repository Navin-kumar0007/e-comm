import { requirePagePermission } from "@/lib/auth-guard";
import { getAdminCustomers } from "@/app/actions/admin-customers";
import CustomersClient from "./customers-client";

export default async function CustomersPage() {
  await requirePagePermission("customers.view");
  const customers = await getAdminCustomers();
  return <CustomersClient initialCustomers={customers} />;
}
