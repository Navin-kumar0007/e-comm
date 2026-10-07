"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart-store";

type Size = { id: string; label: string; price: number; salePrice: number | null; stock: number };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function grams(label: string): number | null {
  const m = label.toLowerCase().replace(/\s+/g, "").match(/^(\d+(?:\.\d+)?)(g|gm|kg)$/);
  if (!m) return null;
  return m[2] === "kg" ? Number(m[1]) * 1000 : Number(m[1]);
}

/** Pouch outline whose size grows with the pack weight (design board size picker). */
function PouchIcon({ scale, filled }: { scale: number; filled: boolean }) {
  return (
    <svg width={20 * scale} height={26 * scale} viewBox="0 0 20 26" aria-hidden="true" fill={filled ? "var(--primary)" : "var(--background)"} stroke="var(--brand-gold)" strokeWidth="1.2">
      <path d="M3 2h14l1 22H2z" />
      <path d="M4 5h12" strokeWidth="1" />
    </svg>
  );
}

/** Price, pouch-size picker, quantity and add-to-cart for the product page (+ sticky bar on mobile). */
export function ProductPurchase({
  product,
  sizes,
}: {
  product: { id: string; name: string; slug: string; image: string; price: number; salePrice: number | null; stock: number; weight: string };
  sizes: Size[];
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const firstInStock = sizes.find((s) => s.stock > 0) ?? sizes[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(firstInStock?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = sizes.find((s) => s.id === selectedId);

  const price = Number(selected ? selected.salePrice ?? selected.price : product.salePrice ?? product.price);
  const regular = Number(selected ? selected.price : product.price);
  const stock = selected ? selected.stock : product.stock;
  const weight = selected ? selected.label : product.weight;
  const g = grams(weight);
  const per100 = g ? Math.round((price / g) * 100) : null;
  const options: Size[] = sizes.length > 0 ? sizes : [{ id: "default", label: product.weight, price: product.price, salePrice: product.salePrice, stock: product.stock }];

  const add = (goToCheckout = false) => {
    for (let i = 0; i < qty; i++) {
      addItem({ productId: product.id, name: product.name, slug: product.slug, price, image: product.image, weight, variantId: selected?.id });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    if (goToCheckout) router.push("/checkout");
    else toast.success(`${product.name} added to cart`, { description: `${qty} × ${weight} — ${inr(price * qty)}` });
  };

  const stepper = (
    <div className="flex h-12 items-center rounded-xl border border-border bg-card">
      <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="flex h-12 w-10 items-center justify-center"><Minus className="h-4 w-4" /></button>
      <span className="min-w-6 text-center font-extrabold">{qty}</span>
      <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="flex h-12 w-10 items-center justify-center"><Plus className="h-4 w-4" /></button>
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <span className="tnum text-[28px] font-extrabold">{inr(price)}</span>
        {price < regular && <span className="tnum text-base text-muted-foreground line-through">{inr(regular)}</span>}
        <span className="text-[13px] text-muted-foreground">{weight}{per100 ? ` · ${inr(per100)} / 100 g` : ""}</span>
      </div>
      <p className="-mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

      <div className="mt-4">
        <h2 className="mb-2 text-[13px] font-extrabold">Pack size</h2>
        <div role="radiogroup" aria-label="Pack size" className="grid grid-cols-3 gap-2.5">
          {options.map((s, i) => {
            const on = s.id === (selected?.id ?? "default");
            return (
              <button
                key={s.id}
                role="radio"
                aria-checked={on}
                onClick={() => setSelectedId(s.id === "default" ? undefined : s.id)}
                disabled={s.stock <= 0}
                className={`flex h-[104px] flex-col items-center justify-end gap-1 rounded-2xl border-2 pb-2.5 ${on ? "border-primary bg-muted" : "border-border bg-card"} ${s.stock <= 0 ? "opacity-50" : ""}`}
              >
                <PouchIcon scale={1 + i * 0.22} filled={on} />
                <span className="text-sm font-extrabold">{s.label}</span>
                <span className="text-[11.5px] font-bold text-muted-foreground">{inr(Number(s.salePrice ?? s.price))}</span>
              </button>
            );
          })}
        </div>
        {stock > 0 && stock <= 5 && <p className="mt-2 text-[13px] font-semibold text-warning">Only {stock} left — order soon</p>}
        {stock <= 0 && <p className="mt-2 text-[13px] font-semibold text-destructive">Out of stock{sizes.length > 1 ? " in this size" : ""}</p>}
      </div>

      {/* Desktop / tablet actions */}
      <div className="mt-4 hidden gap-2.5 md:flex">
        {stepper}
        <button onClick={() => add()} disabled={stock <= 0} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-primary-foreground disabled:opacity-60">
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {added ? "Added" : "Add to cart"}
        </button>
        <button onClick={() => add(true)} disabled={stock <= 0} className="h-12 flex-1 rounded-xl bg-secondary text-sm font-extrabold text-secondary-foreground disabled:opacity-60">
          Buy now
        </button>
      </div>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-2.5 border-t border-border bg-card px-3.5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_26px_rgba(74,15,29,0.12)] md:hidden">
        {stepper}
        <button onClick={() => add()} disabled={stock <= 0} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-brand-gold bg-primary text-sm font-extrabold text-primary-foreground disabled:opacity-60">
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {stock <= 0 ? "Out of stock" : added ? "Added" : `Add to cart · ${inr(price * qty)}`}
        </button>
      </div>
    </>
  );
}
