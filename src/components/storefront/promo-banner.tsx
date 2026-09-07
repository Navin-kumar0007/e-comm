"use client";

import { useState } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-[#052C1E] via-[#0A3D2A] to-[#052C1E] text-amber-200 border-b border-amber-500/30 text-xs relative overflow-hidden"
        >
          <div className="container mx-auto px-4 py-1.5 md:py-2 flex items-center justify-center text-center">
            <div className="flex items-center gap-2 flex-wrap justify-center pr-6">
              <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Royal Harvest
              </span>
              <span className="text-zinc-100">
                Fresh Kashmiri Saffron &amp; Afghan Mamra Almonds now in stock.
              </span>
              <Link
                href="/shop?category=dry-fruits"
                className="font-bold text-amber-300 underline underline-offset-4 hover:text-white inline-flex items-center gap-0.5 transition-colors"
              >
                Shop Reserve
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              aria-label="Dismiss banner"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-amber-300/80 hover:text-white rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
