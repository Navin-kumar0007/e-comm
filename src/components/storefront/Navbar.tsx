"use client";

import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "./user-menu";
import { CommandPalette } from "./command-palette";
import { useState } from "react";
import { CartDrawer } from "./cart-drawer";
import { NotificationsDropdown } from "./notifications";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const NavLinks = () => (
    <>
      <Link href="/shop" className="text-sm font-medium transition-colors hover:text-primary">
        Shop All
      </Link>
      <Link href="/blend-creator" className="text-sm font-medium transition-colors hover:text-primary">
        Custom Blend
      </Link>
      <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
        Our Story
      </Link>
      <Link href="/recipes" className="text-sm font-medium transition-colors hover:text-primary">
        Recipes
      </Link>
      <Link href="/blog" className="text-sm font-medium transition-colors hover:text-primary">
        Journal
      </Link>
    </>
  );

  return (
    <header className="bg-background/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-border shadow-md shadow-primary/5 h-20">
      <div className="container mx-auto h-full px-4 md:px-6 flex items-center justify-between">

        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger
                aria-label="Open menu"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-primary h-9 w-9 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] flex flex-col gap-6 pt-12">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-amber-500/20 shadow-sm flex-shrink-0">
                    <Image src="/logo.png" alt="Nutty World" fill className="object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading font-black text-lg tracking-tight text-foreground leading-none">
                      NUTTY WORLD
                    </span>
                    <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase mt-1 font-semibold">
                      Fine Nuts &amp; Spices
                    </span>
                  </div>
                </div>
                <div className="h-px w-full bg-border" />
                <NavLinks />
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden border border-amber-500/20 shadow-sm flex-shrink-0">
              <Image src="/logo.png" alt="Nutty World" fill className="object-cover" priority />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-lg md:text-xl tracking-tight text-foreground leading-none">
                NUTTY WORLD
              </span>
              <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase mt-1 font-semibold">
                Fine Nuts &amp; Spices
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-8">
          <NavLinks />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-4 h-full">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-primary h-9 w-9"
          >
              <Search className="w-5 h-5" />
            </button>
          <NotificationsDropdown />
          <CartDrawer />
          <UserMenu />
        </div>

      </div>
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} />
    </header>
  );
}
