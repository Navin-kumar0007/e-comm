"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLLECTIONS } from "@/lib/collections";

/** Mobile: 3D coverflow + mini arch grid. Desktop: white card overlapping the hero with tilting arch tiles. */
export function CollectionCoverflow() {
  const [idx, setIdx] = useState(2);
  const n = COLLECTIONS.length;
  const current = COLLECTIONS[idx];

  return (
    <>
      {/* Mobile */}
      <section className="px-4 pt-14 md:hidden">
        <div className="text-center">
          <span className="eyebrow text-brand-gold-deep">Shop by category</span>
          <h2 className="font-heading text-[28px] font-bold leading-tight text-primary">Swipe the royal gallery</h2>
        </div>
        <div className="relative mt-3 h-[214px] overflow-hidden" style={{ perspective: 900 }}>
          {COLLECTIONS.map((c, i) => {
            const off = i - idx;
            const a = Math.abs(off);
            return (
              <button
                key={c.slug}
                onClick={() => setIdx(i)}
                aria-label={c.name}
                aria-current={a === 0 ? "true" : undefined}
                tabIndex={a > 2 ? -1 : 0}
                className="coverflow-item absolute left-1/2 top-2 -ml-[69px] h-[192px] w-[138px]"
                style={{ transform: `translateX(${off * 104}px) translateZ(${-a * 130}px) rotateY(${-off * 38}deg)`, opacity: a > 2 ? 0 : 1, zIndex: 20 - a }}
              >
                <span className={`arch relative block h-full w-full overflow-hidden border-2 bg-muted shadow-[0_14px_26px_rgba(74,15,29,0.25)] ${a === 0 ? "border-brand-gold" : "border-border"}`}>
                  <Image src={c.image} alt="" fill sizes="138px" className="object-cover" />
                  <span className="absolute inset-x-2 bottom-2 rounded-lg bg-card py-1.5 text-center text-[13px] font-extrabold text-foreground">{c.name}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setIdx((idx - 1 + n) % n)} aria-label="Previous category" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary">
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
          <Link href={`/shop?collection=${current.slug}`} className="flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-extrabold text-primary-foreground">
            Shop {current.name} ›
          </Link>
          <button onClick={() => setIdx((idx + 1) % n)} aria-label="Next category" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary">
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-x-2 gap-y-3">
          {COLLECTIONS.map((c) => (
            <Link key={c.slug} href={`/shop?collection=${c.slug}`} className="flex flex-col items-center gap-1 text-center">
              <span className="arch relative block h-[62px] w-[54px] overflow-hidden border-[1.5px] border-brand-gold">
                <Image src={c.image} alt="" fill sizes="54px" className="object-cover" />
              </span>
              <span className="text-[11px] font-bold leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Desktop */}
      <section className="container relative z-10 mx-auto -mt-12 hidden max-w-7xl px-6 md:block">
        <div className="rounded-[26px] border border-border bg-card p-6 shadow-[0_20px_40px_rgba(74,15,29,0.12)] lg:p-7">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="eyebrow text-brand-gold-deep">Shop by category</span>
              <h2 className="font-heading text-[34px] font-bold leading-none text-primary">The royal gallery</h2>
            </div>
            <Link href="/shop" className="flex min-h-10 items-center text-sm font-extrabold text-brand-gold-deep">All products ›</Link>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {COLLECTIONS.map((c) => (
              <Link key={c.slug} href={`/shop?collection=${c.slug}`} className="tilt-hover arch relative block aspect-[3/4] overflow-hidden border-2 border-brand-gold bg-muted">
                <Image src={c.image} alt="" fill sizes="220px" className="object-cover" />
                <span className="absolute inset-x-2 bottom-2 rounded-xl bg-card py-2 text-center text-sm font-extrabold text-foreground">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
