import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";

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

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 pb-24 md:pb-12">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-amber-500/20 shadow-sm flex-shrink-0">
                <Image src="/spicy-nuts-logo-v3.jpg" alt="Spicy Nuts" fill className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-lg tracking-tight text-foreground leading-none">
                  SPICY NUTS
                </span>
                <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase mt-1 font-semibold">
                  Fine Nuts &amp; Spices
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Purveyors of Imperial Dry Fruits, Royal Nuts, and Rare Whole Spices sourced directly from single-estate farms.
            </p>
            <div className="text-xs text-muted-foreground space-y-1 mt-4">
              <p className="font-semibold text-foreground">B.M.V. SPICES & DRY FRUITS</p>
              <p>Shop No 1/206/1, Bhaskar Nagar Chitguppa,</p>
              <p>Chitguppa Sub Post Office, Chitgoppa,</p>
              <p>Bidar, Karnataka – 585412</p>
              <p className="mt-2 text-primary font-medium">GSTIN: 29FCBPM9871D1Z6</p>
              <p>📧 spicynuts1973@gmail.com</p>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-heading font-bold text-sm mb-4">Shop</h3>
            <ul className="space-y-2.5">
              {footerLinks.shop.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-heading font-bold text-sm mb-4">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-heading font-bold text-sm mb-4">Support</h3>
            <ul className="space-y-2.5">
              {footerLinks.support.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Spicy Nuts. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>UPI</span>
            <span>&#x2022;</span>
            <span>Visa</span>
            <span>&#x2022;</span>
            <span>Mastercard</span>
            <span>&#x2022;</span>
            <span>RuPay</span>
            <span>&#x2022;</span>
            <span>Net Banking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
