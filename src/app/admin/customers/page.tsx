import { getAdminCustomers } from "@/app/actions/admin-customers";
import CustomersClient from "./customers-client";

export default async function CustomersPage() {
  const customers = await getAdminCustomers();
  return <CustomersClient initialCustomers={customers} />;
}
