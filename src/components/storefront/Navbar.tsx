"use client";

import { PromoBanner } from "./promo-banner";

import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "./user-menu";
import { CommandPalette } from "./command-palette";
import { useState } from "react";
import { CartDrawer, CartSheet } from "./cart-drawer";
import { usePathname } from "next/navigation";
import { NotificationsDropdown } from "./notifications";
import { Menu, Search, BookOpen, Award, Sparkles, Phone, Gift, Truck, HelpCircle, User } from "lucide-react";
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
  { href: "/home#gift", label: "Gifting", gold: true },
  { href: "/blend-creator", label: "Spice Atelier" },
  { href: "/about", label: "Our Story" },
];

const MENU_LINKS = [
  { href: "/home#gift", label: "Gift trays", icon: Gift },
  { href: "/blend-creator", label: "Spice Atelier: custom blend", icon: Sparkles },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/about", label: "Our story", icon: Award },
  { href: "/track", label: "Track an order", icon: Truck },
  { href: "/help", label: "Help", icon: HelpCircle },
  { href: "/account", label: "My account", icon: User },
];

/** Logo on a pearl tile with a gold edge, the same plaque as the home page. */
function LogoPlaque() {
  return (
    <span className="flex h-10 w-[58px] items-center justify-center rounded-[10px] border-[1.5px] border-brand-gold bg-card shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)] md:h-[46px] md:w-[70px]">
      <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" width={64} height={51} priority className="h-auto w-[46px] md:w-[56px]" />
    </span>
  );
}

/** Header in the home page's style: logo tile on the left; Search, Menu, Basket and Shop now on the right. */
export function Navbar({ announcement }: { announcement?: { enabled: boolean; messages: import("@/lib/site-content-shared").AnnouncementMsg[] } }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const close = () => setDrawerOpen(false);
  const pathname = usePathname() || "";
  // "Shop now" is pointless where the customer is already shopping or paying.
  const showShopNow = !/^\/(shop|category|search|checkout)/.test(pathname);

  return (
    <header className="night-glass fixed left-0 right-0 top-0 z-50 w-full text-white">
      <PromoBanner {...(announcement ?? {})} />
      <div className="container mx-auto flex h-14 items-center gap-3 px-3 md:h-[70px] md:px-6">
        <Link href="/" aria-label="Spicy Nuts home" className="shrink-0">
          <LogoPlaque />
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-4 lg:flex 2xl:gap-6">
          {DESKTOP_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`whitespace-nowrap text-[13px] font-bold tracking-wide transition-colors hover:text-brand-gold ${l.gold ? "text-brand-gold" : "text-white/90"} ${"wide" in l && l.wide ? "hidden 2xl:inline" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1.5 md:gap-2 lg:ml-0">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="nav-pill round">
            <Search />
          </button>
          <span className="hidden md:inline-flex"><NotificationsDropdown /></span>
          <span className="hidden md:inline-flex"><UserMenu /></span>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger aria-label="Menu" className="nav-pill max-sm:w-[38px] max-sm:px-0">
              <Menu />
              <span className="hidden sm:inline">Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="jaali flex w-[310px] flex-col gap-0 border-l border-brand-gold/30 p-0 text-white sm:w-[360px]">
              <div className="px-5 pb-4 pt-6">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <LogoPlaque />
                <p className="eyebrow mt-4 text-brand-gold">Shop by collection</p>
              </div>
              <nav aria-label="Collections" className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/shop" onClick={close} className="nav-shop col-span-2 justify-center">
                    Shop all jars
                  </Link>
                  {COLLECTIONS.map((c) => (
                    <Link key={c.slug} href={`/shop?collection=${c.slug}`} onClick={close} className="flex min-h-11 items-center gap-2 rounded-xl border border-brand-gold/30 bg-white/5 p-1.5 pr-2 text-[13px] font-semibold hover:border-brand-gold/70">
                      <Image src={c.image} alt="" width={64} height={64} className="arch h-9 w-8 shrink-0 object-cover ring-1 ring-brand-gold" />
                      <span className="leading-tight">{c.name}</span>
                    </Link>
                  ))}
                </div>
                <p className="eyebrow px-1 pb-2 pt-6 text-brand-gold">Spicy Nuts</p>
                {MENU_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={close} className="flex h-11 items-center gap-3 rounded-xl px-2 text-sm font-semibold text-white/90 hover:bg-white/10">
                    <Icon className="h-4 w-4 text-brand-gold" />
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-brand-gold/25 p-4 text-xs text-white/70">
                <p className="flex items-center gap-2 font-semibold text-white">
                  <Phone className="h-3.5 w-3.5 text-brand-gold" /> Contact us via email
                </p>
                <p className="mt-1">spicynuts1973@gmail.com</p>
              </div>
            </SheetContent>
          </Sheet>
          <CartDrawer variant="pill" />
          {showShopNow && (
            <Link href="/shop" className="nav-shop">
              Shop now
            </Link>
          )}
        </div>
      </div>
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} />
      <CartSheet />
    </header>
  );
}
