"use client";

import Image from "next/image";
import { useState } from "react";
import { packLabel } from "./pack-shot";

const VIEWS = [
  { label: "3D pack", angle: -28 },
  { label: "Back label", angle: 180 },
  { label: "Photo", angle: 0 },
] as const;

/**
 * Product stage from the design board: the branded pack in CSS 3D with a 360°
 * slider, a back-label view, and the real product photos.
 */
export function PackViewer({ images, name, weight }: { images: string[]; name: string; weight: string }) {
  const [view, setView] = useState<(typeof VIEWS)[number]["label"]>("3D pack");
  const [ry, setRy] = useState(-28);
  const [photo, setPhoto] = useState(0);
  const W = 168, H = 224, D = 36;

  return (
    <div className="jaali relative flex h-full min-h-[430px] flex-col items-center justify-between overflow-hidden px-5 pb-6 pt-6 text-white md:min-h-[520px] md:rounded-[28px]">
      <div className="absolute left-1/2 top-[44%] h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold/35 bg-primary md:h-[320px] md:w-[320px]" />

      <div className="relative flex flex-1 items-center justify-center">
        {view === "Photo" ? (
          <div className="flex flex-col items-center gap-3">
            <span className="arch relative block h-[260px] w-[220px] overflow-hidden border-2 border-brand-gold md:h-[300px] md:w-[250px]">
              <Image src={images[photo] ?? images[0]} alt={name} fill sizes="250px" className="object-cover" priority />
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
        ) : (
          <div style={{ width: W, height: H, perspective: 1100 }}>
            <div className="relative transition-transform duration-500" style={{ width: W, height: H, transformStyle: "preserve-3d", transform: `rotateX(-8deg) rotateY(${ry}deg)` }}>
              {/* front */}
              <div className="absolute inset-0 flex flex-col items-center gap-1.5 overflow-hidden rounded-[14px_14px_10px_10px] border-2 border-brand-gold bg-primary pt-4" style={{ transform: `translateZ(${D / 2}px)` }}>
                <span className="absolute inset-x-3 top-2 h-[3px] rounded-full bg-secondary" />
                <span className="mt-1 rounded-md bg-background px-1.5 py-0.5">
                  <Image src="/spicy-nuts-logo.png" alt="" width={70} height={56} className="h-5 w-auto" />
                </span>
                <span className="arch relative block h-[100px] w-[94px] overflow-hidden border-2 border-brand-gold">
                  <Image src={images[0]} alt="" fill sizes="94px" className="object-cover" />
                </span>
                <span className="line-clamp-2 px-3 text-center font-heading text-[18px] font-bold leading-none text-brand-gold">{packLabel(name)}</span>
                <span className="font-royal text-[8px] font-bold tracking-[0.2em]">NET WT. {weight.toUpperCase()}</span>
                <span className="absolute inset-x-0 bottom-0 flex h-5 items-center justify-center bg-secondary font-royal text-[8.5px] font-bold tracking-[0.24em] text-secondary-foreground">SPICY NUTS</span>
              </div>
              {/* back label */}
              <div className="absolute inset-0 flex flex-col gap-1.5 rounded-[14px_14px_10px_10px] border-2 border-brand-gold bg-background px-3 py-4 text-[9px] leading-snug text-foreground" style={{ transform: `rotateY(180deg) translateZ(${D / 2}px)` }}>
                <span className="font-royal text-[9.5px] font-bold tracking-[0.14em] text-primary">{packLabel(name).toUpperCase()}</span>
                <span className="text-muted-foreground">Net wt. {weight} · Nutrition facts printed on pack</span>
                <span className="h-px bg-border" />
                <span><strong>Packed &amp; marketed by</strong> B.M.V. SPICES &amp; DRY FRUITS, Shop No 1/206/1, Bhaskar Nagar Chitguppa, Bidar, Karnataka – 585412</span>
                <span className="font-semibold">GSTIN: 29FCBPM9871D1Z6</span>
                <svg className="mt-auto" width="110" height="30" viewBox="0 0 110 30" aria-hidden="true"><path d="M2 0v30M6 0v30M9 0v30M14 0v30M18 0v30M20 0v30M25 0v30M30 0v30M33 0v30M38 0v30M41 0v30M46 0v30M50 0v30M52 0v30M57 0v30M62 0v30M65 0v30M70 0v30M73 0v30M78 0v30M82 0v30M85 0v30M90 0v30M94 0v30M97 0v30M102 0v30M106 0v30" stroke="currentColor" strokeWidth="1.5" /></svg>
              </div>
              {/* sides, top, bottom */}
              {[90, -90].map((deg) => (
                <div key={deg} className="absolute top-0 flex items-center justify-center border-[1.5px] border-brand-gold bg-royal-deep" style={{ left: (W - D) / 2, width: D, height: H, transform: `rotateY(${deg}deg) translateZ(${W / 2}px)` }}>
                  <span className="font-royal text-[9px] font-bold tracking-[0.3em] text-brand-gold [writing-mode:vertical-rl]">{deg > 0 ? "SPICY NUTS" : "ROYAL PANTRY"}</span>
                </div>
              ))}
              <div className="absolute left-0 bg-secondary" style={{ top: (H - D) / 2, width: W, height: D, transform: `rotateX(90deg) translateZ(${H / 2}px)` }} />
              <div className="absolute left-0 bg-royal-deep" style={{ top: (H - D) / 2, width: W, height: D, transform: `rotateX(-90deg) translateZ(${H / 2}px)` }} />
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-4 w-full max-w-sm space-y-3">
        {view !== "Photo" && (
          <label className="flex items-center gap-3 text-xs font-bold text-brand-gold">
            <span className="font-royal tracking-[0.16em]">360°</span>
            <input
              type="range"
              min={-180}
              max={180}
              value={ry}
              onChange={(e) => { setRy(Number(e.target.value)); setView("3D pack"); }}
              aria-label="Rotate the pack"
              className="h-7 flex-1 accent-[var(--brand-gold)]"
            />
          </label>
        )}
        <div role="tablist" aria-label="View" className="grid grid-cols-3 gap-1.5 rounded-xl border border-brand-gold/35 bg-black/25 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.label}
              role="tab"
              aria-selected={view === v.label}
              onClick={() => { setView(v.label); setRy(v.angle); }}
              className={`h-9 rounded-lg text-[12.5px] font-extrabold ${view === v.label ? "bg-secondary text-secondary-foreground" : "text-white"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
