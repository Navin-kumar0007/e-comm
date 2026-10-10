import { RoyalHero } from "@/components/storefront/royal/royal-hero";
import { CollectionCoverflow } from "@/components/storefront/royal/collection-coverflow";
import { GiftTray, type GiftOption } from "@/components/storefront/royal/gift-tray";
import { RoyalShelf, UseAndAtelier, FounderSection, TrustStrip } from "@/components/storefront/royal/home-sections";
import type { ProductCardProduct } from "@/components/storefront/product-card";
import { packLabel } from "@/components/storefront/royal/pack-shot";
import { prisma } from "@/lib/db/prisma";
import { getCleanProductImage } from "@/lib/utils";
import type { Metadata } from "next";
import { getSiteContent, liveBanners, type HomeSectionKey } from "@/lib/site-content";
import { OfferBanners } from "@/components/storefront/offer-banners";

// Rebuilt in the background at most every 10 minutes (banners start and stop on their dates),
// and straight away when anything is saved in the website editor.
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteContent("seo");
  return { title: { absolute: seo.homeTitle }, description: seo.homeDescription };
}

// Gift tray picks, in display order (falls back to whatever is active).
const GIFT_SLUGS = ["california-almond", "walnut", "dry-dates", "kishmish-raisins", "pistachios", "kaju-cashews"];

async function getHomeData() {
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      include: { variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { price: "asc" }] } },
    });

    const shelf: ProductCardProduct[] = products.slice(0, 8).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      images: p.images,
      weight: p.weight,
      stock: p.stock,
      variants: p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, salePrice: v.salePrice, stock: v.stock })),
    }));

    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const giftPool = [...GIFT_SLUGS.map((s) => bySlug.get(s)).filter((p) => p !== undefined), ...products].filter(
      (p, i, all) => all.findIndex((q) => q.id === p.id) === i,
    );
    const gifts: GiftOption[] = giftPool.slice(0, 6).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      label: packLabel(p.name).split(" ").slice(0, 2).join(" "),
      image: getCleanProductImage(p.images, p.name),
      price: Number(p.salePrice ?? p.price),
      weight: p.weight || "250g",
    }));

    return { shelf, gifts };
  } catch (err) {
    console.error("Failed to load home products:", err);
    return { shelf: [], gifts: [] };
  }
}

export default async function Home() {
  const [{ shelf, gifts }, hero, banners, sections] = await Promise.all([getHomeData(), getSiteContent("hero"), getSiteContent("banners"), getSiteContent("sections")]);
  const blocks: Record<HomeSectionKey, React.ReactNode> = {
    collections: <CollectionCoverflow key="collections" />,
    shelf: <RoyalShelf key="shelf" products={shelf} />,
    gifts: <GiftTray key="gifts" options={gifts} />,
    atelier: <UseAndAtelier key="atelier" />,
    founder: <FounderSection key="founder" />,
    trust: <TrustStrip key="trust" />,
  };
  const live = liveBanners(banners);

  return (
    <div className="flex min-h-screen flex-col">
      <RoyalHero {...hero} />
      {live.length > 0 && <OfferBanners banners={live} />}
      {sections.order.filter((k) => !sections.hidden.includes(k)).map((k) => blocks[k])}
    </div>
  );
}
