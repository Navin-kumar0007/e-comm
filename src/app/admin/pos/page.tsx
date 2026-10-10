import { requirePagePermission } from "@/lib/auth-guard";
import { getCounterDay, getPosData } from "@/app/actions/admin-pos";
import { PosClient } from "./pos-client";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  await requirePagePermission("orders.create");
  const [data, today] = await Promise.all([getPosData(), getCounterDay()]);
  return <PosClient data={data} today={today} />;
}
