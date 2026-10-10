import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth-guard";
import { getCustomerProfile } from "@/lib/customers";
import { CustomerProfile } from "./customer-profile";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: Promise<{ key: string }> }) {
  const staff = await requirePagePermission("customers.view");
  const key = decodeURIComponent((await params).key).trim().toLowerCase();
  const profile = await getCustomerProfile(key);
  if (!profile) notFound();
  return <CustomerProfile p={profile} canPrivacy={staff.can("staff.manage")} />;
}
