"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { COLLECTIONS } from "@/lib/collections";

const ORBIT_SLUGS = ["almonds", "cashews", "pistachios", "walnuts", "dates", "raisins", "makhana", "seeds"];
const ITEMS = ORBIT_SLUGS.map((s) => COLLECTIONS.find((c) => c.slug === s)!).filter(Boolean);
const SPIN_SECONDS = 22;

/**
 * Hero option A from the design board: the dry fruits orbit the Spicy Nuts seal
 * in CSS 3D. Each medallion counter-rotates so it always faces the viewer
 * (offset with a negative animation-delay). Tap one to shop that collection.
 * Images are small (shown at 48–62 px) and low priority, so they never hold up the hero text.
 */
export function RoyalOrbit({ size = "sm" }: { size?: "sm" | "lg" }) {
  const [picked, setPicked] = useState(ITEMS[0].slug);
  const current = ITEMS.find((c) => c.slug === picked) ?? ITEMS[0];
  const lg = size === "lg";
  const radius = lg ? 182 : 132;
  const medal = lg ? 62 : 48;
  const seal = lg ? 124 : 96;

  return (
    <div className="flex flex-col items-center">
      <div className="orbit-stage relative flex items-center justify-center" style={{ width: lg ? 440 : 340, height: lg ? 400 : 300, perspective: 900 }}>
        <div className="absolute rounded-full border border-brand-gold/35 bg-primary" style={{ width: lg ? 330 : 236, height: lg ? 330 : 236 }} />
        <div className="absolute rounded-full border-[1.5px] border-dashed border-brand-gold/45" style={{ width: radius * 2 + 20, height: radius * 2 + 20, transform: "rotateX(66deg)" }} />

        <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d", transform: "rotateX(-24deg)" }}>
          <div
            className="seal-glow absolute flex items-center justify-center rounded-full border-[3px] border-brand-gold bg-background"
            style={{ width: seal, height: seal, left: -seal / 2, top: -seal / 2, transform: "rotateX(24deg) translateZ(0)" }}
          >
            <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" width={128} height={101} fetchPriority="low" className="h-auto" style={{ width: seal * 0.74 }} />
          </div>

          <div className="orbit-ring" style={{ animationDuration: `${SPIN_SECONDS}s` }}>
            {ITEMS.map((c, i) => {
              const angle = (360 / ITEMS.length) * i;
              const on = c.slug === picked;
              return (
                <div key={c.slug} className="absolute" style={{ transformStyle: "preserve-3d", transform: `rotateY(${angle}deg) translateZ(${radius}px)` }}>
                  <button
                    onClick={() => setPicked(c.slug)}
                    aria-label={`Show ${c.name}`}
                    aria-pressed={on}
                    className="orbit-face absolute"
                    style={{
                      left: -(medal + 12) / 2,
                      top: -(medal + 24) / 2,
                      width: medal + 12,
                      animationDuration: `${SPIN_SECONDS}s`,
                      animationDelay: `-${(angle / 360) * SPIN_SECONDS}s`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <span className="flex flex-col items-center gap-1" style={{ transform: "rotateX(24deg)" }}>
                    <Image
                      src={c.image}
                      alt=""
                      width={64}
                      height={64}
                      loading="eager"
                      fetchPriority="low"
                      className={`rounded-full border-2 object-cover shadow-[0_10px_18px_rgba(0,0,0,0.45)] ${on ? "border-white" : "border-brand-gold"}`}
                      style={{ width: medal, height: medal }}
                    />
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${on ? "bg-secondary text-secondary-foreground" : "bg-background text-foreground"}`}>
                      {c.name}
                    </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Link
        href={`/shop?collection=${current.slug}`}
        className="-mt-1 inline-flex h-9 items-center gap-1.5 rounded-full border border-brand-gold/60 bg-white/10 px-4 text-[12.5px] font-bold text-white hover:bg-white/15"
      >
        <span className="text-white/75">Tap a nut ·</span> Shop {current.name} ›
      </Link>
    </div>
  );
}
