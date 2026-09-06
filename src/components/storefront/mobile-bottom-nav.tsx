"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Search, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useState, useEffect } from "react";
import { CommandPalette } from "./command-palette";
import { CartDrawer } from "./cart-drawer";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Do not show bottom nav on admin routes
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-2xl border-t border-amber-500/25 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)] safe-area-bottom transition-all duration-300"
      >
        <div className="grid grid-cols-5 h-16 items-center px-2 max-w-md mx-auto">
          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 gap-1 transition-colors ${
              pathname === "/"
                ? "text-amber-700 dark:text-amber-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1.5 rounded-xl ${pathname === "/" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : ""}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight font-medium">Home</span>
          </Link>

          {/* 2. Shop */}
          <Link
            href="/shop"
            className={`flex flex-col items-center justify-center py-1 gap-1 transition-colors ${
              pathname.startsWith("/shop")
                ? "text-amber-700 dark:text-amber-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1.5 rounded-xl ${pathname.startsWith("/shop") ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : ""}`}>
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight font-medium">Shop</span>
          </Link>

          {/* 3. Search */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search Products"
            className="flex flex-col items-center justify-center py-1 gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight font-medium">Search</span>
          </button>

          {/* 4. Custom Blend */}
          <Link
            href="/blend-creator"
            className={`flex flex-col items-center justify-center py-1 gap-1 transition-colors ${
              pathname === "/blend-creator"
                ? "text-amber-700 dark:text-amber-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1.5 rounded-xl ${pathname === "/blend-creator" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : ""}`}>
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] tracking-tight font-medium">Blend</span>
          </Link>

          {/* 5. Cart */}
          <div className="flex flex-col items-center justify-center py-1 gap-1">
            <CartDrawer />
            <span className="text-[10px] tracking-tight text-muted-foreground -mt-1 font-medium">Bag</span>
          </div>
        </div>
      </nav>

      <CommandPalette open={searchOpen} setOpen={setSearchOpen} />
    </>
  );
}
