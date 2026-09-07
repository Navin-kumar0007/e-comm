"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Sparkles, Star, ShieldCheck, Flame, ShoppingBag, HeartPulse, Cuboid, Layers, Award, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically load the 3D scene for desktop viewports
const DryFruitHeroScene = dynamic(() => import("@/components/three/dryfruit-hero-scene"), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-[380px] md:h-[500px] flex items-center justify-center rounded-3xl bg-amber-50/40 dark:bg-zinc-900/40 border border-amber-500/20 animate-pulse">
      <div className="flex flex-col items-center gap-3 text-amber-800 dark:text-amber-300">
        <Sparkles className="w-8 h-8 animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase font-mono">Loading 3D Vault...</span>
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
    description: "Cold mountain harvested. Hand-graded, unpolished, and packed with vital fatty acids.",
    price: "₹1,050",
    mrp: "₹1,200",
    weight: "500g Luxury Glass Jar",
    image: "/mamra-almonds.jpg",
    badge: "👑 Royal Superfood",
    origin: "Kandahar Valleys",
    bgPill: "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300/50",
  },
  {
    id: "kashmiri-walnuts",
    title: "Kashmiri Kagzi Walnuts",
    slug: "kashmiri-walnut-kernels",
    tagline: "Paper-Shell • Hand-Cracked Snow-White Giri",
    description: "Sourced from high-altitude Kishtwar trees. Unbleached, buttery-crunch, with rich Omega-3s.",
    price: "₹720",
    mrp: "₹799",
    weight: "500g Luxury Glass Jar",
    image: "/kashmiri-walnuts.jpg",
    badge: "❄️ Snow-White Kernels",
    origin: "Kishtwar, Kashmir",
    bgPill: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300/50",
  },
  {
    id: "jumbo-cashews",
    title: "Goan Jumbo Cashews (W180)",
    slug: "organic-whole-cashews",
    tagline: "King Size W180 • Buttery Whole Kernels",
    description: "Sourced from coastal organic groves. The largest whole cashews hand-selected for royal feasts.",
    price: "₹799",
    mrp: "₹850",
    weight: "500g Luxury Glass Jar",
    image: "/jumbo-cashews.jpg",
    badge: "💎 King Size W180",
    origin: "Goan Coastal Groves",
    bgPill: "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300/50",
  },
  {
    id: "tandoori-chai",
    title: "Tandoori Chai Masala",
    slug: "tandoori-chai-masala",
    tagline: "9 Slow-Roasted Imperial Spices",
    description: "Slow-roasted in traditional iron kadhais. Infuses every sip with warm cinnamon, mace, and green cardamom.",
    price: "₹220",
    mrp: "₹250",
    weight: "100g Aroma-Lock Jar",
    image: "/jar3.jpg",
    badge: "🔥 Slow-Roasted Aroma",
    origin: "Malabar & Idukki",
    bgPill: "bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 border-orange-300/50",
  },
];

export function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"showcase" | "3d">("showcase");
  const activeProduct = HERO_PRODUCTS[activeIdx];

  return (
    <section className="relative overflow-hidden bg-[#FAF8F4] dark:bg-[#071510] pt-16 pb-8 md:pt-28 md:pb-20 transition-colors duration-500">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-gradient-to-br from-amber-200/30 dark:from-amber-900/10 via-emerald-200/20 to-transparent rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-300/15 dark:bg-emerald-950/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#C59B27_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <div className="container relative z-10 px-4 md:px-6 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Story, Prestige & Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col items-start text-left"
          >
            {/* Top Brand Pill with Gold Sheen */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 px-3 py-1 text-[11px] md:text-xs font-semibold text-amber-800 dark:text-amber-300 mb-4 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>Imperial Royal Pantry • Certified Single-Origin</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-[3.25rem] font-bold font-heading text-zinc-900 dark:text-zinc-50 leading-[1.15] mb-4 tracking-tight">
              The Finest Dry Fruits, Royal Nuts{" "}
              <span className="gold-gradient-text block mt-1">
                &amp; Rare Exotic Spices.
              </span>
            </h1>

            {/* Appetite & Provenance Narrative */}
            <p className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm md:text-base leading-relaxed mb-4 md:mb-6 max-w-xl">
              Harvested from the snow-capped orchards of Kashmir and the ancient spice hills of Malabar. Hand-graded, unpolished, and locked fresh in luxury glass canisters.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-row gap-2 w-full sm:w-auto mb-6 md:mb-8">
              <Link href="/shop" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white h-10 md:h-12 px-4 md:px-7 rounded-2xl shadow-lg shadow-emerald-950/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm font-bold w-full sm:w-auto flex items-center justify-center gap-2 border border-amber-500/30"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explore Royal Harvests</span>
                </Button>
              </Link>
              <Link href="/blend-creator" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-10 md:h-12 px-4 md:px-6 rounded-2xl border-amber-500/40 hover:bg-amber-500/10 text-zinc-900 dark:text-zinc-100 backdrop-blur-sm text-sm font-semibold w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Custom Blend Atelier</span>
                </Button>
              </Link>
            </div>

            {/* Royal Trust Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 md:pt-6 border-t border-amber-500/20 w-full">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm md:text-base font-heading">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Grade AAA</span>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">High-Oil Natural Kernels</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm md:text-base font-heading">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Zero Polish</span>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">100% Unadulterated</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm md:text-base font-heading">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Glass Sealed</span>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Aroma &amp; Oil Lock</span>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Luxury Showcase Card with Mobile Swipe & Desktop 3D */}
          <div className="lg:col-span-6 relative flex flex-col items-center w-full">

            {/* Desktop Mode Toggle (Showcase vs 3D Orbit) */}
            <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-amber-500/30 shadow-sm backdrop-blur-md mb-4 z-20">
              <button
                onClick={() => setViewMode("showcase")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "showcase"
                    ? "bg-[#0A261D] text-white dark:bg-amber-500 dark:text-zinc-950 shadow"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Curated Showcase</span>
              </button>
              <button
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "3d"
                    ? "bg-[#0A261D] text-white dark:bg-amber-500 dark:text-zinc-950 shadow"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Cuboid className="w-3.5 h-3.5 text-amber-400 dark:text-zinc-950" />
                <span>3D Interactive Vault</span>
              </button>
            </div>

            {/* 3D Mode (Desktop Only) */}
            {viewMode === "3d" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full rounded-3xl overflow-hidden bg-white/40 dark:bg-zinc-900/40 border border-amber-500/30 shadow-2xl backdrop-blur-sm"
              >
                <DryFruitHeroScene />
              </motion.div>
            )}

            {/* Showcase Mode (Clean, Touch-Friendly on Mobile & Desktop) */}
            {viewMode === "showcase" && (
              <div className="w-full max-w-md mx-auto flex flex-col items-center">
                {/* Horizontal Product Selector Carousel on Mobile */}
                <div className="flex items-center gap-1.5 pb-2 mb-3 max-w-full overflow-x-auto hide-scrollbar w-full px-1">
                  {HERO_PRODUCTS.map((prod, idx) => (
                    <button
                      key={prod.id}
                      onClick={() => setActiveIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
                        activeIdx === idx
                          ? "bg-[#0A261D] text-white dark:bg-amber-500 dark:text-zinc-950 border-amber-500/50 shadow-sm"
                          : "bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border-border/50 hover:border-amber-500/30"
                      }`}
                    >
                      {prod.title}
                    </button>
                  ))}
                </div>

                {/* Royal Feature Card */}
                <div className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-amber-500/25 shadow-xl p-3 md:p-6 flex flex-col">
                  {/* Top Badge & Origin */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${activeProduct.bgPill}`}>
                      {activeProduct.badge}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-medium">{activeProduct.origin}</span>
                  </div>

                  {/* Product Image Stage */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#FAF8F4] dark:bg-zinc-950 mb-4 border border-zinc-200/60 dark:border-zinc-800/80 group">
                    <Image
                      src={activeProduct.image}
                      alt={activeProduct.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-mono">
                      {activeProduct.weight}
                    </div>
                  </div>

                  {/* Title & Pricing */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg md:text-xl font-bold font-heading text-zinc-900 dark:text-zinc-100">
                        {activeProduct.title}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl md:text-2xl font-black text-amber-700 dark:text-amber-400">{activeProduct.price}</span>
                        <span className="text-xs text-zinc-400 line-through">{activeProduct.mrp}</span>
                      </div>
                    </div>

                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium italic">
                      {activeProduct.tagline}
                    </p>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                      {activeProduct.description}
                    </p>

                    <Link href={`/product/${activeProduct.slug}`}>
                      <Button
                        className="w-full bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white rounded-xl h-11 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
                      >
                        <span>Reserve &amp; Order Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}
