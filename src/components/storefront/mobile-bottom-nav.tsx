"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Home, LayoutGrid, Gift, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartSheet, haptic } from "@/lib/store/ui-store";
import { isDocumentRoute } from "./storefront-only";

const noopSubscribe = () => () => {};

const tabClass =
  "relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-tab tap";
const tone = (active: boolean) => (active ? "text-[#f6e2a8] font-extrabold" : "text-white/70 font-semibold");

/** Gold bar above the active tab. */
function Indicator({ on }: { on: boolean }) {
  return on ? <span aria-hidden="true" className="absolute top-1.5 h-[3px] w-[18px] rounded-full bg-gradient-to-r from-[#b8893a] via-[#f0d49a] to-[#b8893a]" /> : null;
}

/**
 * Phone tab bar, the way native shopping apps work: Home, Shop, Gifts, Cart and Account,
 * all within thumb reach. Cart opens the cart sheet and shows a count that bumps on add.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const cartOpen = useCartSheet((s) => s.open);
  const setCartOpen = useCartSheet((s) => s.setOpen);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const shown = mounted ? count : 0;

  // No tab bar on admin, checkout, documents, or product pages (they have their own buy bar).
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname.startsWith("/product/") || isDocumentRoute(pathname)) return null;

  const isHome = pathname === "/";
  const isShop = pathname.startsWith("/shop") || pathname.startsWith("/category") || pathname.startsWith("/search");
  const isAccount = pathname.startsWith("/account");

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-2.5 bottom-2.5 z-40 rounded-[var(--radius-card)] border border-brand-gold/40 bg-night/90 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid h-[64px] grid-cols-5 items-center">
        <Link href="/" aria-current={isHome ? "page" : undefined} className={`${tabClass} ${tone(isHome)}`}>
          <Indicator on={isHome} />
          <Home className="h-[22px] w-[22px]" />
          Home
        </Link>
        <Link href="/shop" aria-current={isShop ? "page" : undefined} className={`${tabClass} ${tone(isShop)}`}>
          <Indicator on={isShop} />
          <LayoutGrid className="h-[22px] w-[22px]" />
          Shop
        </Link>
        <Link href="/home#gift" className={`${tabClass} ${tone(false)}`}>
          <Gift className="h-[22px] w-[22px]" />
          Gifts
        </Link>
        <button
          type="button"
          onClick={() => { haptic(); setCartOpen(true); }}
          aria-label={`Cart, ${shown} ${shown === 1 ? "item" : "items"}`}
          className={`${tabClass} ${tone(cartOpen)}`}
        >
          <Indicator on={cartOpen} />
          <ShoppingBag className="h-[22px] w-[22px]" />
          Cart
          {shown > 0 && (
            <span
              key={shown}
              className="badge-bump absolute left-[calc(50%+3px)] top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-night bg-buy px-1 text-[10.5px] font-extrabold leading-none text-buy-ink"
            >
              {shown}
            </span>
          )}
        </button>
        <Link href="/account" aria-current={isAccount ? "page" : undefined} className={`${tabClass} ${tone(isAccount)}`}>
          <Indicator on={isAccount} />
          <User className="h-[22px] w-[22px]" />
          Account
        </Link>
      </div>
    </nav>
  );
}
