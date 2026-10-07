'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Minus, Plus, Truck, Lock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCartStore } from '@/lib/store/cart-store';
import { getCleanProductImage } from "@/lib/utils";

export const FREE_SHIPPING_AT = 999;
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const noopSubscribe = () => () => {};

/**
 * Cart sheet. `variant="pill"` is the gold "2 · ₹1,000" button from the desktop
 * header; `variant="icon"` is the bag icon for the mobile header and tab bar.
 */
export function CartDrawer({ variant = 'icon', tone = 'light' }: { variant?: 'icon' | 'pill'; tone?: 'light' | 'dark' }) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  // Zustand's persisted cart only exists after hydration
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const itemCount = mounted ? getItemCount() : 0;
  const total = mounted ? getTotal() : 0;
  const left = FREE_SHIPPING_AT - total;
  const pct = Math.min(100, Math.round((total / FREE_SHIPPING_AT) * 100));

  const trigger =
    variant === 'pill' ? (
      <button aria-label={`Cart, ${itemCount} items`} className="flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-[13px] font-extrabold text-secondary-foreground" />
    ) : (
      <button aria-label={`Cart, ${itemCount} items`} className={`relative flex h-11 w-11 items-center justify-center rounded-full ${tone === 'dark' ? 'text-white' : 'text-current'}`} />
    );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={trigger}>
        <ShoppingBag className="h-5 w-5" />
        {variant === 'pill' ? (
          <span className="tnum">{itemCount} · {inr(total)}</span>
        ) : (
          itemCount > 0 && (
            <span className="absolute right-0.5 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-extrabold text-secondary-foreground">
              {itemCount}
            </span>
          )
        )}
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full max-w-full flex-col gap-0 bg-background p-0 sm:w-[400px]">
        <div className="jaali px-5 pb-4 pt-5 text-white">
          <SheetTitle className="font-heading text-[26px] font-bold text-white">
            Your cart <span className="font-sans text-[13px] font-semibold text-white/75">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </SheetTitle>
          {mounted && items.length > 0 && (
            <div className="mt-3 rounded-2xl bg-royal-deep/60 p-3">
              <p className="flex items-center gap-2 text-[13px] font-bold">
                <Truck className="h-[18px] w-[18px] text-brand-gold" />
                {left > 0 ? `Add ${inr(left)} more for free shipping` : 'Free shipping unlocked on this order'}
              </p>
              <span className="mt-2 block h-1.5 rounded-full bg-white/20">
                <span className="block h-1.5 rounded-full bg-secondary" style={{ width: `${pct}%` }} />
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!mounted || items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="arch flex h-24 w-20 items-center justify-center border-2 border-brand-gold bg-muted">
                <ShoppingBag className="h-7 w-7 text-primary" />
              </span>
              <h3 className="font-heading text-2xl font-bold text-primary">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">Fill it with almonds, cashews, dates and more.</p>
              <button onClick={() => { setIsOpen(false); router.push('/shop'); }} className="h-11 rounded-xl bg-primary px-5 text-sm font-extrabold text-primary-foreground">
                Shop the pantry
              </button>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {items.map((item, i) => (
                <li key={`${item.productId}-${item.weight}`} className={`flex gap-3 p-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                  <Link href={item.productId.startsWith('custom-') ? '/blend-creator' : `/product/${item.slug}`} onClick={() => setIsOpen(false)} className="arch relative h-[68px] w-[56px] shrink-0 overflow-hidden border-[1.5px] border-brand-gold bg-muted">
                    <Image src={getCleanProductImage(item.image, item.name)} alt={item.name} fill className="object-cover" sizes="56px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-bold leading-tight">{item.name}</span>
                      <span className="tnum text-sm font-extrabold">{inr(item.price * item.quantity)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.weight} · {inr(item.price)} each</span>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex h-9 items-center rounded-xl border border-border">
                        <button aria-label={`Decrease ${item.name}`} onClick={() => updateQuantity(item.productId, item.weight, item.quantity - 1)} className="flex h-9 w-10 items-center justify-center">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-5 text-center text-sm font-extrabold">{item.quantity}</span>
                        <button aria-label={`Increase ${item.name}`} onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1)} className="flex h-9 w-10 items-center justify-center">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.productId, item.weight)} className="min-h-9 px-1 text-xs font-bold text-muted-foreground underline underline-offset-[3px]">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {mounted && items.length > 0 && (
          <div className="border-t border-border bg-card p-4 pb-6 shadow-[0_-10px_26px_rgba(74,15,29,0.12)]">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm font-bold text-muted-foreground">Item total</span>
              <span className="tnum text-lg font-extrabold">{inr(total)}</span>
            </div>
            <button
              onClick={() => { setIsOpen(false); router.push('/checkout'); }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-brand-gold bg-primary text-sm font-extrabold text-primary-foreground"
            >
              <Lock className="h-4 w-4 text-brand-gold" />
              Proceed to checkout ›
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Coupons and delivery are applied at checkout · prices include GST</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
