import Image from "next/image";
import { CookieSettingsLink } from "./cookie-consent";
import Link from "next/link";
import { BRAND_PHONE_DISPLAY, BRAND_PHONE_TEL } from "@/lib/contact";

const footerLinks = {
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "Authentic Masalas", href: "/category/masalas" },
    { label: "Royal Dry Fruits", href: "/category/dry-fruits" },
    { label: "Gift Hampers", href: "/shop?category=gifts" },
  ],
  company: [
    { label: "Our Story", href: "/about" },
    { label: "Meet the Founder", href: "/founder" },
    { label: "Farm Journey", href: "/traceability" },
    { label: "Recipes", href: "/recipes" },
  ],
  support: [
    { label: "Help & Support", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
};

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="eyebrow mb-3 text-brand-gold">{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="inline-flex min-h-9 items-center text-[13.5px] text-white/85 transition-colors hover:text-brand-gold">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

type FooterContact = { phone: string; email: string; address: string; tagline: string; instagram?: string; youtube?: string; facebook?: string };

export function Footer({ contact }: { contact?: FooterContact }) {
  const tel = (contact?.phone || BRAND_PHONE_DISPLAY).replace(/[^\d+]/g, "");
  const socials = [["Instagram", contact?.instagram], ["YouTube", contact?.youtube], ["Facebook", contact?.facebook]].filter(([, url]) => !!url) as Array<[string, string]>;
  return (
    <footer className="jaali pb-44 text-white md:pb-10">
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 flex flex-col items-center text-center md:col-span-1 md:items-start md:text-left">
            <Link href="/" className="mb-4 flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-brand-gold">
                <Image src="/spicy-nuts-logo-v3.jpg" alt="Spicy Nuts" fill className="object-cover" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading text-xl font-bold leading-none text-brand-gold">SPICY NUTS</span>
                <span className="mt-1 font-royal text-[9px] font-semibold uppercase tracking-[0.22em] text-white/75">Fine Nuts &amp; Spices</span>
              </div>
            </Link>
            <p className="mb-4 text-[13.5px] leading-relaxed text-white/80">
              {contact?.tagline || "Purveyors of Imperial Dry Fruits, Royal Nuts, and Rare Whole Spices sourced directly from single-estate farms."}
            </p>
            <div className="space-y-0.5 text-xs leading-relaxed text-white/80">
              <p className="font-semibold text-white">B.M.V. SPICES & DRY FRUITS</p>
              {contact?.address
                ? <p className="max-w-[260px]">{contact.address}</p>
                : (<><p>Shop No 1/206/1, Bhaskar Nagar Chitguppa,</p><p>Chitguppa Sub Post Office, Chitgoppa,</p><p>Bidar, Karnataka – 585412</p></>)}
              <p className="mt-2 font-semibold text-brand-gold">GSTIN: 29FCBPM9871D1Z6</p>
              <p>📞 <a href={`tel:${contact?.phone ? tel : BRAND_PHONE_TEL}`} className="hover:text-brand-gold">{contact?.phone || BRAND_PHONE_DISPLAY}</a></p>
              <p>📧 <a href={`mailto:${contact?.email || "spicynuts1973@gmail.com"}`} className="hover:text-brand-gold">{contact?.email || "spicynuts1973@gmail.com"}</a></p>
              {socials.length > 0 && (
                <p className="flex gap-3 pt-2">{socials.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="font-semibold text-brand-gold hover:text-white">{name}</a>)}</p>
              )}
            </div>
          </div>

          <LinkColumn title="Shop" links={footerLinks.shop} />
          <LinkColumn title="Company" links={footerLinks.company} />
          <div className="col-span-2 md:col-span-1">
            <div>
              <LinkColumn title="Support" links={footerLinks.support} />
              <CookieSettingsLink className="mt-3 text-left text-[15px] text-white/70 transition-colors hover:text-brand-gold" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-brand-gold/25 pt-6 sm:flex-row">
          <p className="text-xs text-white/70">&copy; {new Date().getFullYear()} Spicy Nuts. All rights reserved.</p>
          <div className="flex items-center gap-3 text-xs text-white/70">
            <span>UPI</span><span>&#x2022;</span><span>Visa</span><span>&#x2022;</span><span>Mastercard</span><span>&#x2022;</span><span>RuPay</span><span>&#x2022;</span><span>Net Banking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
