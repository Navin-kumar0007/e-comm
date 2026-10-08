import { getSecurityStatus } from "@/app/actions/admin-security";
import { SecurityClient } from "./security-client";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const status = await getSecurityStatus();
  return <SecurityClient status={status} />;
}
