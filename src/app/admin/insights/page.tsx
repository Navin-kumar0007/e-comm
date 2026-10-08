import { requirePagePermission } from "@/lib/auth-guard";
import { getInsights } from "@/lib/insights";
import { InsightsClient } from "./insights-client";

export const dynamic = "force-dynamic";
const RANGES = [30, 90, 365];

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const staff = await requirePagePermission("reports.view");
  const d = Number((await searchParams).d);
  const days = RANGES.includes(d) ? d : 90;
  const data = await getInsights(days);
  return <InsightsClient data={JSON.parse(JSON.stringify(data))} canSeeCustomers={staff.can("customers.view")} />;
}
