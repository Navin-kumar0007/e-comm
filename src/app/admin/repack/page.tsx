import { requirePagePermission } from "@/lib/auth-guard";
import { getRepackData } from "@/app/actions/admin-warehouse";
import { RepackClient } from "./repack-client";

export default async function RepackPage({ searchParams }: { searchParams: Promise<{ material?: string }> }) {
  await requirePagePermission("inventory.manage");
  const [data, { material }] = await Promise.all([getRepackData(), searchParams]);
  return <RepackClient {...data} initialMaterial={material} />;
}
