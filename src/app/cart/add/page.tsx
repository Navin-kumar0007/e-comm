import { prisma } from "@/lib/db/prisma";
import { getCleanProductImage } from "@/lib/utils";
import { CartHandoff, type HandoffLine } from "./cart-handoff";

export const metadata = { title: "Adding to your cart", robots: { index: false, follow: false } };

/**
 * /cart/add?items=california-almond:2,walnut:1 — the landing page's basket hands over here.
 * Prices, names and stock come from the database, never from the link; the jars are then put
 * in the shopper's cart and they continue to checkout.
 */
export default async function CartAddPage({ searchParams }: { searchParams: Promise<{ items?: string }> }) {
  const { items = "" } = await searchParams;
  const wanted = items
    .split(",")
    .map((part) => part.trim().split(":"))
    .filter(([slug]) => /^[a-z0-9-]{1,80}$/.test(slug ?? ""))
    .slice(0, 20)
    .map(([slug, q]) => ({ slug, qty: Math.min(10, Math.max(1, Number.parseInt(q ?? "1", 10) || 1)) }));

  const products = wanted.length
    ? await prisma.product.findMany({
        where: { slug: { in: wanted.map((w) => w.slug) }, status: "ACTIVE" },
        select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true, weight: true, stock: true },
      })
    : [];

  const lines: HandoffLine[] = wanted.flatMap((w) => {
    const p = products.find((x) => x.slug === w.slug);
    return p
      ? [{ productId: p.id, name: p.name, slug: p.slug, price: Number(p.salePrice ?? p.price), image: getCleanProductImage(p.images, p.name), weight: p.weight || "Standard", qty: w.qty, inStock: p.stock > 0 }]
      : [];
  });

  return <CartHandoff lines={lines} />;
}
