"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Sparkles, Star, ShieldCheck, Flame, ShoppingBag, HeartPulse, Cuboid, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically load the 3D scene (client-only)
const DryFruitHeroScene = dynamic(() => import("@/components/three/dryfruit-hero-scene"), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-[450px] md:h-[540px] flex items-center justify-center rounded-3xl bg-amber-50/40 dark:bg-zinc-900/40 border border-amber-500/20 animate-pulse">
      <div className="flex flex-col items-center gap-3 text-amber-800 dark:text-amber-300">
        <Sparkles className="w-8 h-8 animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase font-mono">Loading 3D Experience...</span>
      </div>
    </div>
  ),
});

const HERO_PRODUCTS = [
  {
    id: "mamra-almonds",
    title: "Afghan Mamra Almonds",
    slug: "premium-afghan-almonds",
    tagline: "High Natural Oil Content (Up to 50%)",
    description: "Directly sourced from cold Afghan valleys. Distinct concave shape, nutrient-dense, and an ancient Ayurvedic brain & heart tonic.",
    price: "₹1,050",
    mrp: "₹1,200",
    weight: "500g Glass Jar",
    image: "/mamra-almonds.jpg",
    badge: "👑 Royal Superfood",
    bgPill: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
  },
  {
    id: "tandoori-chai",
    title: "Tandoori Chai Masala",
    slug: "tandoori-chai-masala",
    tagline: "Bina masale ki chai fiki hai!",
    description: "Slow-roasted royal blend of 9 warming spices. Brings the authentic smoky kulhad aroma to your morning cup.",
    price: "₹220",
    mrp: "₹250",
    weight: "50g Glass Jar",
    image: "/jar3.jpg",
    badge: "🔥 Slow-Roasted Aroma",
    bgPill: "bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300",
  },
  {
    id: "jumbo-cashews",
    title: "Goan Jumbo Cashews (W180)",
    slug: "organic-whole-cashews",
    tagline: "King Size W180 • Naturally Sweet & Buttery",
    description: "Sourced from organic Goan coastal groves. Hand-graded King Size whole cashews with a rich buttery crunch.",
    price: "₹799",
    mrp: "₹850",
    weight: "500g Glass Jar",
    image: "/jumbo-cashews.jpg",
    badge: "🌿 100% Organic & Raw",
    bgPill: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300",
  },
];

export function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"3d" | "cards">("3d");
  const activeProduct = HERO_PRODUCTS[activeIdx];

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#FAF7F2] dark:bg-zinc-950 pt-24 pb-10 md:pt-28 md:pb-12 transition-colors duration-300">
      {/* Background glowing ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-200/40 dark:bg-amber-900/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] bg-emerald-200/35 dark:bg-emerald-950/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-orange-200/30 dark:bg-orange-950/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#1E3A2B_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="container relative z-10 px-4 md:px-6 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Brand Story & Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col items-start text-left"
          >
            {/* Top Brand Pill */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm backdrop-blur-sm">
                <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                <span>100% Pure &amp; Natural • Direct Farm Sourcing • Zero Chemicals</span>
              </div>
            </div>

            {/* Brand Logo spotlight */}
            <div className="mb-5 inline-flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-amber-500/30 shadow-sm backdrop-blur-md">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-white p-1 border border-zinc-200/80 dark:border-zinc-800 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Nutty World Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-heading text-zinc-900 dark:text-zinc-100">Nutty World</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase font-mono">Royal Pantry</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                  <span>4.9/5 • 1,200+ Patrons</span>
                </div>
              </div>
            </div>

            {/* Main Headline tailored to Dry Fruits & Masalas */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-heading text-zinc-900 dark:text-zinc-50 leading-[1.2] mb-3">
              Pure Royal Dry Fruits.{" "}
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-700 bg-clip-text text-transparent block mt-1">
                Artisanal Masalas &amp; Superfoods.
              </span>
            </h1>

            {/* Appetite-stimulating description */}
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-5 max-w-md">
              From high-oil <strong className="text-amber-800 dark:text-amber-300 font-semibold">Afghan Mamra Almonds</strong> and <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">King Size Goan Cashews</strong> to slow-roasted <strong className="text-orange-700 dark:text-orange-400 font-semibold">Tandoori Chai Masalas</strong>—sourced directly from trusted origins with zero chemical polishing or preservatives.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto mb-6">
              <Link href="/category/dry-fruits" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-[#1E3A2B] hover:bg-[#15291E] text-white h-10 px-6 rounded-full shadow-md shadow-emerald-950/20 hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs sm:text-sm font-semibold w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Shop Royal Dry Fruits
                </Button>
              </Link>
              <Link href="/shop" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-10 px-5 rounded-full border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 backdrop-blur-sm text-xs sm:text-sm font-semibold w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <span>Explore All Products</span>
                  <ArrowRight className="w-4 h-4 text-zinc-500" />
                </Button>
              </Link>
            </div>

            {/* Trust feature strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 w-full text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span><strong>High-Oil Superfoods</strong> (Unpolished)</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span><strong>Slow-Roasted</strong> In Iron Kadhai</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span><strong>100% Glass Packaging</strong></span>
              </div>
            </div>

          </motion.div>

          {/* Right Column: 3D Stage & Interactive Showcase */}
          <div className="lg:col-span-6 relative flex flex-col items-center max-w-md mx-auto w-full">
            
            {/* View Mode Toggle (3D Interactive vs Card Mode) */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 shadow-sm backdrop-blur-md mb-4 z-20">
              <button
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "3d"
                    ? "bg-[#1E3A2B] text-white shadow-md scale-102"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Cuboid className="w-3.5 h-3.5 text-amber-400" />
                <span>3D Live Experience</span>
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "cards"
                    ? "bg-[#1E3A2B] text-white shadow-md scale-102"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Product Detail Cards</span>
              </button>
            </div>

            {/* Mode 1: 3D Live Parallax Experience */}
            {viewMode === "3d" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full rounded-3xl overflow-hidden bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl backdrop-blur-sm"
              >
                <DryFruitHeroScene />
              </motion.div>
            )}

            {/* Mode 2: Detailed Product Spotlight Card */}
            {viewMode === "cards" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-md flex flex-col items-center"
              >
                {/* Switcher Pills */}
                <div className="flex items-center justify-center gap-2 mb-4 p-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 shadow-sm backdrop-blur-md max-w-full overflow-x-auto">
                  {HERO_PRODUCTS.map((prod, idx) => (
                    <button
                      key={prod.id}
                      onClick={() => setActiveIdx(idx)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                        activeIdx === idx
                          ? "bg-[#1E3A2B] text-white shadow"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                      }`}
                    >
                      {prod.title}
                    </button>
                  ))}
                </div>

                <div className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl p-6 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${activeProduct.bgPill}`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      {activeProduct.badge}
                    </span>
                    <span className="text-xs font-medium text-zinc-500 font-mono">{activeProduct.weight}</span>
                  </div>

                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 mb-5 group border border-zinc-100 dark:border-zinc-800/60">
                    <Image
                      src={activeProduct.image}
                      alt={activeProduct.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-xl font-bold font-heading text-zinc-900 dark:text-zinc-100">
                        {activeProduct.title}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-[#C85B43]">{activeProduct.price}</span>
                        <span className="text-xs text-zinc-400 line-through">{activeProduct.mrp}</span>
                      </div>
                    </div>

                    <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold italic">
                      &quot;{activeProduct.tagline}&quot;
                    </p>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                      {activeProduct.description}
                    </p>

                    <Link href={`/product/${activeProduct.slug}`}>
                      <Button
                        size="sm"
                        className="w-full bg-[#1E3A2B] hover:bg-[#15291E] text-white rounded-xl h-10 font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>View Details &amp; Order</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}
