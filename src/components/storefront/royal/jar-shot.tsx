import Image from "next/image";
import type { ReactNode } from "react";
import type { ProductLabel } from "@/lib/product-labels";

/** Label front artwork is 720 × 664 (front panel without the net-weight band). */
export const LABEL_FRONT_RATIO = 664 / 720;

/** Curved light and shade laid over the label so it reads as a round jar. */
const CYLINDER_SHADE =
  "linear-gradient(90deg, rgba(20,10,5,0.40) 0%, rgba(20,10,5,0.10) 11%, rgba(255,255,255,0) 20%, rgba(255,255,255,0.30) 28%, rgba(255,255,255,0.06) 36%, rgba(0,0,0,0) 58%, rgba(20,10,5,0.12) 84%, rgba(20,10,5,0.44) 100%)";

const GLASS =
  "linear-gradient(90deg, rgba(255,255,255,0.62), rgba(255,255,255,0.18) 38%, rgba(255,255,255,0.10) 62%, rgba(255,255,255,0.42))";

/**
 * PET jar with a gold screw lid. The label area is passed in as children so the
 * product page can show a rotating wrap while cards show the static front.
 */
export function JarFrame({
  width,
  label,
  weight,
  children,
}: {
  width: number;
  label: ProductLabel;
  weight?: string | null;
  children: ReactNode;
}) {
  const W = width;
  const labelH = Math.round(W * LABEL_FRONT_RATIO);
  const lidH = Math.round(W * 0.17);
  const bandH = Math.max(12, Math.round(W * 0.11));
  return (
    <span className="relative flex flex-col items-center" style={{ width: W }}>
      {/* lid */}
      <span
        className="relative z-10 block"
        style={{
          width: W * 0.86,
          height: lidH,
          borderRadius: `${W * 0.035}px ${W * 0.035}px ${W * 0.015}px ${W * 0.015}px`,
          background:
            "repeating-linear-gradient(90deg, rgba(60,40,10,0.16) 0 1.5px, transparent 1.5px 4px), linear-gradient(180deg, #F7E6B0 0%, #D9B566 32%, #A97F30 72%, #7A5A1C 100%)",
          boxShadow: "inset 0 -2px 3px rgba(60,35,5,0.35), 0 2px 4px rgba(40,20,5,0.25)",
        }}
      >
        <span className="absolute inset-x-[6%] top-[14%] h-[18%] rounded-full bg-white/45 blur-[1px]" />
      </span>
      {/* neck */}
      <span
        className="block"
        style={{ width: W * 0.9, height: Math.max(3, W * 0.04), background: GLASS, borderInline: "1px solid rgba(120,90,60,0.25)" }}
      />
      {/* body */}
      <span
        className="relative block overflow-hidden"
        style={{
          width: W,
          borderRadius: `${W * 0.1}px ${W * 0.1}px ${W * 0.13}px ${W * 0.13}px`,
          background: GLASS,
          border: "1px solid rgba(120,90,60,0.28)",
          boxShadow: "0 10px 18px -8px rgba(40,20,8,0.45)",
        }}
      >
        <span className="block" style={{ height: Math.round(W * 0.05) }} />
        <span className="relative block overflow-hidden" style={{ height: labelH }}>
          {children}
        </span>
        <span
          className="flex items-center justify-center font-royal font-bold uppercase"
          style={{
            height: bandH,
            background: `linear-gradient(180deg, ${label.band1}, ${label.band})`,
            borderTop: `1px solid ${label.gold}`,
            color: label.gold,
            fontSize: Math.max(7, W * 0.056),
            letterSpacing: "0.16em",
          }}
        >
          Net wt. {weight ?? "250 g"}
        </span>
        <span className="block" style={{ height: Math.round(W * 0.05) }} />
        <span className="pointer-events-none absolute inset-0" style={{ background: CYLINDER_SHADE }} />
        <span className="pointer-events-none absolute inset-y-0 left-[24%] w-[5%] bg-white/25 blur-[2px]" />
      </span>
    </span>
  );
}

/** Product card / shelf jar showing the static label front. */
export function JarShot({
  label,
  name,
  weight,
  width = 96,
  priority,
}: {
  label: ProductLabel;
  name: string;
  weight?: string | null;
  width?: number;
  priority?: boolean;
}) {
  return (
    <JarFrame width={width} label={label} weight={weight}>
      <Image
        src={label.front}
        alt={`${name} jar label`}
        fill
        sizes={`${width}px`}
        priority={priority}
        className="object-cover object-top"
      />
    </JarFrame>
  );
}
