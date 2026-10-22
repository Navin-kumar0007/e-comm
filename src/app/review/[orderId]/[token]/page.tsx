import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { checkLinkToken } from "@/lib/signed-link";
import { getCleanProductImage } from "@/lib/utils";
import { PageHero } from "@/components/storefront/royal/page-hero";
import ReviewForm from "./review-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rate your order", robots: { index: false, follow: false } };

/** Opened from a review request: rate each product in a delivered order, no login needed. */
export default async function OrderReviewPage({ params }: { params: Promise<{ orderId: string; token: string }> }) {
  const { orderId, token } = await params;
  if (!checkLinkToken("review", orderId, token)) notFound();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } });
  if (!order) notFound();

  const products = new Map<string, { id: string; name: string; image: string }>();
  for (const i of order.items) {
    if (i.product && !products.has(i.product.id)) products.set(i.product.id, { id: i.product.id, name: i.product.name, image: getCleanProductImage(i.product.images, i.product.name) });
  }
  const reviewed = new Set(
    (await prisma.review.findMany({
      where: { productId: { in: [...products.keys()] }, userEmail: { equals: order.customerEmail, mode: "insensitive" } },
      select: { productId: true },
    })).map((r) => r.productId),
  );

  return (
    <>
      <PageHero eyebrow="Your review" title="How was your order?" subtitle={`Order #${order.id.slice(-8).toUpperCase()}`} compact />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {order.status !== "DELIVERED" ? (
          <p className="text-center text-muted-foreground">You can rate this order once it is delivered.</p>
        ) : (
          [...products.values()].map((p) => (
            <ReviewForm key={p.id} orderId={order.id} token={token} product={p} done={reviewed.has(p.id)} />
          ))
        )}
      </div>
    </>
  );
}
