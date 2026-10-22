"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore, type CartItem } from "@/lib/store/cart-store";

export default function RestoreCart({ items, missing }: { items: CartItem[]; missing: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!items.length) return;
    useCartStore.setState({ items });
    // Let the customer read the note about missing items before moving on.
    const t = setTimeout(() => router.replace("/checkout"), missing ? 2500 : 0);
    return () => clearTimeout(t);
  }, [items, missing, router]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      {items.length ? (
        <>
          <p className="text-lg font-semibold">Restoring your cart…</p>
          {missing > 0 && (
            <p className="text-sm text-muted-foreground">
              {missing === 1 ? "One item is" : `${missing} items are`} out of stock right now and {missing === 1 ? "was" : "were"} left out.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-lg font-semibold">These items are out of stock right now</p>
          <p className="text-sm text-muted-foreground">Sorry! Have a look at what else is fresh today.</p>
          <Link href="/shop" className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Go to the shop
          </Link>
        </>
      )}
    </div>
  );
}
