"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative border-b border-brand-gold/25 text-brand-gold">
      <div className="container mx-auto flex h-[30px] items-center justify-center gap-x-4 px-9 text-[11px] font-semibold tracking-[0.04em] md:h-[34px] md:text-xs">
        <span className="hidden sm:inline">FREE SHIPPING ABOVE ₹999</span>
        <span className="hidden text-brand-gold/40 sm:inline" aria-hidden="true">|</span>
        <span className="truncate">
          CODE <strong className="tracking-[0.12em] text-white">ROYAL15</strong> · 15% OFF
          <Link href="/shop" className="ml-2 underline underline-offset-2 hover:text-white">Shop</Link>
        </span>
        <span className="hidden text-brand-gold/40 md:inline" aria-hidden="true">|</span>
        <span className="hidden md:inline">GST INVOICE WITH EVERY ORDER</span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        aria-label="Dismiss banner"
        className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-brand-gold/80 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
