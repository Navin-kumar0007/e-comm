import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import CouponPrintClient from "./coupon-print-client";

export default async function CouponPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("marketing.manage");
  const resolvedParams = await params;
  const coupon = await prisma.coupon.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!coupon) {
    return notFound();
  }

  return <CouponPrintClient coupon={coupon} />;
}
