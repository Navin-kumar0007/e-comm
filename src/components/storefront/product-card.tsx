'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { Minus, Plus } from 'lucide-react';
import { WishlistButton } from "./wishlist-button";
import { PackShot } from "./royal/pack-shot";
import { JarShot } from "./royal/jar-shot";
import { getProductLabel } from "@/lib/product-labels";
import { useCartStore } from '@/lib/store/cart-store';
import { getCleanProductImage } from "@/lib/utils";
import { toast } from 'sonner';

interface CardVariant {
  id: string;
  label: string;
  price: number;
  salePrice: number | null;
  stock: number;
}

export interface ProductCardProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  images: string[] | string;
  weight?: string | null;
  stock?: number;
  variants?: CardVariant[];
}

const noopSubscribe = () => () => {};
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** "250g" / "1 kg" -> grams, or null when the label isn't a plain weight. */
export function grams(label?: string | null): number | null {
  const m = label?.toLowerCase().replace(/\s+/g, '').match(/^(\d+(?:\.\d+)?)(g|gm|kg)$/);
  if (!m) return null;
  return m[2] === 'kg' ? Number(m[1]) * 1000 : Number(m[1]);
}

/** Royal shelf card: a 3D branded pack, name, price per 100 g and ADD / stepper. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProductCard({ product, className = '' }: { product: ProductCardProduct; className?: string; userDietaryTagIds?: string[] }) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  // The cart lives in localStorage, so only read it after hydration.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const sizes = (product.variants ?? []).slice(0, 3);
  const [sizeId, setSizeId] = useState(sizes[0]?.id);
  const size = sizes.find((v) => v.id === sizeId);

  const weight = size?.label ?? product.weight ?? '250g';
  const mrp = Number(size?.price ?? product.price);
  const sale = size ? size.salePrice : product.salePrice;
  const price = sale && Number(sale) < mrp ? Number(sale) : mrp;
  const stock = size?.stock ?? product.stock;
  const soldOut = stock !== undefined && stock <= 0;
  const g = grams(weight);
  const per100 = g ? Math.round((price / g) * 100) : null;
  const discount = price < mrp ? Math.round(((mrp - price) / mrp) * 100) : null;

  const imageUrl = getCleanProductImage(product.images, product.name);
  const label = getProductLabel(product.slug);
  const line = mounted ? items.find((i) => i.productId === product.id && i.weight === weight) : undefined;

  const add = () => {
    addItem({ productId: product.id, name: product.name, price, slug: product.slug, image: imageUrl, weight, variantId: size?.id });
    toast.success(`${product.name} (${weight}) added to cart`);
  };

  return (
    <article className={`flex h-full flex-col gap-1.5 rounded-[20px] border border-border bg-card px-2.5 pb-2.5 pt-3 md:rounded-[22px] md:gap-2 md:p-3.5 ${className}`}>
      <div className="relative">
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="relative flex h-[138px] items-center justify-center rounded-2xl md:h-[180px] md:bg-muted"
        >
          {label ? (
            <>
              <span className="hidden md:block"><JarShot label={label} name={product.name} weight={weight} width={124} /></span>
              <span className="md:hidden"><JarShot label={label} name={product.name} weight={weight} width={96} /></span>
            </>
          ) : (
            <>
              <span className="hidden md:block"><PackShot image={imageUrl} name={product.name} weight={weight} size="md" rotate={-26} /></span>
              <span className="md:hidden"><PackShot image={imageUrl} name={product.name} weight={weight} size="sm" /></span>
            </>
          )}
          <span className="absolute bottom-1 left-1/2 h-2.5 w-[90px] -translate-x-1/2 rounded-[50%] bg-royal-deep/30 blur-[5px] md:bottom-3 md:w-[120px]" />
        </Link>
        <div className="absolute right-0 top-0 z-10 scale-90 md:right-1 md:top-1">
          <WishlistButton productId={product.id} />
        </div>
        {discount && (
          <span className="absolute left-0 top-0 z-10 rounded-full bg-success px-2 py-0.5 text-[10.5px] font-extrabold text-white md:left-1.5 md:top-1.5">
            {discount}% off
          </span>
        )}
      </div>

      <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-[2.5em] text-[13px] font-bold leading-[1.25] text-foreground hover:text-primary md:text-[15px]">
        {product.name}
      </Link>

      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="tnum text-base font-extrabold md:text-lg">{inr(price)}</span>
        {discount && <span className="tnum text-[11px] text-muted-foreground line-through">{inr(mrp)}</span>}
        <span className="tnum text-[11px] text-muted-foreground md:text-xs">{per100 ? `${inr(per100)}/100 g` : weight}</span>
      </div>

      {sizes.length > 1 && (
        <div role="radiogroup" aria-label="Pack size" className="grid overflow-hidden rounded-lg border border-border" style={{ gridTemplateColumns: `repeat(${sizes.length}, minmax(0, 1fr))` }}>
          {sizes.map((v) => (
            <button
              key={v.id}
              role="radio"
              aria-checked={v.id === sizeId}
              onClick={() => setSizeId(v.id)}
              className={`h-9 text-[11px] font-extrabold transition-colors ${v.id === sizeId ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto">
        {soldOut ? (
          <span className="flex h-10 items-center justify-center rounded-xl bg-muted text-[13px] font-bold text-muted-foreground md:h-11">Sold out</span>
        ) : line ? (
          <div className="flex h-10 items-center justify-between rounded-xl bg-primary text-primary-foreground md:h-11">
            <button aria-label={`Remove one ${product.name}`} onClick={() => updateQuantity(product.id, weight, line.quantity - 1)} className="flex h-10 w-10 items-center justify-center md:h-11 md:w-11">
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-[13px] font-extrabold">{line.quantity}<span className="hidden md:inline"> in cart</span></span>
            <button aria-label={`Add one ${product.name}`} onClick={() => updateQuantity(product.id, weight, line.quantity + 1)} className="flex h-10 w-10 items-center justify-center md:h-11 md:w-11">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={add}
            aria-label={`Add ${product.name} to cart`}
            className="h-10 w-full rounded-xl bg-primary text-[13px] font-extrabold tracking-[0.06em] text-primary-foreground transition-transform active:scale-[0.98] md:h-11 md:text-sm md:tracking-normal"
          >
            <span className="md:hidden">ADD</span>
            <span className="hidden md:inline">Add to cart</span>
          </button>
        )}
      </div>
    </article>
  );
}
