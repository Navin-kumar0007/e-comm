import type { Metadata } from "next";
import { PincodeChecker } from "@/components/storefront/pincode-checker";
import { ProductPurchase } from "@/components/storefront/product-purchase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck, ArrowLeft, Star } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { ProductReviews } from "./product-reviews";
import { PackViewer } from "@/components/storefront/royal/pack-viewer";
import { JarViewer } from "@/components/storefront/royal/jar-viewer";
import { getProductLabel } from "@/lib/product-labels";
import { ProductDescriptionRenderer, extractProductShortSummary } from "@/components/storefront/product-description-renderer";
import { WhatsAppPriceAlertModal } from "@/components/storefront/whatsapp-price-alert-modal";
import { getCleanProductImage } from "@/lib/utils";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://spicynuts.in";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
  });
  if (!product || product.status !== "ACTIVE") return { title: "Product Not Found" };

  let images: string[] = [];
  try {
    images = JSON.parse(product.images);
  } catch {
    images = [];
  }

  return {
    title: `${product.name} — Buy Online at Spicy Nuts`,
    description:
      product.description?.slice(0, 160) ||
      `Buy ${product.name} online. Premium quality, 100% natural. Free shipping above ₹999.`,
    openGraph: {
      title: `${product.name} — Spicy Nuts`,
      description:
        product.description?.slice(0, 160) || `Buy ${product.name} online.`,
      images: images.length > 0 ? [images[0]] : [],
      url: `${siteUrl}/product/${product.slug}`,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const found = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
    include: { variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { price: "asc" }] } },
  });
  const sizes = (found?.variants ?? []).map((v) => ({ id: v.id, label: v.label, price: v.price, salePrice: v.salePrice, stock: v.stock }));
  // Drafts, archived products and custom blends are not publicly viewable.
  const rawProduct = found?.status === "ACTIVE" ? found : null;
  const cleanCover = rawProduct ? getCleanProductImage(rawProduct.images, rawProduct.name) : "/placeholder.jpg";
  const product = rawProduct
    ? {
        ...rawProduct,
        images: [cleanCover],
        tags: rawProduct.tags ? rawProduct.tags.split(",") : [],
      }
    : null;

  if (!product) {
    notFound();
  }

  // Real review aggregate (only rendered when reviews exist)
  const reviewStats = await prisma.review.aggregate({
    where: { productId: product.id, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const reviewCount = reviewStats._count.rating ?? 0;
  const avgRating = reviewCount > 0 ? Number(reviewStats._avg.rating ?? 0) : 0;
  const roundedRating = Math.round(avgRating);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: cleanCover,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: "Spicy Nuts",
    },
    sku: product.slug,
    offers: {
      "@type": "Offer",
      price: product.salePrice || product.price,
      priceCurrency: "INR",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "B.M.V. Spices & Dry Fruits",
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    ...(reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount,
      },
    }),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is ${product.name} 100% natural and organic?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, our ${product.name} is ${product.isOrganic ? "certified organic" : "100% natural"}, free from any artificial colors, preservatives, or additives. We source directly from trusted partner farms.`,
        },
      },
      {
        "@type": "Question",
        name: `How should I store the ${product.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `For maximum freshness and shelf life, store your ${product.name} in an airtight container in a cool, dry place away from direct sunlight.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the delivery time for ${product.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "We typically process and dispatch orders within 24 hours. Delivery across India usually takes 3-7 business days depending on your location.",
        },
      },
    ],
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://spicynuts.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: "https://spicynuts.in/shop",
      },
      { "@type": "ListItem", position: 3, name: product.name },
    ],
  };

  const rawList = Array.isArray(product.images)
    ? product.images
    : (typeof product.images === "string" ? (() => { try { return JSON.parse(product.images); } catch { return [product.images]; } })() : []);
  const displayImages = [
    cleanCover,
    ...rawList.filter((img: string) => img && !img.includes("placehold.co") && img !== cleanCover)
  ];
  const jarLabel = getProductLabel(product.slug);

  return (
    <div className="pb-28 md:pb-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd, breadcrumbLd, faqLd]),
        }}
      />

      {/* Mobile: full-bleed 3D stage under the header */}
      <div className="pt-header md:hidden">
        {jarLabel ? <JarViewer label={jarLabel} images={displayImages} name={product.name} weight={product.weight || "250g"} /> : <PackViewer images={displayImages} name={product.name} weight={product.weight || "250g"} />}
      </div>

      <div className="container mx-auto max-w-7xl md:px-6 md:pt-[calc(var(--header-h)+20px)] lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 hidden items-center gap-2 text-[13px] text-muted-foreground md:flex">
          <Link href="/shop" className="flex items-center gap-1 font-semibold hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Shop
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <article className="md:grid md:grid-cols-2 md:gap-10">
          <div className="hidden md:sticky md:top-[calc(var(--header-h)+20px)] md:block md:self-start">
            {jarLabel ? <JarViewer label={jarLabel} images={displayImages} name={product.name} weight={product.weight || "250g"} /> : <PackViewer images={displayImages} name={product.name} weight={product.weight || "250g"} />}
          </div>

          <div className="relative -mt-6 flex flex-col gap-3 rounded-t-[26px] bg-background px-4 pt-5 md:mt-0 md:rounded-none md:px-0 md:pt-2">
            <span className="eyebrow text-brand-gold-deep">Dry fruits &amp; seeds</span>
            <h1 className="-mt-1 font-heading text-[34px] font-bold leading-[0.95] text-primary md:text-[46px]">{product.name}</h1>
            {reviewCount > 0 ? (
              <a href="#reviews" className="flex items-center gap-1 text-brand-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < roundedRating ? "fill-current" : "text-muted-foreground/30"}`} />
                ))}
                <span className="ml-1 text-[13px] text-muted-foreground">({avgRating.toFixed(1)}/5 · {reviewCount} {reviewCount === 1 ? "review" : "reviews"})</span>
              </a>
            ) : (
              <a href="#reviews" className="self-start text-[13px] font-semibold text-muted-foreground underline underline-offset-[3px]">Reviews · be the first to review</a>
            )}

            <ProductPurchase
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                image: product.images[0],
                price: Number(product.price),
                salePrice: product.salePrice ? Number(product.salePrice) : null,
                stock: product.stock,
                weight: product.weight || "Standard",
              }}
              sizes={sizes}
            />

            <div className="flex flex-wrap items-center gap-2">
              <WishlistButton productId={product.id} variant="outline" />
              <WhatsAppPriceAlertModal
                productId={product.id}
                productName={product.name}
                currentPrice={product.salePrice || product.price}
              />
            </div>

            <div className="jaali flex items-center gap-3 rounded-2xl p-3.5 text-white">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-dashed border-brand-gold font-royal text-[10px] font-bold text-brand-gold">%</span>
              <span className="flex flex-1 flex-col leading-tight">
                <strong className="text-sm">15% off with ROYAL15</strong>
                <span className="text-xs text-white/80">Apply the code at checkout</span>
              </span>
            </div>

            <div className="royal-card p-3.5">
              <PincodeChecker price={product.salePrice ? Number(product.salePrice) : Number(product.price)} />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted p-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h4 className="text-[13px] font-bold">Certified Quality</h4>
                  <p className="text-[11.5px] text-muted-foreground">Lab tested for purity</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted p-3">
                <Truck className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h4 className="text-[13px] font-bold">Fast Delivery</h4>
                  <p className="text-[11.5px] text-muted-foreground">Free shipping over ₹999</p>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{extractProductShortSummary(product.description)}</p>
          </div>
        </article>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Full Description & Nutrition */}
      <div className="mt-10 border-t border-border pt-10 md:mt-14">
        <div className="max-w-3xl mx-auto space-y-12">
          <section>
            <h2 className="mb-3 font-heading text-[30px] font-bold text-primary">
              About this product
            </h2>
            <ProductDescriptionRenderer description={product.description} productName={product.name} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            <section className="royal-card p-5">
              <h2 className="mb-3 font-heading text-2xl font-bold text-primary">
                Ingredients & Sourcing
              </h2>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 100%
                  Pure, Unadulterated Product
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />{" "}
                  Sourced directly from partner farms
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> No
                  artificial colors or preservatives
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />{" "}
                  Ethically harvested
                </li>
              </ul>
            </section>

            <section className="royal-card p-5">
              <h2 className="mb-3 font-heading text-2xl font-bold text-primary">
                Product Details
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Net Weight</span>
                  <span className="font-medium">
                    {product.weight || "See pack"}
                  </span>
                </li>
                <li className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Sourcing</span>
                  <span className="font-medium">
                    {product.isOrganic
                      ? "Certified Organic"
                      : "Naturally sourced"}
                  </span>
                </li>
                <li className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Preservatives</span>
                  <span className="font-medium">None added</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Nutrition facts</span>
                  <span className="font-medium">Printed on pack</span>
                </li>
              </ul>
            </section>
          </div>

          <section className="pt-12 border-t border-border/50">
            <h2 className="mb-4 font-heading text-[30px] font-bold text-primary">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Is {product.name} 100% natural?
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Yes, our {product.name} is{" "}
                  {product.isOrganic ? "certified organic" : "100% natural"},
                  free from any artificial colors, preservatives, or additives.
                  We source directly from trusted partner farms.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  How should I store this?
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  For maximum freshness and shelf life, store in an airtight
                  container in a cool, dry place away from direct sunlight.
                </p>
              </div>
            </div>
          </section>

          <section className="pt-12 border-t border-border/50">
            <h2 className="mb-3 font-heading text-[30px] font-bold text-primary">How to Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Add a touch of authentic flavor to your daily meals. For best
              results, store in a cool, dry place away from direct sunlight.
              Ensure the jar is tightly sealed after every use to maintain
              freshness and aroma.
            </p>
          </section>
        </div>
      </div>

      {/* Product Reviews Section */}
      <div id="reviews" className="mt-12 scroll-mt-32 border-t border-border pt-10">
        <ProductReviews productId={product.id} />
      </div>

      </div>
    </div>
  );
}
