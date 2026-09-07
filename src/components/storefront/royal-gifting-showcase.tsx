"use client";

import Image from "next/image";
import Link from "next/link";
import { Gift, Sparkles, ArrowRight, ShieldCheck, HeartHandshake, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

const GIFT_SETS = [
  {
    id: "imperial-velvet-casket",
    name: "The Imperial Velvet Casket",
    tagline: "Royal Monogram Clasp • 4 Glass Canisters",
    description: "Handcrafted in deep emerald velvet with gold-embossed crest. Features 250g Afghan Mamra Almonds, 250g Kashmiri Walnuts, 250g Jumbo W180 Cashews, and 5g Grade A1 Saffron.",
    price: "₹3,499",
    mrp: "₹3,999",
    badge: "👑 Most Prestigious",
    image: "/jar1.jpg",
  },
  {
    id: "spice-route-chest",
    name: "The Maharaja Spice Route Chest",
    tagline: "Solid Teakwood Box • 6 Sealed Vials",
    description: "Heirloom handcrafted teakwood chest with 6 aroma-locked glass tubes containing Malabar Tellicherry Pepper, Green Cardamom, Ceylon Cinnamon, Cloves, Star Anise, and Saffron.",
    price: "₹2,499",
    mrp: "₹2,850",
    badge: "🌿 Heirloom Edition",
    image: "/jar2.jpg",
  },
  {
    id: "grand-celebration-hamper",
    name: "The Grand Royal Hamper",
    tagline: "Double-Tiered Luxury Trunk • Gold Foil Card",
    description: "A majestic hamper designed for royal weddings and milestone gifting. Complete with roasted nuts, artisanal chai masalas, and raw unprocessed wild honey.",
    price: "₹4,999",
    mrp: "₹5,500",
    badge: "✨ Festive Grandeur",
    image: "/jar3.jpg",
  },
];

export function RoyalGiftingShowcase() {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-zinc-950 border-b border-amber-500/20 relative overflow-hidden transition-colors duration-300">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-950/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 px-4 md:px-6 mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-3">
              <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Royal Gifting Atelier</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-foreground tracking-tight leading-tight">
              Bespoke Imperial Caskets &amp; Hampers
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-2.5 max-w-xl leading-relaxed">
              Crafted for dignitaries, weddings, and discerning corporate patrons. Sealed with our Imperial Royal Crest and personalized gold-embossed greeting cards.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <a
              href="https://wa.me/919876543210?text=Hello%20Nutty%20World%2C%20I%20am%20interested%20in%20Bespoke%20Corporate%20Gifting"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="rounded-2xl border-amber-500/40 text-xs font-bold hover:bg-amber-500/10 gap-2 h-11 px-4">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <span>Corporate Concierge</span>
              </Button>
            </a>
          </div>
        </div>

        {/* 3 Casket Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {GIFT_SETS.map((gift) => (
            <div
              key={gift.id}
              className="rounded-3xl overflow-hidden bg-[#FAF8F4] dark:bg-zinc-900 border border-amber-500/25 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                {/* Visual Stage */}
                <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden">
                  <Image
                    src={gift.image}
                    alt={gift.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Top Badge */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 text-xs font-bold">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {gift.badge}
                    </span>
                  </div>

                  {/* Price Tag on Image */}
                  <div className="absolute bottom-3 right-3 flex items-baseline gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-sm">
                    <span className="text-base font-black text-amber-700 dark:text-amber-400 tnum">{gift.price}</span>
                    <span className="text-xs text-muted-foreground line-through tnum">{gift.mrp}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 md:p-6 flex flex-col gap-2">
                  <h3 className="font-heading font-bold text-lg md:text-xl text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {gift.name}
                  </h3>
                  <span className="text-xs font-mono text-amber-800 dark:text-amber-300 font-semibold">
                    {gift.tagline}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {gift.description}
                  </p>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="p-5 md:p-6 pt-0">
                <Link href="/shop">
                  <Button className="w-full bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white rounded-xl h-11 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95">
                    <span>Reserve Gift Casket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Gifting Callout Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#052C1E] via-[#0A3D2A] to-[#052C1E] text-white border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-lg md:text-xl text-amber-100 mb-1">
                Custom Corporate &amp; Wedding Hampers
              </h4>
              <p className="text-xs md:text-sm text-zinc-300 max-w-xl">
                Need customized gold-foil branding with your corporate logo or family monogram? We curate bespoke hampers for bulk orders (10+ units) with pan-India temperature-controlled delivery.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/919876543210?text=Hi%2C%20I%20would%20like%20a%20quote%20for%20Bulk%20Gifting%20Hampers"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-full md:w-auto"
          >
            <Button className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl h-11 px-7 shadow-lg">
              <span>Request Bespoke Catalogue</span>
            </Button>
          </a>
        </div>

      </div>
    </section>
  );
}
