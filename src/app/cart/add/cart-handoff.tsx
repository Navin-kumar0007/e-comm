"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";

export type HandoffLine = { productId: string; name: string; slug: string; price: number; image: string; weight: string; qty: number; inStock: boolean };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Puts the landing page's jars in the cart once, shows them for a moment, then opens checkout. */
export function CartHandoff({ lines }: { lines: HandoffLine[] }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const done = useRef(false);
  const [ready, setReady] = useState(false);
  const ok = lines.filter((l) => l.inStock), skipped = lines.filter((l) => !l.inStock);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    ok.forEach((l) => { for (let i = 0; i < l.qty; i++) addItem({ productId: l.productId, name: l.name, slug: l.slug, price: l.price, image: l.image, weight: l.weight }); });
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // everything was in stock: carry on to checkout after a moment (if something was left out, the shopper decides)
  useEffect(() => {
    if (!ready || !ok.length || skipped.length) return;
    const t = setTimeout(() => router.replace("/checkout"), 1400);
    return () => clearTimeout(t);
  }, [ready, ok.length, skipped.length, router]);

  const jars = ok.reduce((a, l) => a + l.qty, 0);
  return (
    <div className="jaali flex min-h-[80vh] items-center justify-center px-4 pb-16 pt-[calc(var(--header-h)+32px)]">
      <div className="lux-dark w-full max-w-md space-y-5 p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="medallion h-11 w-11"><ShoppingBag className="h-5 w-5" /></span>
          <div>
            <span className="eyebrow text-brand-gold">Your basket</span>
            <h1 className="font-heading text-[30px] font-bold leading-none">{ok.length ? (ready ? `${jars} ${jars === 1 ? "jar" : "jars"} added to your cart` : "Adding your jars…") : "Nothing to add"}</h1>
          </div>
        </div>
        {ok.length > 0 && (
          <ul className="space-y-2">
            {ok.map((l) => (
              <li key={l.slug} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-white/10">
                <Image src={l.image} alt={l.name} width={96} height={96} className="h-12 w-12 rounded-xl object-cover ring-1 ring-brand-gold/60" />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{l.name}</span><span className="text-xs text-white/65">{l.weight} · {l.qty} × {inr(l.price)}</span></span>
                <span className="tnum text-sm font-bold">{inr(l.qty * l.price)}</span>
              </li>
            ))}
          </ul>
        )}
        {skipped.length > 0 && <p className="rounded-xl bg-white/[0.06] p-3 text-sm text-white/80">{skipped.map((l) => l.name).join(", ")} {skipped.length === 1 ? "is" : "are"} out of stock right now, so {skipped.length === 1 ? "it was" : "they were"} left out.</p>}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          {ok.length > 0 && <Link href="/checkout" className="btn-buy shine flex h-12 items-center sm:flex-1 justify-center rounded-2xl font-extrabold">Go to checkout</Link>}
          <Link href="/shop" className="flex h-12 items-center justify-center rounded-2xl border border-brand-gold/60 sm:flex-1 font-bold text-brand-gold hover:bg-white/10 hover:text-white">Add more from the shop</Link>
        </div>
      </div>
    </div>
  );
}
