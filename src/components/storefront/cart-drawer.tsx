'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCartStore } from '@/lib/store/cart-store';

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Hydration guard — Zustand persisted state loads async
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const itemCount = mounted ? getItemCount() : 0;
  const total = mounted ? getTotal() : 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full" />
      }>
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-background"
          >
            {itemCount}
          </Badge>
        )}
        <span className="sr-only">Shopping Cart</span>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[420px] max-w-full flex flex-col p-0 bg-[#FAF8F4] dark:bg-zinc-950">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/50">
          <h2 className="text-xl font-heading font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Cart
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </h2>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground">
                  Discover our organic products and add some items!
                </p>
              </div>
              <Button variant="outline" className="rounded-full" onClick={() => { setIsOpen(false); router.push('/shop'); }}>
                  Continue Shopping
                </Button>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.weight}`}
                  className="flex gap-4 p-3 rounded-xl bg-muted/30 border border-border/30"
                >
                  {/* Image */}
                  <Link href={`/product/${item.slug}`} onClick={() => setIsOpen(false)} className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.slug}`} onClick={() => setIsOpen(false)}>
                      <h4 className="font-semibold text-sm truncate hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.weight}</p>
                    <p className="font-bold text-primary mt-1">₹{item.price * item.quantity}</p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.weight, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId, item.weight)}
                        className="ml-auto w-7 h-7 rounded-full flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {mounted && items.length > 0 && (
          <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-border/50 space-y-3 sm:space-y-4 bg-background/95 backdrop-blur-md safe-area-bottom pb-8 sm:pb-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">Subtotal</span>
              <span className="text-xl font-black text-foreground tnum">₹{total.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Free royal shipping &amp; insured packaging on all orders over ₹999.
            </p>
            <Button 
              onClick={() => { setIsOpen(false); router.push('/checkout'); }} 
              className="w-full h-12 rounded-2xl text-sm font-bold bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white shadow-lg transition-all"
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
