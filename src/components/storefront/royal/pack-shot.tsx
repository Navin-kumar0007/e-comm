import Image from "next/image";

/** Short label printed on the pack: drops the bracketed English/Hindi alias. */
export function packLabel(name: string) {
  return name.replace(/\s*\(.*?\)\s*/g, " ").trim();
}

const SIZES = {
  xs: { w: 64, h: 86, d: 12, win: 38, title: 10, tag: 0 },
  sm: { w: 88, h: 118, d: 16, win: 52, title: 12, tag: 7.5 },
  md: { w: 112, h: 150, d: 20, win: 68, title: 14, tag: 8 },
} as const;

/**
 * Branded Spicy Nuts pack drawn in CSS 3D: maroon pouch, gold zip, arch window
 * showing the product photo. Matches the "royal shelf" pack in the design board.
 */
export function PackShot({
  image,
  name,
  weight,
  size = "sm",
  rotate = -24,
}: {
  image: string;
  name: string;
  weight?: string | null;
  size?: keyof typeof SIZES;
  rotate?: number;
}) {
  const s = SIZES[size];
  return (
    <span className="relative block" style={{ width: s.w, height: s.h, perspective: 700 }}>
      <span
        className="absolute inset-0 block"
        style={{ transformStyle: "preserve-3d", transform: `rotateY(${rotate}deg) rotateX(4deg)` }}
      >
        <span
          className="absolute inset-0 flex flex-col items-center gap-1.5 rounded-[12px_12px_8px_8px] border-[1.5px] border-brand-gold bg-primary pt-3.5"
          style={{ transform: `translateZ(${s.d / 2}px)` }}
        >
          <span className="absolute inset-x-2 top-1.5 h-[3px] rounded-full bg-secondary" />
          <span className="arch relative mt-1.5 block overflow-hidden border-2 border-brand-gold" style={{ width: s.win, height: s.win * 1.08 }}>
            <Image src={image} alt="" fill sizes={`${s.win}px`} className="object-cover" />
          </span>
          <span className="line-clamp-2 px-1.5 text-center font-heading font-bold leading-none text-brand-gold" style={{ fontSize: s.title }}>
            {packLabel(name)}
          </span>
          {weight && s.tag > 0 && (
            <span className="font-royal font-bold uppercase tracking-[0.18em] text-white" style={{ fontSize: s.tag }}>
              Net wt. {weight}
            </span>
          )}
        </span>
        <span
          className="absolute top-0 block rounded-r-md bg-royal-deep"
          style={{ left: s.w, width: s.d, height: s.h, transformOrigin: "left center", transform: `translateZ(${s.d / 2}px) rotateY(90deg)` }}
        />
      </span>
    </span>
  );
}
