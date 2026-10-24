'use client';

import { useRef, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Minus, Plus, Truck, Lock } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/lib/store/cart-store';
import { useCartSheet } from '@/lib/store/ui-store';
import { getCleanProductImage } from "@/lib/utils";

export const FREE_SHIPPING_AT = 999;
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const noopSubscribe = () => () => {};
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/**
 * Cart button. `variant="pill"` is the "2 · ₹1,000" button in the desktop header;
 * `variant="icon"` is the bag icon in the phone header. Both open the one cart sheet.
 */
export function CartDrawer({ variant = 'icon', tone = 'light' }: { variant?: 'icon' | 'pill'; tone?: 'light' | 'dark' }) {
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  useCartStore((s) => s.items);
  const setOpen = useCartSheet((s) => s.setOpen);
  // Zustand's persisted cart only exists after hydration
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const itemCount = mounted ? getItemCount() : 0;
  const total = mounted ? getTotal() : 0;

  return variant === 'pill' ? (
    <button type="button" onClick={() => setOpen(true)} aria-label={`Cart, ${itemCount} items`} className="flex h-10 items-center gap-2 rounded-full border border-brand-gold/60 bg-white/10 px-4 text-[13px] font-extrabold text-white hover:bg-white/15">
      <ShoppingBag className="h-5 w-5 text-brand-gold" />
      <span className="tnum">{itemCount} · {inr(total)}</span>
    </button>
  ) : (
    <button type="button" onClick={() => setOpen(true)} aria-label={`Cart, ${itemCount} items`} className={`relative flex h-11 w-11 items-center justify-center rounded-full ${tone === 'dark' ? 'text-white' : 'text-current'}`}>
      <ShoppingBag className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-xs font-extrabold text-secondary-foreground">
          {itemCount}
        </span>
      )}
    </button>
  );
}

/** The cart itself: a bottom sheet on phones (drag the top down to close), a side panel on larger screens. */
export function CartSheet() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const router = useRouter();
  const isOpen = useCartSheet((s) => s.open);
  const setIsOpen = useCartSheet((s) => s.setOpen);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia('(min-width: 768px)').matches, () => true);

  const itemCount = mounted ? getItemCount() : 0;
  const total = mounted ? getTotal() : 0;
  const left = FREE_SHIPPING_AT - total;
  const pct = Math.min(100, Math.round((total / FREE_SHIPPING_AT) * 100));

  // Drag the sheet's top band down to close it, like a native bottom sheet.
  const drag = useRef<{ y: number; dy: number; el: HTMLElement | null } | null>(null);
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wide || (e.target as HTMLElement).closest('button,a')) return;
    drag.current = { y: e.clientY, dy: 0, el: e.currentTarget.closest('[data-slot="sheet-content"]') };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d?.el) return;
    d.dy = Math.max(0, e.clientY - d.y);
    d.el.style.transition = 'none';
    d.el.style.transform = `translateY(${d.dy}px)`;
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.el) return;
    d.el.style.transition = '';
    d.el.style.transform = '';
    if (d.dy > 90) setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side={wide ? 'right' : 'bottom'}
        className={wide ? 'flex w-full max-w-full flex-col gap-0 bg-background p-0 sm:w-[400px]' : 'flex max-h-[88dvh] flex-col gap-0 overflow-hidden rounded-t-[var(--radius-sheet)] border-0 bg-background p-0'}
      >
        <div className="jaali touch-none px-5 pb-4 pt-5 text-white md:touch-auto" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {!wide && <span className="sheet-handle -mt-3 mb-3 bg-white/40" aria-hidden="true" />}
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
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
          <div className="border-t border-border bg-card p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-float)]">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm font-bold text-muted-foreground">Item total</span>
              <span className="tnum text-lg font-extrabold">{inr(total)}</span>
            </div>
            <button
              onClick={() => { setIsOpen(false); router.push('/checkout'); }}
              className="flex h-12 w-full items-center justify-center gap-2 btn-buy rounded-xl text-sm font-extrabold"
            >
              <Lock className="h-4 w-4" />
              Proceed to checkout ›
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Coupons and delivery are applied at checkout · prices include GST</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
