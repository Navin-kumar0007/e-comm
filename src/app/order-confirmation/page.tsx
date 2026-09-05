'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Package, ArrowRight, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface OrderData {
  orderNumber: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  ecoPackaging: boolean;
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
      setOrder(JSON.parse(stored));
    }
  }, []);

  if (!order) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-heading font-bold mb-4">No recent order found</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't placed an order recently.</p>
        <Link href="/shop">
          <Button className="rounded-full">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Confetti / Celebration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center mb-12"
      >
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
          <CheckCircle2 className="w-14 h-14 text-green-600" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -10 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <PartyPopper className="w-8 h-8 text-amber-500" />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground mb-2"
        >
          Order Confirmed!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground"
        >
          Thank you for choosing organic. Your order is on its way!
        </motion.p>
      </motion.div>

      {/* Order Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-card border border-border/50 overflow-hidden"
      >
        {/* Order Number Banner */}
        <div className="bg-primary/10 dark:bg-primary/5 p-6 text-center border-b border-border/50">
          <p className="text-sm text-muted-foreground mb-1">Order Number</p>
          <p className="text-2xl font-heading font-bold text-primary tracking-wider">{order.orderNumber}</p>
        </div>

        {/* Items Summary */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Items Ordered
          </h3>
          <ul className="space-y-3">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.name} ({item.weight}) × {item.quantity}
                </span>
                <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="h-px bg-border/50" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className={order.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                {order.shipping === 0 ? 'FREE' : `₹${order.shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (5% GST)</span>
              <span>₹{order.tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Paid</span>
              <span className="text-primary">₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          {order.ecoPackaging && (
            <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              🌿 Eco-friendly packaging selected — saving ~200g of carbon!
            </div>
          )}
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-4 mt-10 justify-center"
      >
        <Link href="/shop">
          <Button size="lg" className="rounded-full gap-2 shadow-lg hover:shadow-primary/25 transition-all">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/">
          <Button size="lg" variant="outline" className="rounded-full gap-2">
            Back to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
