"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Sparkles, ArrowRight, ShieldCheck, Mountain, Compass, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OriginLocation {
  id: string;
  name: string;
  region: string;
  product: string;
  slug: string;
  elevation: string;
  harvest: string;
  keyFeature: string;
  image: string;
  badge: string;
  coords: { x: number; y: number }; // percentage on map
}

const PROVENANCE_LOCATIONS: OriginLocation[] = [
  {
    id: "kashmir-saffron",
    name: "Pampore Plateau",
    region: "Kashmir Valley",
    product: "Grade A1 Mogra Saffron",
    slug: "kashmiri-saffron",
    elevation: "1,600m High Altitude",
    harvest: "Autumn Dawn Hand-Plucked",
    keyFeature: "Highest Crocin Content • Deep Crimson Stigmas",
    image: "https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon",
    badge: "👑 Royal Saffron",
    coords: { x: 38, y: 18 },
  },
  {
    id: "kashmir-walnut",
    name: "Kishtwar Valley",
    region: "High-Altitude Kashmir",
    product: "Kagzi Snow-White Walnuts",
    slug: "kashmiri-walnut-kernels",
    elevation: "1,850m Glacial Terraces",
    harvest: "Hand-Cracked Paper Shell",
    keyFeature: "Zero Chemical Bleach • Loaded with Plant Omega-3",
    image: "https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon",
    badge: "❄️ Snow-White Giri",
    coords: { x: 42, y: 24 },
  },
  {
    id: "afghan-mamra",
    name: "Kandahar Valleys",
    region: "Ancient Silk Route",
    product: "Afghan Mamra Almonds",
    slug: "premium-afghan-almonds",
    elevation: "1,400m Mountain Foothills",
    harvest: "Cold-Weather Sun-Dried",
    keyFeature: "Up to 50% Natural Oil • Dense Ayurvedic Nutrients",
    image: "https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon",
    badge: "🌟 King of Almonds",
    coords: { x: 20, y: 32 },
  },
  {
    id: "goa-cashew",
    name: "Coastal Goan Groves",
    region: "Western Ghats Belt",
    product: "Jumbo King Cashews (W180)",
    slug: "organic-whole-cashews",
    elevation: "Coastal Organic Orchards",
    harvest: "Hand-Shelled & Graded",
    keyFeature: "Largest W180 Kernels • Rich Buttery Sweetness",
    image: "https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon",
    badge: "💎 King Size W180",
    coords: { x: 34, y: 68 },
  },
  {
    id: "malabar-spices",
    name: "Cardamom Hills & Idukki",
    region: "Malabar Coast, Kerala",
    product: "Tellicherry Pepper & Green Cardamom",
    slug: "tandoori-chai-masala",
    elevation: "900m Rain-Mist Canopy",
    harvest: "Monsoon Hand-Picked",
    keyFeature: "Extra Bold 8mm Pods • Intense Essential Oils",
    image: "https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon",
    badge: "🌿 Ancient Spice Route",
    coords: { x: 40, y: 84 },
  },
];

export function SilkRouteMap() {
  const [activeLoc, setActiveLoc] = useState<OriginLocation>(PROVENANCE_LOCATIONS[0]);

  return (
    <section className="py-6 md:py-24 bg-[#FAF7F2] dark:bg-[#06140F] border-b border-amber-500/20 relative overflow-hidden transition-colors duration-300">
      {/* Background glow & subtle coordinate lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55rem] h-[55rem] bg-gradient-to-br from-amber-200/40 dark:from-amber-950/20 via-emerald-200/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#C59B27_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />
      </div>

      <div className="container relative z-10 px-4 md:px-6 mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Historical Provenance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold font-heading text-foreground tracking-tight leading-tight">
              The Royal Silk &amp; Spice Route
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-2.5 max-w-xl leading-relaxed">
              Every jar has a birth certificate. Trace our single-estate dry fruits and whole spices back to the exact mountain slopes and coastal groves where they were harvested.
            </p>
          </div>

          <Link href="/traceability" className="mt-4 md:mt-0 shrink-0">
            <Button variant="outline" className="rounded-2xl border-amber-500/40 text-xs font-bold hover:bg-amber-500/10 gap-2 h-11 px-5">
              <span>View Interactive Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Interactive Layout: Region Tabs + Detail Feature Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: Origin Location List & Mobile Chips */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <p className="text-xs uppercase font-mono font-bold tracking-widest text-muted-foreground mb-3 px-1">
                Select Provenance Terroir
              </p>
              {PROVENANCE_LOCATIONS.map((loc) => {
                const isActive = activeLoc.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setActiveLoc(loc)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border flex items-center justify-between group ${
                      isActive
                        ? "bg-white dark:bg-zinc-900 border-amber-500 shadow-md shadow-amber-900/5 ring-1 ring-amber-500/30 scale-[1.01]"
                        : "bg-white/60 dark:bg-zinc-900/50 border-border/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive 
                          ? "bg-[#0A261D] text-amber-400 dark:bg-amber-500 dark:text-zinc-950" 
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm text-foreground truncate">
                            {loc.name}
                          </h4>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {loc.region}
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold truncate mt-0.5">
                          {loc.product}
                        </p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                      isActive ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 translate-x-1" : "text-muted-foreground opacity-40 group-hover:opacity-100"
                    }`}>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quality Guarantee Ticker */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 flex items-center gap-3 mt-4">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">100% Direct Farmer Trade:</strong> We eliminate middlemen. Every harvest supports sustainable high-altitude orchards and cooperative farming families.
              </p>
            </div>
          </div>

          {/* Right Column: High-Impact Terroir Showcase Card */}
          <div className="lg:col-span-7">
            <div className="h-full rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-amber-500/30 shadow-xl flex flex-col justify-between">
              
              {/* Card Media Banner */}
              <div className="relative w-full h-64 sm:h-72 md:h-80 bg-zinc-950 overflow-hidden group">
                <Image
                  src={activeLoc.image}
                  alt={activeLoc.product}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 text-xs font-bold">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    {activeLoc.badge}
                  </span>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 dark:bg-zinc-900/90 text-foreground text-xs font-mono font-bold shadow-sm backdrop-blur-md">
                    <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                    {activeLoc.elevation}
                  </span>
                </div>

                {/* Bottom Image Headline */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold block mb-1">
                    Origin Terroir • {activeLoc.region}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-heading font-bold text-white leading-tight">
                    {activeLoc.name}
                  </h3>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-4 md:p-8 flex flex-col justify-between flex-1 gap-4 md:gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FAF8F4] dark:bg-zinc-950 border border-border/50">
                    <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground block mb-1">
                      Harvest Method
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {activeLoc.harvest}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF8F4] dark:bg-zinc-950 border border-border/50">
                    <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground block mb-1">
                      Nutrient Profile
                    </span>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                      {activeLoc.keyFeature}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
                  <div>
                    <span className="text-xs text-muted-foreground block">Featured Single-Origin Harvest</span>
                    <span className="text-base font-heading font-bold text-foreground">{activeLoc.product}</span>
                  </div>

                  <Link href={`/product/${activeLoc.slug}`} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white rounded-xl h-11 px-6 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95">
                      <span>Shop This Terroir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
