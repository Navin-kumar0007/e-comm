import { requirePagePermission } from "@/lib/auth-guard";
import { getExpenses } from "@/app/actions/admin-finance";
import { ExpensesClient } from "./expenses-client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await requirePagePermission("finance.manage");
  const { m } = await searchParams;
  const data = await getExpenses(m);
  return <ExpensesClient {...data} />;
}
