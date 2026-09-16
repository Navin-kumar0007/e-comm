"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";

export interface MobileCategoryItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  badge?: string;
  badgeBg?: string;
}

// Focused categories strictly for current brand offerings
export const CURRENT_CATEGORIES: MobileCategoryItem[] = [
  {
    id: "dry-fruits",
    title: "Dry Fruits",
    subtitle: "Pure & Raw",
    href: "/category/dry-fruits",
    image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?q=80&w=400&auto=format&fit=crop",
    badge: "Royal",
    badgeBg: "bg-gradient-to-r from-amber-600 to-amber-500",
  },
  {
    id: "mixes-seeds",
    title: "Mixes & Seeds",
    subtitle: "Daily Vitality",
    href: "/category/dry-fruits",
    image: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=400&auto=format&fit=crop",
    badge: "Superfood",
    badgeBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
  },
  {
    id: "custom-blend",
    title: "Spice Atelier",
    subtitle: "Custom Blend",
    href: "/blend-creator",
    image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?q=80&w=400&auto=format&fit=crop",
    badge: "Interactive",
    badgeBg: "bg-gradient-to-r from-red-600 to-amber-600",
  },
];

interface MobileQuickCategoriesProps {
  categories?: MobileCategoryItem[];
}

export function MobileQuickCategories({ categories = CURRENT_CATEGORIES }: MobileQuickCategoriesProps) {
  return (
    <section 
      aria-label="Quick Category Navigation" 
      className="w-full bg-[#FAF8F4] dark:bg-[#07130E] py-2 border-y border-amber-900/10 dark:border-amber-500/10 md:hidden"
    >
      <div className="px-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className="p-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3 h-3 fill-amber-500 text-amber-500" />
            </span>
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-950 dark:text-amber-200 font-sans">
              Curated Collections
            </span>
          </div>
          <Link 
            href="/shop" 
            className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 hover:text-amber-600 flex items-center gap-0.5"
          >
            All Products <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        {/* 3-Column Compact Pods (Nutraj / 20-20 Dry Fruits style) */}
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <CategoryPod key={cat.id} item={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryPod({ item }: { item: MobileCategoryItem }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={item.href}
      className="group flex flex-col items-center text-center p-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-amber-500/15 dark:border-amber-500/10 shadow-xs hover:shadow-sm transition-all duration-200 active:scale-95"
    >
      {/* Avatar Container with Royal Gold Rim */}
      <div className="relative mb-1">
        <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-500 via-amber-200 to-amber-600 shadow-xs group-hover:shadow-amber-500/20 transition-shadow">
          <div className="relative w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-full overflow-hidden bg-amber-50 dark:bg-zinc-900 border border-white/90 dark:border-zinc-800">
            <Image
              src={imgError ? "https://placehold.co/200x200/f4f3ea/052c1e?text=" + encodeURIComponent(item.title) : item.image}
              alt={item.title}
              width={58}
              height={58}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Status Micro-Badge */}
        {item.badge && (
          <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full ${item.badgeBg || "bg-amber-600"} text-white text-[7px] font-extrabold tracking-wider uppercase shadow-xs whitespace-nowrap border border-white/70 dark:border-zinc-900 z-10`}>
            {item.badge}
          </span>
        )}
      </div>

      {/* Typography */}
      <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
        {item.title}
      </span>
      <span className="text-[8px] font-medium text-amber-800/70 dark:text-amber-400/70 tracking-tight leading-none mt-0.5 line-clamp-1">
        {item.subtitle}
      </span>
    </Link>
  );
}
