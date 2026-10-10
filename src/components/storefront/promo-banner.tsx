"use client";

import { Fragment, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import type { AnnouncementMsg } from "@/lib/site-content-shared";

const DEFAULT: AnnouncementMsg[] = [
  { text: "FREE SHIPPING ABOVE ₹999" },
  { text: "CODE ROYAL15 · 15% OFF", link: "/shop", linkText: "Shop" },
  { text: "GST INVOICE WITH EVERY ORDER" },
];

/** Thin bar above the header. Text comes from Admin → Website editor → Announcement bar. */
export function PromoBanner({ enabled = true, messages = DEFAULT }: { enabled?: boolean; messages?: AnnouncementMsg[] }) {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible || !enabled || !messages.length) return null;
  // Phones have room for one message: the one with a link (usually the offer), else the first.
  const mobileIndex = Math.max(0, messages.findIndex((m) => m.link));

  const render = (m: AnnouncementMsg) => (
    <>
      {m.text}
      {m.link && <Link href={m.link} className="ml-2 underline underline-offset-2 hover:text-white">{m.linkText || "Shop"}</Link>}
    </>
  );

  return (
    <div className="relative border-b border-brand-gold/25 text-brand-gold">
      <div className="container mx-auto flex h-[30px] items-center justify-center gap-x-4 px-9 text-[11px] font-semibold tracking-[0.04em] md:h-[34px] md:text-xs">
        {messages.map((m, i) => (
          <Fragment key={i}>
            {i > 0 && <span className={`text-brand-gold/40 ${i === mobileIndex || i - 1 === mobileIndex ? "hidden sm:inline" : "hidden md:inline"}`} aria-hidden="true">|</span>}
            <span className={i === mobileIndex ? "truncate" : i < 2 ? "hidden sm:inline" : "hidden md:inline"}>{render(m)}</span>
          </Fragment>
        ))}
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
