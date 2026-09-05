import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck, Truck, ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db/prisma';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { WishlistButton } from '@/components/storefront/wishlist-button';
import { ProductReviews } from './product-reviews';
import { ProductGallery } from '@/components/storefront/product-gallery';



export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const rawProduct = await prisma.product.findUnique({ where: { slug: resolvedParams.slug } });
  const product = rawProduct ? {...rawProduct, images: JSON.parse(rawProduct.images), tags: rawProduct.tags ? rawProduct.tags.split(',') : []} : null;

  if (!product) {
    notFound();
  }

  // Real review aggregate (only rendered when reviews exist)
  const reviewStats = await prisma.review.aggregate({
    where: { productId: product.id, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const reviewCount = reviewStats._count.rating ?? 0;
  const avgRating = reviewCount > 0 ? Number(reviewStats._avg.rating ?? 0) : 0;
  const roundedRating = Math.round(avgRating);


  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images[0],
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.salePrice || product.price,
      priceCurrency: 'INR',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount,
      },
    }),
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-28 md:pb-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/shop" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* Product Visuals (Left Col) */}
        <div className="space-y-6">
          <ProductGallery
            images={product.images}
            productName={product.name}
            isOrganic={product.isOrganic}
          />
        </div>

        {/* Product Details (Right Col) */}
        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight mb-2">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-4">
              {reviewCount > 0 ? (
                <div className="flex items-center gap-1 text-brand-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < roundedRating ? 'fill-current' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                  <span className="text-muted-foreground text-sm ml-1">
                    ({avgRating.toFixed(1)}/5 from {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">No reviews yet — be the first to review</span>
              )}
            </div>

            <div className="flex items-baseline gap-4 mb-6">
              {product.salePrice ? (
                <>
                  <span className="text-3xl font-bold text-primary">₹{product.salePrice}</span>
                  <span className="text-xl text-muted-foreground line-through">₹{product.price}</span>
                  <Badge variant="destructive" className="ml-2">Save ₹{(Number(product.price) - Number(product.salePrice)).toFixed(0)}</Badge>
                </>
              ) : (
                <span className="text-3xl font-bold text-primary">₹{product.price}</span>
              )}
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="h-px w-full bg-border/50 my-6" />

          {/* Options */}
          <div className="mb-4 space-y-4">
            <h3 className="font-medium text-foreground">Select Quantity/Weight</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 rounded-full border border-primary bg-primary/10 text-primary text-sm font-medium">
                {product.weight || "Standard"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.salePrice ? Number(product.salePrice) : Number(product.price),
                  image: product.images[0],
                  weight: product.weight || 'Standard',
                }}
                size="lg"
                fullWidth
                className="text-lg h-14"
              />
            </div>
            <div className="h-14 shrink-0 flex items-center justify-center">
              <WishlistButton productId={product.id} variant="outline" />
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
              <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Certified Quality</h4>
                <p className="text-xs text-muted-foreground">Lab tested for purity</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
              <Truck className="w-6 h-6 text-primary shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Fast Delivery</h4>
                <p className="text-xs text-muted-foreground">Free shipping over ₹999</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Full Description & Nutrition */}
      <div className="mt-16 pt-12 border-t border-border/50">
        <div className="max-w-3xl mx-auto space-y-12">
          <section>
            <h2 className="text-2xl font-heading font-bold mb-4">About this product</h2>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            <section className="bg-muted/30 p-6 rounded-2xl border border-border/50">
              <h2 className="text-xl font-heading font-bold mb-4">Ingredients & Sourcing</h2>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> 100% Pure, Unadulterated Product</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Sourced directly from partner farms</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> No artificial colors or preservatives</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Ethically harvested</li>
              </ul>
            </section>
            
            <section className="bg-muted/30 p-6 rounded-2xl border border-border/50">
              <h2 className="text-xl font-heading font-bold mb-4">Product Details</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Net Weight</span>
                  <span className="font-medium">{product.weight || 'See pack'}</span>
                </li>
                <li className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Sourcing</span>
                  <span className="font-medium">{product.isOrganic ? 'Certified Organic' : 'Naturally sourced'}</span>
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
          
          <section className="pt-4">
            <h2 className="text-2xl font-heading font-bold mb-4">How to Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Add a touch of authentic flavor to your daily meals. For best results, store in a cool, dry place away from direct sunlight. 
              Ensure the jar is tightly sealed after every use to maintain freshness and aroma.
            </p>
          </section>
        </div>
      </div>
      
      {/* Product Reviews Section */}
      <div className="mt-20 border-t border-border/50 pt-16">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
