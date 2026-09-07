import { HeroSection } from "@/components/storefront/hero-section";
import { DryFruitsSpotlight } from "@/components/storefront/dry-fruits-spotlight";
import { CategoryBento } from "@/components/storefront/category-bento";
import { FeaturedCarousel } from "@/components/storefront/featured-carousel";
import { SilkRouteMap } from "@/components/storefront/silk-route-map";
import { RoyalGiftingShowcase } from "@/components/storefront/royal-gifting-showcase";
import { ScrollytellingSection } from "@/components/storefront/scrollytelling-section";
import { ReviewsTicker } from "@/components/storefront/reviews-ticker";
import { NewsletterSignup } from "@/components/storefront/newsletter-signup";
import { SocialProofToast } from "@/components/storefront/social-proof-toast";
import { prisma } from "@/lib/db/prisma";

export default async function Home() {
  let rawFeatured: any[] = [];
  try {
    rawFeatured = await prisma.product.findMany({
      where: { isFeatured: true, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 8,
    });
    if (rawFeatured.length === 0) {
      rawFeatured = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        take: 8,
      });
    }
  } catch (err) {
    console.error("Failed to load featured products from Prisma:", err);
  }

  const featuredProducts = rawFeatured.map((p: any) => {
    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(p.images);
    } catch {
      parsedImages = p.images ? [p.images] : [];
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      images: parsedImages,
      isOrganic: p.isOrganic,
      tags: p.tags ? p.tags.split(",") : [],
    };
  });

  return (
    <div className="flex flex-col min-h-screen">
      <SocialProofToast />
      
      <main className="flex-1">
        <HeroSection />
        <DryFruitsSpotlight />
        <CategoryBento />
        <FeaturedCarousel products={featuredProducts} />
        <SilkRouteMap />
        <RoyalGiftingShowcase />
        <ScrollytellingSection />
        <ReviewsTicker />
        <NewsletterSignup />
      </main>
    </div>
  );
}
