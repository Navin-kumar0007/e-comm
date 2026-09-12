"use client";

import { Award, Flame, HeartPulse, ShieldCheck } from "lucide-react";

const CRAFT_STEPS = [
  {
    step: "01",
    title: "Direct Origin Sourcing",
    description: "We source directly from historical origin farms: high-altitude Afghan Mamra Almonds, Kashmiri Snow Walnuts & Goan Cashews.",
    icon: Award,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    step: "02",
    title: "Zero Chemical Bleach",
    description: "100% natural sorting. We never treat our nuts with sulfur dioxide or chemical polishing agents to artificially alter color.",
    icon: HeartPulse,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    step: "03",
    title: "Iron Kadhai Roasting",
    description: "Our masalas and nuts are gently roasted in small batches on traditional iron pans to awaken deep natural aromas.",
    icon: Flame,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
  {
    step: "04",
    title: "Airtight Glass Packaging",
    description: "Sealed fresh in food-grade glass jars with nitrogen flush to preserve natural oil potency and crunch.",
    icon: ShieldCheck,
    color: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  },
];

export function ScrollytellingSection() {
  return (
    <section className="py-6 md:py-14 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800">
      <div className="container px-4 md:px-6 mx-auto">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-5 md:mb-8 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 font-mono">
            Purity &amp; Heritage
          </span>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-zinc-900 dark:text-zinc-50 tracking-tight">
            The Soul Behind Every Jar
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base">
            No compromises, no chemical treatments. How we deliver pure royal nutrition directly from farm to table.
          </p>
        </div>

        {/* Process Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {CRAFT_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="relative p-4 sm:p-6 rounded-3xl bg-[#FAF7F2] dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 md:mb-5">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-sm ${step.color}`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="font-mono text-xs font-extrabold text-zinc-400">
                      PHASE {step.step}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold font-heading text-zinc-900 dark:text-zinc-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
