"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Check, ShoppingBag, Star } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  isOrganic: boolean;
  tags: string[];
}

export function FeaturedCarousel({ products }: { products: Product[] }) {
  const addItem = useCartStore((s) => s.addItem);
  
  // Track selected weight for each product: "250g" | "500g" | "1kg"
  const [selectedWeights, setSelectedWeights] = useState<Record<string, string>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  if (!products || products.length === 0) return null;

  const handleAddToCart = (product: Product, price: number, weight: string, image: string) => {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: price,
      weight: weight,
      image: image,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    toast.success(`Added ${product.name} (${weight}) to cart!`, {
      description: "Free express shipping on orders above ₹999.",
    });

    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  return (
    <section className="py-24 bg-[#FAF7F2] dark:bg-zinc-950">
      <div className="container px-4 md:px-6 mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 font-mono mb-2 block">
              Handpicked Essentials
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-heading">
              Our Bestselling Stars
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              Royal dry fruits, hand-ground masalas, and nutritious superfoods loved by our patrons.
            </p>
          </div>
          <Link href="/shop" className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors">
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-3 md:-ml-5">
            {products.map((product) => {
              const basePrice = product.salePrice ?? product.price;
              const hasDiscount = product.salePrice && product.salePrice < product.price;
              const primaryImage = (product.images && product.images.length > 0) ? product.images[0] : "/jar3.jpg";

              // Determine weight options
              const isSpice = product.slug.includes("chai") || product.slug.includes("garam") || product.slug.includes("turmeric");
              const weightOptions = isSpice
                ? ["50g", "100g", "250g"]
                : ["250g", "500g", "1kg"];

              const currentWeight = selectedWeights[product.id] || (isSpice ? "100g" : "500g");

              // Compute scaled price
              let multiplier = 1;
              if (currentWeight === "250g" && !isSpice) multiplier = 0.55;
              if (currentWeight === "1kg" && !isSpice) multiplier = 1.9;
              if (currentWeight === "50g" && isSpice) multiplier = 0.55;
              if (currentWeight === "250g" && isSpice) multiplier = 2.2;

              const activePrice = Math.round(basePrice * multiplier);
              const activeMrp = Math.round(product.price * multiplier);

              let badgeText = "Bestseller";
              let badgeColor = "bg-amber-500 text-black";

              if (product.slug.includes("mamra") || product.slug.includes("almond")) {
                badgeText = "👑 High Oil Mamra";
                badgeColor = "bg-amber-600 text-white";
              } else if (product.slug.includes("cashew")) {
                badgeText = "🌿 King W180";
                badgeColor = "bg-emerald-700 text-white";
              } else if (product.slug.includes("walnut")) {
                badgeText = "🧠 Omega-3 Rich";
                badgeColor = "bg-teal-700 text-white";
              } else if (product.slug.includes("chai")) {
                badgeText = "🔥 Slow-Roasted";
                badgeColor = "bg-orange-700 text-white";
              } else if (product.slug.includes("turmeric")) {
                badgeText = "✨ 8-12% Curcumin";
                badgeColor = "bg-amber-700 text-white";
              } else if (product.isOrganic) {
                badgeText = "🌿 100% Organic";
                badgeColor = "bg-emerald-800 text-white";
              }

              const isAdded = addedIds[product.id];

              return (
                <CarouselItem key={product.id} className="pl-3 md:pl-5 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="h-full overflow-hidden border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl group flex flex-col justify-between">
                      <CardContent className="p-0">
                        {/* Image Container */}
                        <div className="relative aspect-[4/3.8] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                          <Badge className={`absolute top-4 left-4 z-20 font-bold uppercase text-[10px] tracking-wider border-none shadow-md ${badgeColor}`}>
                            {badgeText}
                          </Badge>

                          {hasDiscount && (
                            <span className="absolute top-4 right-4 z-20 bg-amber-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                              SAVE ₹{activeMrp - activePrice}
                            </span>
                          )}

                          <Link href={`/product/${product.slug}`}>
                            <Image
                              src={primaryImage}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-106"
                            />
                          </Link>
                        </div>

                        {/* Product Info */}
                        <div className="p-5 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                              <span className="text-zinc-400 text-[10px] ml-1 font-medium">(4.9)</span>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              100% Unadulterated
                            </span>
                          </div>

                          <Link href={`/product/${product.slug}`}>
                            <h3 className="text-base font-bold font-heading text-zinc-900 dark:text-zinc-100 group-hover:text-amber-700 dark:text-amber-400 transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Weight Selector Pills */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-medium text-zinc-400 mr-1">Size:</span>
                            {weightOptions.map((w) => (
                              <button
                                key={w}
                                onClick={() => setSelectedWeights((prev) => ({ ...prev, [product.id]: w }))}
                                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                                  currentWeight === w
                                    ? "bg-[#0A261D] dark:bg-amber-500 dark:text-zinc-950 text-white shadow-sm"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                                }`}
                              >
                                {w}
                              </button>
                            ))}
                          </div>

                          {/* Price Display */}
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                              ₹{activePrice}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-zinc-400 line-through">
                                ₹{activeMrp}
                              </span>
                            )}
                            <span className="text-[11px] text-zinc-400 ml-auto font-mono">
                              ({currentWeight} Glass Jar)
                            </span>
                          </div>
                        </div>
                      </CardContent>

                      {/* Card Bottom CTA Actions */}
                      <div className="px-5 pb-5 pt-0 flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product, activePrice, currentWeight, primaryImage)}
                          className={`flex-1 rounded-xl h-10 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                            isAdded
                              ? "bg-emerald-700 text-white"
                              : "bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </Button>
                        <Link href={`/product/${product.slug}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl h-10 px-3 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100"
                            title="View Details"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <div className="hidden md:flex justify-end gap-2 mt-6">
            <CarouselPrevious className="static transform-none border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800" />
            <CarouselNext className="static transform-none border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
