'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Printer, Truck, ShoppingBag, MapPin, Package, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstallAppCard } from '@/components/storefront/install-app-card';
import { GoldSeal } from '@/components/storefront/royal/gold-seal';
import { DeliveryJourney } from '@/components/storefront/royal/delivery-journey';

interface OrderData {
  orderNumber: string;
  orderId?: string;
  subtotal: number;
  discount?: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  ecoPackaging?: boolean;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    weight: string;
  }>;
}

const money = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('lastOrder');
    if (stored) {
      try {
        setOrder(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse lastOrder", e);
      }
    }
  }, []);

  if (!order) {
    return (
      <div className="jaali flex min-h-[75vh] flex-col items-center justify-center px-4 pb-24 pt-[calc(var(--header-h)+40px)] text-center text-white">
        <div className="lux-glass mb-5 grid h-16 w-16 place-items-center rounded-2xl text-brand-gold"><ShoppingBag className="h-8 w-8" /></div>
        <h1 className="mb-3 font-heading text-4xl font-bold">No recent order here</h1>
        <p className="mb-8 max-w-md text-white/80">This page shows your order right after you place it. To see an older order, track it with your order ID.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/track"><Button variant="outline" className="h-12 rounded-full border-brand-gold/60 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white">Track an order</Button></Link>
          <Link href="/shop"><Button variant="buy" className="h-12 rounded-full px-7">Shop the pantry</Button></Link>
        </div>
      </div>
    );
  }

  const cod = order.paymentMethod?.startsWith('Cash');
  const jars = order.items.reduce((a, i) => a + i.quantity, 0);
  const first = order.customerName?.split(' ')[0];

  return (
    <>
      {/* celebration band */}
      <section className="jaali relative overflow-hidden pb-24 pt-[calc(var(--header-h)+28px)] text-center text-white print:hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_30%,rgba(244,166,42,0.28),transparent_70%)]" />
        <div className="relative container mx-auto max-w-3xl px-4">
          <GoldSeal />
          <span className="eyebrow mt-6 block text-brand-gold">Order {order.orderNumber}</span>
          <h1 className="mt-2 font-heading text-[42px] font-bold leading-[0.95] sm:text-[58px]">{first ? `Thank you, ${first}.` : 'Thank you.'}<br /><span className="foil-text">Your jars are on their way.</span></h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-white/85">We have your order for {jars} {jars === 1 ? 'jar' : 'jars'}. It will be packed in Bidar and handed to the courier, usually within 1–2 working days. You will get tracking updates by SMS and email.</p>
        </div>
      </section>

      <div className="container relative mx-auto -mt-16 max-w-4xl px-4 pb-16 sm:px-6">
        {/* where it is now */}
        <div className="lux-card rise-in mb-6 p-5 sm:p-7 print:hidden">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold text-primary">Where your order is</h2>
            {order.orderId && <Link href={`/track/${order.orderId}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><Truck className="h-4 w-4" /> Live tracking</Link>}
          </div>
          <DeliveryJourney current={1} />
        </div>

        {/* receipt */}
        <div style={{ animationDelay: '0.12s' }} className="lux-card rise-in overflow-hidden print:border-none print:shadow-none">
          <div className="flex flex-col justify-between gap-4 border-b border-border/60 bg-gradient-to-r from-[#f6ecdc] to-[#fffdf8] p-6 sm:flex-row sm:items-center sm:p-7">
            <div className="flex items-center gap-3">
              <span className="medallion h-11 w-11"><Package className="h-5 w-5" /></span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="eyebrow text-brand-gold-deep">Receipt</span>
                  {order.paymentMethod && <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{order.paymentMethod}</span>}
                </div>
                <p className="mt-0.5 font-mono text-2xl font-bold tracking-wide text-foreground">{order.orderNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={() => window.print()} className="h-10 gap-1.5 rounded-xl text-xs font-bold"><Printer className="h-4 w-4" /> Print</Button>
              {order.orderId && <Link href={`/track/${order.orderId}`}><Button size="sm" className="h-10 gap-1.5 rounded-xl text-xs font-bold"><Truck className="h-4 w-4" /> Track</Button></Link>}
            </div>
          </div>

          <div className="space-y-7 p-6 sm:p-7">
            {(order.customerName || order.shippingAddress) && (
              <div className="grid grid-cols-1 gap-5 rounded-2xl border border-border/60 bg-muted/30 p-5 text-sm sm:grid-cols-2">
                <div>
                  <h3 className="eyebrow mb-1.5 text-brand-gold-deep">Deliver to</h3>
                  <p className="font-bold text-foreground">{order.customerName || 'You'}</p>
                  {order.customerPhone && <p className="mt-0.5 text-xs text-muted-foreground">{order.customerPhone}</p>}
                  {order.customerEmail && <p className="mt-0.5 text-xs text-muted-foreground">{order.customerEmail}</p>}
                </div>
                <div>
                  <h3 className="eyebrow mb-1.5 flex items-center gap-1 text-brand-gold-deep"><MapPin className="h-3.5 w-3.5" /> Address</h3>
                  <p className="text-xs font-medium leading-relaxed text-foreground">{order.shippingAddress}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-3 font-heading text-xl font-bold text-foreground">Your jars ({jars})</h3>
              <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 bg-white/50 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 font-heading text-lg font-bold text-primary">{item.quantity}</span>
                      <div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{item.name}</p><p className="text-xs text-muted-foreground">{item.weight} · {money(item.price)} each</p></div>
                    </div>
                    <span className="tnum shrink-0 text-sm font-bold text-foreground">{money(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="lux-dark w-full space-y-2.5 p-5 text-sm sm:w-80">
                <div className="flex justify-between text-white/75"><span>Subtotal</span><span className="tnum font-semibold text-white">{money(order.subtotal)}</span></div>
                {(order.discount ?? 0) > 0 && <div className="flex justify-between font-semibold text-brand-gold"><span>Discounts</span><span className="tnum">−{money(order.discount!)}</span></div>}
                <div className="flex justify-between text-white/75"><span>Delivery</span>{order.shipping === 0 ? <span className="font-bold text-brand-gold">Free</span> : <span className="tnum font-semibold text-white">{money(order.shipping)}</span>}</div>
                <div className="flex items-end justify-between border-t border-white/15 pt-3">
                  <span className="font-heading text-xl font-bold">{cod ? 'To pay on delivery' : 'Paid'}</span>
                  <span className="tnum foil-text font-heading text-3xl font-bold">{money(order.total)}</span>
                </div>
                <p className="text-right text-xs text-white/60">incl. GST {money(order.tax)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm print:hidden">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-muted-foreground"><span className="font-bold text-foreground">Questions about this order?</span> WhatsApp us at <span className="tnum select-all font-bold text-foreground">+91 85500 07073</span> with your order number.</p>
            </div>
          </div>
        </div>

        <InstallAppCard />

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row print:hidden">
          <Link href="/shop"><Button variant="buy" size="lg" className="h-12 w-full gap-2 rounded-full px-8 sm:w-auto">Keep shopping <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/"><Button size="lg" variant="outline" className="h-12 w-full rounded-full px-8 sm:w-auto">Back to home</Button></Link>
        </div>
      </div>
    </>
  );
}
