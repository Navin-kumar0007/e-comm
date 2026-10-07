import { requirePagePermission } from "@/lib/auth-guard";
import { getFinanceOverview, getPnlAction } from "@/app/actions/admin-finance";
import { FinanceClient } from "./finance-client";

export const dynamic = "force-dynamic";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const staff = await requirePagePermission("reports.view");
  const { m } = await searchParams;
  const [overview, detail] = await Promise.all([getFinanceOverview(), getPnlAction(m)]);
  return <FinanceClient overview={overview} detail={detail} canManage={staff.can("finance.manage")} />;
}
