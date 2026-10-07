import { requirePagePermission } from "@/lib/auth-guard";
import { getGstAction } from "@/app/actions/admin-finance";
import { GstClient } from "./gst-client";

export const dynamic = "force-dynamic";

export default async function GstPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await requirePagePermission("reports.view");
  const { m } = await searchParams;
  const data = await getGstAction(m);
  return <GstClient data={data} />;
}
