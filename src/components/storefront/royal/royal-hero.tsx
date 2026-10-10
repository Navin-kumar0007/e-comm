import Link from "next/link";
import { Search } from "lucide-react";
import { RoyalOrbit } from "./royal-orbit";

export function RoyalHero({
  eyebrow = "From Bidar, Karnataka",
  title = "The Royal Pantry",
  subtitle = "Almonds, cashews, walnuts, pistachios, dates, raisins and seeds, packed for gifting and for everyday.",
  primaryText = "Shop the pantry",
  primaryLink = "/shop",
  secondaryText = "Build a gift tray",
  secondaryLink = "#gift",
}: { eyebrow?: string; title?: string; subtitle?: string; primaryText?: string; primaryLink?: string; secondaryText?: string; secondaryLink?: string }) {
  // The desktop title breaks after the first word ("The Royal / Pantry" style) when it has 3+ words.
  const words = title.split(" ");
  const cut = words.length >= 3 ? words.length - 1 : 0;
  return (
    <section className="jaali relative pt-header text-white">
      {/* ---------- Mobile (design board: Mobile · Royal 3D home) ---------- */}
      <div className="px-5 pb-12 pt-4 text-center md:hidden">
        <span className="eyebrow text-brand-gold">{eyebrow}</span>
        <h1 className="mt-2 font-heading text-[40px] font-bold leading-[0.95]">{title}</h1>
        <div className="gold-rule mt-2.5 justify-center" aria-hidden="true">
          <span className="h-2 w-2 rotate-45 bg-brand-gold" />
        </div>
        <div className="mx-auto mt-1 flex justify-center">
          <RoyalOrbit />
        </div>
        <p className="mx-auto mt-4 max-w-sm text-[13.5px] text-white/85">
          {subtitle}
        </p>
        <div className="mt-4 flex gap-2.5">
          <Link href={primaryLink} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-secondary text-[13.5px] font-extrabold text-secondary-foreground">{primaryText}</Link>
          <Link href={secondaryLink} className="flex h-11 flex-1 items-center justify-center rounded-xl border-[1.5px] border-brand-gold text-[13.5px] font-bold">{secondaryText}</Link>
        </div>
      </div>

      {/* ---------- Desktop (design board: Desktop · Royal 3D home) ---------- */}
      <div className="container mx-auto hidden max-w-7xl grid-cols-2 items-center gap-10 px-6 pb-20 pt-10 md:grid">
        <div className="flex flex-col gap-4">
          <span className="eyebrow text-brand-gold">{eyebrow}</span>
          <h1 className="font-heading text-[clamp(52px,5.4vw,72px)] font-bold leading-[0.9]">{cut ? <>{words.slice(0, cut).join(" ")}<br />{words.slice(cut).join(" ")}</> : title}</h1>
          <div className="gold-rule" aria-hidden="true">
            <span className="h-2.5 w-2.5 rotate-45 bg-brand-gold" />
          </div>
          <p className="max-w-md text-base text-white/85">
            {subtitle}
          </p>
          <div className="mt-1 flex gap-3">
            <Link href={primaryLink} className="flex h-12 items-center rounded-xl bg-secondary px-7 text-[15px] font-extrabold text-secondary-foreground">{primaryText}</Link>
            <Link href={secondaryLink} className="flex h-12 items-center rounded-xl border-[1.5px] border-brand-gold px-7 text-[15px] font-bold">{secondaryText}</Link>
          </div>
        </div>

        <div className="mx-auto">
          <RoyalOrbit size="lg" />
        </div>
      </div>

      {/* Floating search card (mobile) overlapping the hero edge */}
      <form action="/search" className="relative z-10 mx-4 -mb-7 md:hidden">
        <label className="flex h-[52px] items-center gap-2.5 rounded-2xl border border-border bg-card pl-4 pr-1.5 text-muted-foreground shadow-[0_14px_30px_rgba(74,15,29,0.18)]">
          <Search className="h-[18px] w-[18px]" />
          <span className="sr-only">Search products</span>
          <input name="q" type="search" placeholder="Search almonds, cashews, dates…" className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none" />
          <button type="submit" className="h-10 rounded-xl bg-primary px-3.5 text-[13px] font-bold text-primary-foreground">Search</button>
        </label>
      </form>
    </section>
  );
}
