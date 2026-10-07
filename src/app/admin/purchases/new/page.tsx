import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth-guard";
import { getPurchaseFormData, getPurchaseOrder } from "@/app/actions/admin-purchasing";
import { PurchaseForm } from "./purchase-form";

export default async function NewPurchasePage({ searchParams }: { searchParams: Promise<{ supplier?: string; edit?: string }> }) {
  await requirePagePermission("purchases.manage");
  const { supplier, edit } = await searchParams;
  const [data, existing] = await Promise.all([getPurchaseFormData(), edit ? getPurchaseOrder(edit) : null]);
  if (edit && !existing) notFound();
  return <PurchaseForm data={JSON.parse(JSON.stringify(data))} existing={existing} supplierId={supplier} />;
}
