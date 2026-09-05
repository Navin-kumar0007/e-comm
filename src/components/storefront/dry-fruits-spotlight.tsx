"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, HeartPulse, ShieldCheck, Sparkles, Award } from "lucide-react";

const DryFruitInspector3D = dynamic(
  () => import("@/components/three/dryfruit-inspector-3d").then((mod) => mod.DryFruitInspector3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] flex items-center justify-center rounded-3xl bg-amber-50/50 dark:bg-zinc-900/50 border border-amber-500/20 animate-pulse">
        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase font-mono">Loading 3D Nut Inspector...</span>
      </div>
    ),
  }
);

const PILLARS = [
  {
    step: "01",
    title: "High Oil Mamra (Up to 50%)",
    description: "Unlike commercial California almonds, authentic Afghan Mamra retains its potent natural oils and Ayurvedic vitality.",
    icon: "🌰",
  },
  {
    step: "02",
    title: "Zero Chemical Bleaching",
    description: "100% raw and unpolished. We never treat our nuts with chlorine or sulfur dioxide to artificially brighten color.",
    icon: "🌱",
  },
  {
    step: "03",
    title: "Plant Omega-3 & Vitamin E",
    description: "High-altitude Kashmiri walnuts and raw cashews loaded with essential antioxidants for brain and heart wellness.",
    icon: "🧠",
  },
  {
    step: "04",
    title: "Airtight Glass Jars",
    description: "Packaged in food-grade glass jars with nitrogen flush to preserve crisp harvest freshness without synthetic preservatives.",
    icon: "✨",
  },
];

const HEALTH_GOALS = [
  "Morning Memory & Brain Tonic",
  "Daily Heart & Cholesterol Care",
  "Post-Workout Plant Protein",
  "Guilt-Free Clean Energy Snacking",
  "Festive Royal Gifting",
];

export function DryFruitsSpotlight() {
  return (
    <section className="py-12 md:py-14 bg-gradient-to-b from-[#FAF7F2] to-white dark:from-zinc-950 dark:to-zinc-900 overflow-hidden relative border-y border-zinc-200/80 dark:border-zinc-800">
      {/* Decorative background circle */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-100 dark:bg-amber-950/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-100 dark:bg-emerald-950/40 rounded-full blur-3xl pointer-events-none" />

      <div className="container px-4 md:px-6 mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-4">
            <Award className="w-3.5 h-3.5" />
            <span>Purity Standard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
            The Royal Superfood Pantry
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-base md:text-lg">
            Hand-selected, cold-sorted nuts and sun-dried fruits sourced directly from historical origin orchards in Afghanistan, Kashmir, and Goa.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {PILLARS.map((p) => (
            <div
              key={p.step}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{p.icon}</span>
                <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  PILLAR {p.step}
                </span>
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">
                  {p.title}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 360 Degree 3D Interactive Nut Inspector Centerpiece */}
        <div className="max-w-4xl mx-auto mb-8">
          <DryFruitInspector3D />
        </div>

        {/* Daily Health Rituals Strip */}
        <div className="max-w-4xl mx-auto p-6 md:p-8 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider font-mono">
                Daily Wellness Rituals
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {HEALTH_GOALS.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-sm border border-zinc-200/80 dark:border-zinc-800"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <Link href="/category/dry-fruits" className="shrink-0">
            <Button size="lg" className="bg-[#1E3A2B] hover:bg-[#15291E] text-white rounded-full px-8 font-semibold text-xs shadow-lg flex items-center gap-2">
              <span>View All Dry Fruits</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
