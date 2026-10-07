import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth-guard";
import { getPurchaseOrder } from "@/app/actions/admin-purchasing";
import { PurchaseDetail } from "./purchase-detail";

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("purchases.manage");
  const { id } = await params;
  const po = await getPurchaseOrder(id);
  if (!po) notFound();
  return <PurchaseDetail po={po} />;
}
