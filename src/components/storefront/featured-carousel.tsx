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
import { ArrowRight, Check, ShoppingBag, Star, Sparkles } from "lucide-react";
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
  
  // Track selected weight for desktop: "250g" | "500g" | "1kg"
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
    <section className="py-4 md:py-24 bg-[#FAF7F2] dark:bg-zinc-950">
      <div className="container px-3 md:px-6 mx-auto">
        
        {/* Section Header */}
        <div className="flex justify-between items-end mb-3 md:mb-12">
          <div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 font-mono block">
              Handpicked Essentials
            </span>
            <h2 className="text-xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-heading">
              Our Bestselling Stars
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs md:text-sm mt-0.5 hidden md:block">
              Royal dry fruits, hand-ground masalas, and nutritious superfoods loved by our patrons.
            </p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1 text-xs md:text-sm font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* MOBILE VIEW: High-Density 2-Column E-Commerce Grid (Nutraj / Orika / 20-20 style) */}
        <div className="grid grid-cols-2 gap-2.5 md:hidden">
          {products.slice(0, 6).map((product) => {
            const basePrice = product.salePrice ?? product.price;
            const hasDiscount = product.salePrice && product.salePrice < product.price;
            const primaryImage = (product.images && product.images.length > 0) ? product.images[0] : "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop";

            return (
              <div 
                key={product.id}
                className="group relative rounded-2xl bg-white dark:bg-zinc-900 border border-amber-900/10 dark:border-amber-500/15 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-2"
              >
                <div>
                  {/* Square Product Image */}
                  <Link href={`/product/${product.slug}`} className="block relative aspect-square w-full rounded-xl overflow-hidden bg-amber-50 dark:bg-zinc-800/80 mb-1.5">
                    <Image
                      src={primaryImage}
                      alt={product.name}
                      fill
                      sizes="50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-108"
                    />
                    {/* Badge */}
                    {hasDiscount ? (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[8px] font-extrabold uppercase shadow-xs">
                        SALE
                      </span>
                    ) : product.isOrganic ? (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-700 text-white text-[8px] font-extrabold uppercase shadow-xs">
                        ORGANIC
                      </span>
                    ) : (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-600 text-white text-[8px] font-extrabold uppercase shadow-xs">
                        ROYAL
                      </span>
                    )}
                  </Link>

                  {/* Title & Details */}
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="text-[11.5px] font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-tight group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <span className="text-[9.5px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                    500g Luxury Pack
                  </span>

                  {/* Pricing Row */}
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      ₹{basePrice}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-zinc-400 line-through">
                        ₹{product.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Tap Quick Add Button */}
                <Button 
                  size="sm" 
                  onClick={() => handleAddToCart(product, basePrice, "500g", primaryImage)}
                  className="w-full h-7 mt-2 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  {addedIds[product.id] ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-950 stroke-[3]" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add</span>
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* DESKTOP VIEW: Preserved Full Carousel with weight switches and arrows */}
        <div className="hidden md:block">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-5">
              {products.map((product) => {
                const currentWeight = selectedWeights[product.id] || "500g";
                const weightMultiplier = currentWeight === "250g" ? 0.55 : currentWeight === "1kg" ? 1.9 : 1.0;
                const basePrice = Math.round((product.salePrice ?? product.price) * weightMultiplier);
                const hasDiscount = product.salePrice && product.salePrice < product.price;
                const primaryImage = (product.images && product.images.length > 0) ? product.images[0] : "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop";

                return (
                  <CarouselItem
                    key={product.id}
                    className="pl-3 md:pl-5 basis-full sm:basis-1/2 lg:basis-1/4"
                  >
                    <Card className="h-full border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                      <div>
                        {/* Product Image Container */}
                        <div className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <Link href={`/product/${product.slug}`}>
                            <Image
                              src={primaryImage}
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </Link>

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                            {product.isOrganic && (
                              <Badge className="bg-emerald-600/90 text-white text-[10px] font-bold tracking-wider uppercase border-none backdrop-blur-xs">
                                100% Organic
                              </Badge>
                            )}
                            {hasDiscount && (
                              <Badge className="bg-amber-600/90 text-white text-[10px] font-bold tracking-wider uppercase border-none backdrop-blur-xs">
                                Special Harvest
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Product Info */}
                        <CardContent className="p-5">
                          <div className="flex items-center gap-1 text-amber-500 mb-2">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">4.9</span>
                            <span className="text-zinc-300 dark:text-zinc-700 mx-1">•</span>
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">100% Unadulterated</span>
                          </div>

                          <Link href={`/product/${product.slug}`}>
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Desktop Weight Selector */}
                          <div className="mt-3">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block mb-1">
                              Size / Packaging:
                            </span>
                            <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-0.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                              {(["250g", "500g", "1kg"] as const).map((wt) => (
                                <button
                                  key={wt}
                                  onClick={() => setSelectedWeights((prev) => ({ ...prev, [product.id]: wt }))}
                                  className={`py-1 text-center rounded-lg transition-all ${
                                    currentWeight === wt
                                      ? "bg-white dark:bg-zinc-700 text-amber-800 dark:text-amber-300 shadow-xs font-bold"
                                      : "hover:text-zinc-900 dark:hover:text-zinc-200"
                                  }`}
                                >
                                  {wt}
                                </button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </div>

                      {/* Desktop Bottom Action & Price */}
                      <div className="p-5 pt-0">
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                          <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Direct Farm Rate</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                                ₹{basePrice}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-zinc-400 line-through">
                                  ₹{Math.round(product.price * weightMultiplier)}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product, basePrice, currentWeight, primaryImage)}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition-all font-semibold gap-1.5 active:scale-95"
                          >
                            {addedIds[product.id] ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-4 h-4" />
                                <span>Add</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            <div className="flex justify-end gap-2 mt-6">
              <CarouselPrevious className="static transform-none border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800" />
              <CarouselNext className="static transform-none border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
