"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Home, LayoutGrid, Gift, Heart, User } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { FREE_SHIPPING_AT } from "./cart-drawer";

const noopSubscribe = () => () => {};
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Maroon bar above the tab bar showing the running total and the free-shipping gap. */
function FloatingCartBar() {
  const items = useCartStore((s) => s.items);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted || items.length === 0) return null;
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const total = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const left = FREE_SHIPPING_AT - total;

  return (
    <Link
      href="/checkout"
      className="fixed inset-x-3 bottom-[88px] z-40 flex h-14 items-center justify-between rounded-2xl border border-brand-gold bg-primary py-0 pl-4 pr-2 text-primary-foreground shadow-[0_14px_28px_rgba(74,15,29,0.35)] md:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <span className="flex flex-col leading-tight">
        <span className="text-[11.5px] opacity-85">
          {count} {count === 1 ? "item" : "items"} · {left > 0 ? `${inr(left)} to free shipping` : "free shipping"}
        </span>
        <strong className="tnum text-base">{inr(total)}</strong>
      </span>
      <span className="flex h-10 items-center rounded-xl bg-secondary px-4 text-sm font-extrabold text-secondary-foreground">Checkout ›</span>
    </Link>
  );
}

const itemClass = "flex flex-col items-center justify-center gap-0.5 min-h-12 text-[10.5px]";

export function MobileBottomNav() {
  const pathname = usePathname();

  // Do not show bottom nav on admin routes or during checkout
  // Product pages have their own sticky buy bar
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname.startsWith("/product/")) return null;

  const tone = (active: boolean) => (active ? "text-primary font-extrabold" : "text-muted-foreground font-semibold");
  const isCat = pathname.startsWith("/shop") || pathname.startsWith("/category");

  return (
    <>
      <FloatingCartBar />
      <nav
        aria-label="Mobile navigation"
        className="glass fixed inset-x-2.5 bottom-2.5 z-40 rounded-3xl md:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid h-[66px] grid-cols-5 items-center">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={`${itemClass} ${tone(pathname === "/")}`}>
            <Home className="h-[21px] w-[21px]" />
            Home
          </Link>
          <Link href="/shop" aria-current={isCat ? "page" : undefined} className={`${itemClass} ${tone(isCat)}`}>
            <LayoutGrid className="h-[21px] w-[21px]" />
            Categories
          </Link>
          <Link
            href="/#gift"
            aria-label="Gifting"
            className="-mt-8 flex h-[58px] w-[58px] items-center justify-center justify-self-center rounded-full border-4 border-background bg-secondary text-secondary-foreground shadow-[0_10px_20px_rgba(122,87,28,0.45)]"
          >
            <Gift className="h-6 w-6" />
          </Link>
          <Link href="/account/wishlist" aria-current={pathname.startsWith("/account/wishlist") ? "page" : undefined} className={`${itemClass} ${tone(pathname.startsWith("/account/wishlist"))}`}>
            <Heart className="h-[21px] w-[21px]" />
            Wishlist
          </Link>
          <Link href="/account" aria-current={pathname === "/account" ? "page" : undefined} className={`${itemClass} ${tone(pathname === "/account")}`}>
            <User className="h-[21px] w-[21px]" />
            Account
          </Link>
        </div>
      </nav>
    </>
  );
}
