import { requirePagePermission } from "@/lib/auth-guard";
import { getCodOutstanding, getPayables, getRazorpayStatus } from "@/app/actions/admin-finance";
import { PaymentsClient } from "./payments-client";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requirePagePermission("finance.manage");
  const [{ tab }, rzp, cod, payables] = await Promise.all([searchParams, getRazorpayStatus(), getCodOutstanding(), getPayables()]);
  return <PaymentsClient initialTab={tab === "cod" || tab === "suppliers" ? tab : "razorpay"} rzp={rzp} cod={cod} payables={payables} />;
}
