import { requirePagePermission } from "@/lib/auth-guard";
import { getPrivacyRequests } from "@/app/actions/admin-privacy";
import { PrivacyClient } from "./privacy-client";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  await requirePagePermission("staff.manage");
  return <PrivacyClient rows={await getPrivacyRequests()} />;
}
