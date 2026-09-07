"use client";

import { PromoBanner } from "./promo-banner";

import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "./user-menu";
import { CommandPalette } from "./command-palette";
import { useState } from "react";
import { CartDrawer } from "./cart-drawer";
import { NotificationsDropdown } from "./notifications";
import { Menu, Search, Sparkles, MapPin, BookOpen, Award, Phone } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/shop" className="text-sm font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-400">
        Shop All
      </Link>
      <Link href="/category/dry-fruits" className="text-sm font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-400">
        Royal Nuts
      </Link>
      <Link href="/category/masalas" className="text-sm font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-400">
        Exotic Spices
      </Link>
      <Link href="/blend-creator" className="text-sm font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Custom Blend</span>
      </Link>
      <Link href="/traceability" className="text-sm font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-400">
        Farm Journey
      </Link>
      <Link href="/recipes" className="text-sm font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-400">
        Recipes
      </Link>
      <Link href="/about" className="text-sm font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-400">
        Our Story
      </Link>
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      <PromoBanner />
      <div className="bg-background/90 backdrop-blur-2xl w-full border-b border-amber-500/20 shadow-sm shadow-primary/5 h-16 md:h-20 transition-all duration-300">
        <div className="container mx-auto h-full px-3 md:px-6 flex items-center justify-between">

        {/* Left: Mobile Menu Trigger + Brand Identity */}
        <div className="flex items-center gap-2.5 md:gap-4">
          <div className="md:hidden">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger
                aria-label="Open Navigation Menu"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-amber-500/10 hover:text-primary h-10 w-10 border border-border/50"
              >
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[310px] sm:w-[350px] p-0 flex flex-col justify-between bg-[#FAF7F2] dark:bg-zinc-950 border-r border-amber-500/25">
                {/* Drawer Top Header */}
                <div>
                  <div className="p-6 pb-5 bg-gradient-to-b from-emerald-950/10 dark:from-emerald-950/50 to-transparent border-b border-amber-500/15">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-[110px] flex-shrink-0">
                        <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" fill className="object-contain object-left dark:brightness-110" />
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="p-5 space-y-1">
                    <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-muted-foreground px-3 mb-2">Collections</p>
                    <Link
                      href="/shop"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/10 text-sm font-medium transition-colors"
                    >
                      <span className="text-base">🛍️</span>
                      <span>Shop All Harvests</span>
                    </Link>
                    <Link
                      href="/category/dry-fruits"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/10 text-sm font-medium transition-colors"
                    >
                      <span className="text-base">👑</span>
                      <span>Royal Mamra &amp; Dry Fruits</span>
                    </Link>
                    <Link
                      href="/category/masalas"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/10 text-sm font-medium transition-colors"
                    >
                      <span className="text-base">🌶️</span>
                      <span>Single-Origin Spices</span>
                    </Link>
                    <Link
                      href="/blend-creator"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-sm font-bold text-amber-900 dark:text-amber-300 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Custom Blend Atelier</span>
                    </Link>

                    <div className="pt-4 mt-4 border-t border-border/40">
                      <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-muted-foreground px-3 mb-2">Heritage</p>
                      <Link
                        href="/traceability"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/10 text-sm font-medium transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Farm Sourcing Map</span>
                      </Link>
                      <Link
                        href="/recipes"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/10 text-sm font-medium transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        <span>Traditional Recipes</span>
                      </Link>
                      <Link
                        href="/about"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/10 text-sm font-medium transition-colors"
                      >
                        <Award className="w-4 h-4 text-zinc-500" />
                        <span>Our Founding Story</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Contact */}
                <div className="p-5 border-t border-border/40 bg-white/40 dark:bg-zinc-900/40 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 mb-2 text-foreground font-semibold">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct Concierge: +91 98765 43210</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">Sourced directly from certified organic farms &amp; Kashmir valleys.</p>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo & Wordmark */}
          <Link href="/" className="flex items-center group -ml-2">
            <div className="relative h-14 md:h-[72px] w-[110px] md:w-[140px] flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" fill className="object-contain object-left dark:brightness-110" priority />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8">
          <NavLinks />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1.5 md:gap-3 h-full">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 h-9 w-9 border border-transparent hover:border-amber-500/20"
          >
            <Search className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <NotificationsDropdown />
          <CartDrawer />
          <UserMenu />
        </div>

        </div>
      </div>
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} />
    </header>
  );
}
