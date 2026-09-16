import { MobileQuickCategories } from "@/components/storefront/mobile-quick-categories";
import { HeroSection } from "@/components/storefront/hero-section";
import { DryFruitsSpotlight } from "@/components/storefront/dry-fruits-spotlight";
import { CategoryBento } from "@/components/storefront/category-bento";
import { FeaturedCarousel } from "@/components/storefront/featured-carousel";
import { SilkRouteMap } from "@/components/storefront/silk-route-map";
import { RoyalGiftingShowcase } from "@/components/storefront/royal-gifting-showcase";
import { ScrollytellingSection } from "@/components/storefront/scrollytelling-section";
import { ReviewsTicker } from "@/components/storefront/reviews-ticker";
import { NewsletterSignup } from "@/components/storefront/newsletter-signup";
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

    // High quality gourmet fallbacks if image is missing or a placehold.co link
    parsedImages = parsedImages.map((img: string) => {
      if (!img || img.includes("placehold.co")) {
        const nameLower = (p.name || "").toLowerCase();
        if (nameLower.includes("almond") || nameLower.includes("badam")) {
          return "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?q=80&w=800&auto=format&fit=crop";
        }
        if (nameLower.includes("cashew") || nameLower.includes("kaju")) {
          return "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?q=80&w=800&auto=format&fit=crop";
        }
        if (nameLower.includes("walnut") || nameLower.includes("akhrot")) {
          return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop";
        }
        if (nameLower.includes("seed") || nameLower.includes("chia") || nameLower.includes("flax")) {
          return "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?q=80&w=800&auto=format&fit=crop";
        }
        if (nameLower.includes("date") || nameLower.includes("kishmish") || nameLower.includes("raisin")) {
          return "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=800&auto=format&fit=crop";
        }
        return "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop";
      }
      return img;
    });

    if (parsedImages.length === 0) {
      parsedImages = ["https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop"];
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
            
      <main className="flex-1">
        <HeroSection />
        <MobileQuickCategories />
        <FeaturedCarousel products={featuredProducts} />
        <DryFruitsSpotlight />
        <CategoryBento />
        <SilkRouteMap />
        <RoyalGiftingShowcase />
        <ScrollytellingSection />
        <ReviewsTicker />
        <NewsletterSignup />
      </main>
    </div>
  );
}
