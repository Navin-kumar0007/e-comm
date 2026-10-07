"use client";

import { PromoBanner } from "./promo-banner";

import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "./user-menu";
import { CommandPalette } from "./command-palette";
import { useState } from "react";
import { CartDrawer } from "./cart-drawer";
import { NotificationsDropdown } from "./notifications";
import { Menu, Search, BookOpen, Award, MapPin, Sparkles, Phone } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { COLLECTIONS } from "@/lib/collections";

const DESKTOP_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?collection=almonds", label: "Almonds", wide: true },
  { href: "/shop?collection=cashews", label: "Cashews", wide: true },
  { href: "/shop?collection=walnuts", label: "Walnuts", wide: true },
  { href: "/shop?collection=dates", label: "Dates" },
  { href: "/shop?collection=seeds", label: "Seeds" },
  { href: "/#gift", label: "Gifting", gold: true },
  { href: "/blend-creator", label: "Spice Atelier" },
  { href: "/about", label: "Our Story" },
];

/** Logo on an ivory plaque so the green-and-gold wordmark stays legible on maroon. */
function LogoPlaque() {
  return (
    <span className="inline-flex items-center rounded-xl border border-brand-gold bg-background px-2 py-0.5">
      <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" width={140} height={111} priority className="h-[34px] w-auto md:h-[46px]" />
    </span>
  );
}

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const close = () => setDrawerOpen(false);

  return (
    <header className="jaali fixed left-0 right-0 top-0 z-50 w-full text-white shadow-[0_6px_20px_rgba(42,10,18,0.25)]">
      <PromoBanner />
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-2 md:h-[70px] md:px-6">
        {/* Left: menu (mobile) + logo */}
        <div className="flex flex-1 items-center gap-1 lg:flex-none">
          <div className="lg:hidden">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger aria-label="Open menu" className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/10">
                <Menu className="h-[22px] w-[22px]" />
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[300px] flex-col gap-0 border-r border-border bg-background p-0 sm:w-[340px]">
                <div className="jaali px-5 pb-5 pt-6">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <LogoPlaque />
                  <p className="eyebrow mt-3 text-brand-gold">Shop by collection</p>
                </div>
                <nav aria-label="Collections" className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/shop" onClick={close} className="col-span-2 flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                      Shop all
                    </Link>
                    {COLLECTIONS.map((c) => (
                      <Link key={c.slug} href={`/shop?collection=${c.slug}`} onClick={close} className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card p-1.5 pr-2 text-[13px] font-semibold hover:border-brand-gold">
                        <Image src={c.image} alt="" width={64} height={64} className="arch h-9 w-8 shrink-0 object-cover ring-1 ring-brand-gold" />
                        <span className="leading-tight">{c.name}</span>
                      </Link>
                    ))}
                  </div>
                  <p className="eyebrow px-1 pb-2 pt-6 text-brand-gold-deep">Spicy Nuts</p>
                  {[
                    { href: "/blend-creator", label: "Spice Atelier: custom blend", icon: Sparkles },
                    { href: "/traceability", label: "Farm journey", icon: MapPin },
                    { href: "/recipes", label: "Recipes", icon: BookOpen },
                    { href: "/about", label: "Our story", icon: Award },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={close} className="flex h-11 items-center gap-3 rounded-xl px-2 text-sm font-semibold hover:bg-muted">
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </Link>
                  ))}
                </nav>
                <div className="border-t border-border p-4 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Contact us via email
                  </p>
                  <p className="mt-1">spicynuts1973@gmail.com</p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" aria-label="Spicy Nuts home" className="mx-auto lg:mx-0">
            <LogoPlaque />
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-4 lg:flex 2xl:gap-6">
          {DESKTOP_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`whitespace-nowrap text-[13px] font-bold tracking-wide transition-colors hover:text-brand-gold ${l.gold ? "text-brand-gold" : "text-white"} ${"wide" in l && l.wide ? "hidden 2xl:inline" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex flex-1 items-center justify-end gap-0.5 md:gap-1.5 lg:flex-none">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="inline-flex h-10 items-center gap-2 rounded-full px-2.5 text-sm font-semibold hover:bg-white/10 2xl:w-52 2xl:border 2xl:border-brand-gold/45 2xl:bg-white/10 2xl:px-4 2xl:text-white/80"
          >
            <Search className="h-[19px] w-[19px]" />
            <span className="hidden 2xl:inline">Search the pantry</span>
          </button>
          <span className="hidden md:inline-flex"><NotificationsDropdown /></span>
          <span className="hidden md:inline-flex"><UserMenu /></span>
          <span className="md:hidden"><CartDrawer tone="dark" /></span>
          <span className="hidden md:inline-flex"><CartDrawer variant="pill" /></span>
        </div>
      </div>
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} />
    </header>
  );
}
