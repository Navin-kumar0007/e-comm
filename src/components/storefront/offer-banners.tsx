import Link from "next/link";
import type { Banner } from "@/lib/site-content-shared";

/** Offer banners from Admin → Website editor. Several banners scroll sideways; each can have a phone-sized image. */
export function OfferBanners({ banners }: { banners: Banner[] }) {
  return (
    <section aria-label="Offers" className="container mx-auto max-w-7xl px-4 pt-6 md:pt-10">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
        {banners.map((b) => {
          const img = (
            <picture>
              {b.mobileImage && <source media="(max-width: 767px)" srcSet={b.mobileImage} />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt={b.alt} loading="lazy" decoding="async" className="block h-auto w-full rounded-2xl border border-brand-gold/40 object-cover shadow-sm" />
            </picture>
          );
          return (
            <div key={b.id} className={`shrink-0 snap-center ${banners.length > 1 ? "w-[88%] md:w-[70%]" : "w-full"}`}>
              {b.link ? <Link href={b.link} aria-label={b.alt}>{img}</Link> : img}
            </div>
          );
        })}
      </div>
    </section>
  );
}
