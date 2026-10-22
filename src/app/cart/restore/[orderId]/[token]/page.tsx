import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { checkLinkToken } from "@/lib/signed-link";
import { getCleanProductImage } from "@/lib/utils";
import RestoreCart from "./restore-cart";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your saved cart", robots: { index: false, follow: false } };

/** Opened from a payment reminder: puts the unpaid order's items back in the cart and goes to checkout. */
export default async function RestoreCartPage({ params }: { params: Promise<{ orderId: string; token: string }> }) {
  const { orderId, token } = await params;
  if (!checkLinkToken("cart", orderId, token)) notFound();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } });
  if (!order) notFound();
  const variantIds = order.items.map((i) => i.variantId).filter((v): v is string => !!v);
  const variants = new Map(
    (variantIds.length ? await prisma.productVariant.findMany({ where: { id: { in: variantIds } } }) : []).map((v) => [v.id, v]),
  );

  // Today's price and stock; items no longer on sale are left out (checkout re-prices anyway).
  const items = order.items.flatMap((i) => {
    const p = i.product;
    const v = i.variantId ? variants.get(i.variantId) : undefined;
    if (!p || p.status !== "ACTIVE" || (i.variantId && !v) || (v ? v.stock : p.stock) <= 0) return [];
    return [{
      productId: p.id,
      name: p.name,
      slug: p.slug,
      price: v ? (v.salePrice ?? v.price) : (p.salePrice ?? p.price),
      image: getCleanProductImage(p.images, p.name),
      quantity: i.quantity,
      weight: i.weight,
      ...(v ? { variantId: v.id } : {}),
    }];
  });

  return <RestoreCart items={items} missing={order.items.length - items.length} />;
}
