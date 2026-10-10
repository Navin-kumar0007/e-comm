import Image from "next/image";
import Link from "next/link";
import { Truck, ShieldCheck, FileText, RotateCcw } from "lucide-react";
import { ProductCard, type ProductCardProduct } from "@/components/storefront/product-card";

export function SectionTitle({ eyebrow, title, href, linkLabel = "View all" }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <span className="eyebrow text-brand-gold-deep">{eyebrow}</span>
        <h2 className="font-heading text-[28px] font-bold leading-none text-primary md:text-[36px]">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="flex min-h-10 shrink-0 items-center text-[13px] font-extrabold text-brand-gold-deep md:text-sm">
          {linkLabel} ›
        </Link>
      )}
    </div>
  );
}

/** "The royal shelf": horizontal pack row on mobile, 4-up grid on desktop, gold shelf underneath. */
export function RoyalShelf({ products }: { products: ProductCardProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className="pt-10 md:container md:mx-auto md:max-w-7xl md:px-6 md:pt-14">
      <div className="px-4 md:px-0">
        <SectionTitle eyebrow="The royal shelf" title="Pantry staples" href="/shop" />
      </div>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 pt-4 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 md:pt-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} className="w-[156px] shrink-0 md:w-auto" />
        ))}
      </div>
      <div className="mx-4 h-1.5 rounded-full bg-secondary shadow-[0_6px_12px_rgba(122,87,28,0.35)] md:mx-0 md:mt-4 md:h-2" aria-hidden="true" />
    </section>
  );
}

const USES = [
  { eyebrow: "Daily", title: "Snacking", body: "Almonds, walnuts, pistachios, makhana, roasted chana", href: "/shop?collection=almonds" },
  { eyebrow: "Morning", title: "Breakfast & smoothies", body: "Chia, flax, sabja, pumpkin seeds, breakfast mix", href: "/shop?collection=seeds" },
  { eyebrow: "Festive", title: "Sweets & gifting", body: "Kaju, kishmish, panch mewa, anjir, dhaga mishri", href: "/shop?collection=mixes" },
];

function AtelierCard({ wide }: { wide?: boolean }) {
  return (
    <Link
      href="/blend-creator"
      className={`flex overflow-hidden rounded-[22px] ${wide ? "min-h-[170px] bg-primary text-white" : "items-center gap-4 border border-border bg-card p-4"}`}
    >
      {wide ? (
        <>
          <span className="relative w-[42%] shrink-0">
            <Image src="https://images.unsplash.com/photo-1532336414038-cf19250c5757?q=80&w=600&auto=format&fit=crop" alt="Bowls of spices" fill sizes="200px" className="object-cover" />
          </span>
          <span className="flex flex-col justify-center gap-1.5 p-5">
            <span className="eyebrow text-brand-gold">Spice Atelier</span>
            <span className="font-heading text-2xl font-bold leading-none">Create your own masala</span>
            <span className="text-sm font-extrabold text-brand-gold">Start blending ›</span>
          </span>
        </>
      ) : (
        <>
          <span className="arch relative block h-[120px] w-[96px] shrink-0 overflow-hidden border-2 border-brand-gold">
            <Image src="https://images.unsplash.com/photo-1532336414038-cf19250c5757?q=80&w=400&auto=format&fit=crop" alt="Bowls of spices" fill sizes="96px" className="object-cover" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="eyebrow text-brand-gold-deep">Spice Atelier</span>
            <span className="font-heading text-[23px] font-bold leading-none text-primary">Create your own masala</span>
            <span className="pt-1 text-[13px] font-extrabold text-primary">Start blending ›</span>
          </span>
        </>
      )}
    </Link>
  );
}

/** Mobile: atelier card. Desktop: three "shop by use" tiles + atelier card (design board row). */
export function UseAndAtelier() {
  return (
    <>
      <section className="mx-4 mt-4 md:hidden">
        <AtelierCard />
      </section>
      <section className="container mx-auto mt-14 hidden max-w-7xl grid-cols-4 gap-4 px-6 md:grid">
        {USES.map((u) => (
          <Link key={u.title} href={u.href} className="tilt-hover flex flex-col gap-1.5 rounded-[22px] border border-border bg-card p-5">
            <span className="eyebrow text-brand-gold-deep">{u.eyebrow}</span>
            <span className="font-heading text-2xl font-bold leading-none text-primary">{u.title}</span>
            <span className="text-[13px] text-muted-foreground">{u.body}</span>
          </Link>
        ))}
        <AtelierCard wide />
      </section>
    </>
  );
}

export function FounderSection() {
  return (
    <section className="mx-4 mt-4 md:container md:mx-auto md:mt-14 md:max-w-7xl md:px-6">
      <div className="flex flex-col gap-3 rounded-[22px] border border-border bg-card p-5 md:flex-row md:items-center md:gap-10 md:rounded-[26px] md:p-10">
        <div className="flex items-center gap-4 md:block">
          <span className="arch flex h-[100px] w-[80px] shrink-0 items-center justify-center border-2 border-brand-gold bg-muted md:h-[230px] md:w-[180px]">
            <Image src="/spicy-nuts-logo.png" alt="" width={112} height={89} className="w-14 md:w-28" />
          </span>
          <div className="md:hidden">
            <span className="eyebrow text-brand-gold-deep">Meet the founder</span>
            <p className="font-heading text-[28px] font-bold leading-none text-primary">Mahesh</p>
            <p className="text-[12.5px] text-muted-foreground">Proprietor, B.M.V. Spices &amp; Dry Fruits</p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="hidden md:block">
            <span className="eyebrow text-brand-gold-deep">Meet the founder</span>
            <h2 className="font-heading text-[42px] font-bold leading-none text-primary">Mahesh</h2>
            <p className="mt-1 text-sm text-muted-foreground">Proprietor, B.M.V. Spices &amp; Dry Fruits</p>
          </div>
          <blockquote className="max-w-3xl font-heading text-lg italic leading-snug md:text-[22px]">
            “I started Spicy Nuts with a simple realization: the flavors of my childhood were slowly disappearing from modern kitchens, replaced by heavily processed, artificially flavored alternatives.”
          </blockquote>
          <Link href="/founder" className="flex h-10 items-center self-start rounded-xl border-[1.5px] border-primary px-4 text-[13px] font-extrabold text-primary md:h-11">
            Read his story
          </Link>
        </div>
      </div>
    </section>
  );
}

const TRUST = [
  { icon: Truck, title: "Free shipping", body: "Over ₹999" },
  { icon: ShieldCheck, title: "Secure checkout", body: "Razorpay: UPI, cards, netbanking" },
  { icon: RotateCcw, title: "Easy returns", body: "From your orders page" },
  { icon: FileText, title: "GST invoice", body: "With every order" },
];

export function TrustStrip() {
  return (
    <section className="mx-4 mb-8 mt-4 md:container md:mx-auto md:mb-16 md:mt-14 md:max-w-7xl md:px-6">
      <div className="grid grid-cols-2 gap-3 rounded-[22px] bg-muted p-4 md:grid-cols-4 md:gap-4 md:p-6">
        {TRUST.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col items-center gap-1.5 text-center md:flex-row md:text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex flex-col leading-tight">
              <strong className="text-[13px]">{title}</strong>
              <span className="text-[11.5px] text-muted-foreground">{body}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
