'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  PartyPopper, 
  Printer, 
  Truck, 
  Clock, 
  ShoppingBag,
  MapPin,
  Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface OrderData {
  orderNumber: string;
  orderId?: string;
  subtotal: number;
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
      <div className="container mx-auto max-w-3xl px-4 py-32 text-center min-h-[65vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-heading font-bold mb-3 text-foreground">No Recent Order Found</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          You haven't placed an order recently in this session, or your session has expired.
        </p>
        <Link href="/shop">
          <Button className="rounded-full px-8 shadow-md">Explore Gourmet Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Celebration Header (Hidden on Print) */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="text-center mb-10 print:hidden"
      >
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 mb-5">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -10 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <PartyPopper className="w-7 h-7 text-brand-gold" />
          </motion.div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-2">
          Order Successfully Placed!
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto">
          Thank you for choosing <span className="font-semibold text-foreground">Nutty World</span>. Your single-estate harvest is being freshly packed and prepared for dispatch.
        </p>
      </motion.div>

      {/* Main Order Receipt Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl bg-card border border-border/60 overflow-hidden shadow-lg print:border-none print:shadow-none"
      >
        {/* Banner Header with Order Number */}
        <div className="bg-primary/5 dark:bg-primary/10 p-6 sm:p-8 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Order Receipt</span>
                {order.paymentMethod && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {order.paymentMethod}
                  </span>
                )}
              </div>
              <p className="text-2xl font-mono font-bold text-foreground tracking-wide mt-0.5">{order.orderNumber}</p>
            </div>
          </div>

          <div className="print:hidden flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.print()} 
              className="rounded-xl gap-1.5 text-xs font-semibold h-9"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </Button>
            {order.orderId && (
              <Link href="/account/orders">
                <Button size="sm" className="rounded-xl gap-1.5 text-xs font-semibold h-9 shadow-sm">
                  <Truck className="w-4 h-4" /> Track Status
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Dispatch & Customer Info */}
          {(order.customerName || order.shippingAddress) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-muted/20 border border-border/40 text-sm">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Recipient Details</h4>
                <p className="font-semibold text-foreground">{order.customerName || "Valued Customer"}</p>
                {order.customerEmail && <p className="text-muted-foreground text-xs mt-0.5">{order.customerEmail}</p>}
                {order.customerPhone && <p className="text-muted-foreground text-xs mt-0.5">{order.customerPhone}</p>}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Delivery Destination
                </h4>
                <p className="text-foreground text-xs leading-relaxed font-medium">{order.shippingAddress}</p>
              </div>
            </div>
          )}

          {/* Items Summary Table */}
          <div>
            <h3 className="font-heading font-bold text-base text-foreground mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Ordered Items ({order.items.length})
            </h3>
            <div className="border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/40">
              {order.items.map((item, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Net Weight: <span className="font-medium text-foreground">{item.weight}</span> • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-sm text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <p className="text-[11px] text-muted-foreground">₹{item.price.toFixed(2)} / unit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 space-y-2.5 text-sm p-5 rounded-2xl bg-muted/20 border border-border/40">
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Items Subtotal</span>
                <span className="font-medium text-foreground">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Courier Shipping</span>
                <span className="text-emerald-600 font-semibold">{order.shipping === 0 ? "FREE" : `₹${order.shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Estimated GST (5%)</span>
                <span className="font-medium text-foreground">₹{order.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-border/60 pt-2.5 flex justify-between font-bold text-base text-foreground">
                <span>Total Settled</span>
                <span className="text-primary text-lg">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Timeline Indicator */}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/15 flex items-center gap-4 text-xs">
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Expected Courier Handover: Within 24-48 Hours</p>
              <p className="text-muted-foreground mt-0.5">
                SMS tracking updates from BlueDart / Delhivery will be dispatched to your registered phone number.
              </p>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Action Navigation Buttons (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center print:hidden">
        <Link href="/shop">
          <Button size="lg" className="rounded-full gap-2 px-8 shadow-lg hover:shadow-primary/25 transition-all">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/">
          <Button size="lg" variant="outline" className="rounded-full px-8">
            Back to Home
          </Button>
        </Link>
      </div>

    </div>
  );
}
