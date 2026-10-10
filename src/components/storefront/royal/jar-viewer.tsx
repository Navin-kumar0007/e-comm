"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import type { ProductLabel } from "@/lib/product-labels";
import { JarFrame, LABEL_FRONT_RATIO } from "./jar-shot";

const VIEWS = ["360° jar", "Full label", "Photos"] as const;
type View = (typeof VIEWS)[number];

/** The full label is 768 × 384 design px; the front panel starts at x = 204 and is 360 wide, artwork ends above the wave at y = 332. */
const LABEL_W = 768;
const FRONT_X = 204;
const FRONT_W = 360;
const ART_H = 332;
const LABEL_H = 384;

/**
 * Product stage: the real jar label wrapped on a PET jar that turns (drag or
 * slider), the flat full label to read every detail, and the product photos.
 */
export function JarViewer({ label, images, name, weight }: { label: ProductLabel; images: string[]; name: string; weight: string }) {
  // The jar is the biggest thing on the page; start downloading its label with the HTML,
  // not after scripts run (it is a CSS background, which browsers otherwise find late).
  preload(label.jar, { as: "image", fetchPriority: "high" });
  const [view, setView] = useState<View>("360° jar");
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(true);
  const [photo, setPhoto] = useState(0);
  const drag = useRef<{ x: number; r: number } | null>(null);

  // Gentle turntable until the shopper takes over.
  useEffect(() => {
    if (!spinning || view !== "360° jar") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      setRot((r) => ((r + (t - last) * 0.018 + 180) % 360) - 180);
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spinning, view]);

  const W = 236;
  const labelH = Math.round(W * LABEL_FRONT_RATIO);
  const bgW = (W * LABEL_W) / FRONT_W;
  const bgH = (labelH * LABEL_H) / ART_H;
  const pos = -(FRONT_X / LABEL_W) * bgW + (rot / 360) * bgW;

  return (
    <div className="jaali relative flex h-full min-h-[430px] flex-col items-center justify-between overflow-hidden px-5 pb-6 pt-6 text-white md:min-h-[520px] md:rounded-[28px]">
      <div className="absolute left-1/2 top-[44%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold/35 bg-primary md:h-[340px] md:w-[340px]" />

      <div className="relative flex w-full flex-1 items-center justify-center">
        {view === "360° jar" && (
          <div
            className="cursor-grab touch-pan-y select-none active:cursor-grabbing"
            onPointerDown={(e) => {
              setSpinning(false);
              drag.current = { x: e.clientX, r: rot };
              (e.target as Element).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const dx = e.clientX - drag.current.x;
              setRot(((drag.current.r + (dx / bgW) * 360 + 540) % 360) - 180);
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            aria-label={`${name} jar. Drag to turn it and read the label.`}
            role="img"
          >
            <JarFrame width={W} label={label} weight={weight}>
              <span
                className="absolute inset-0 block"
                style={{
                  backgroundImage: `url(${label.jar})`,
                  backgroundSize: `${bgW}px ${bgH}px`,
                  backgroundRepeat: "repeat-x",
                  backgroundPosition: `${pos}px 0`,
                }}
              />
            </JarFrame>
          </div>
        )}

        {view === "Full label" && (
          <div className="w-full">
            <div className="overflow-x-auto rounded-xl border border-brand-gold/40 bg-background shadow-lg">
              <Image src={label.full} alt={`${name} full label`} width={1536} height={768} className="block h-auto w-[860px] max-w-none md:w-full md:max-w-full" />
            </div>
            <p className="mt-2 text-center text-[11.5px] font-semibold text-white/80 md:hidden">Swipe to read the whole label</p>
          </div>
        )}

        {view === "Photos" && (
          <div className="flex flex-col items-center gap-3">
            <span className="arch relative block h-[260px] w-[220px] overflow-hidden border-2 border-brand-gold md:h-[300px] md:w-[250px]">
              <Image src={images[photo] ?? images[0]} alt={name} fill sizes="250px" className="object-cover" />
            </span>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.slice(0, 5).map((src, i) => (
                  <button key={src} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`} className={`relative h-11 w-11 overflow-hidden rounded-lg border-2 ${i === photo ? "border-brand-gold" : "border-white/30"}`}>
                    <Image src={src} alt="" fill sizes="44px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-4 w-full max-w-sm space-y-3">
        {view === "360° jar" && (
          <label className="flex items-center gap-3 text-xs font-bold text-brand-gold">
            <span className="font-royal tracking-[0.16em]">360°</span>
            <input
              type="range"
              min={-180}
              max={180}
              value={Math.round(rot)}
              onChange={(e) => { setSpinning(false); setRot(Number(e.target.value)); }}
              aria-label="Turn the jar"
              className="h-7 flex-1 accent-[var(--brand-gold)]"
            />
          </label>
        )}
        <div role="tablist" aria-label="View" className="grid grid-cols-3 gap-1.5 rounded-xl border border-brand-gold/35 bg-black/25 p-1">
          {VIEWS.map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => { setView(v); if (v === "360° jar") { setRot(0); setSpinning(true); } }}
              className={`h-9 rounded-lg text-[12.5px] font-extrabold ${view === v ? "bg-secondary text-secondary-foreground" : "text-white"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
