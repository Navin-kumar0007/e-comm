'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Leaf, CheckCircle2, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SubscribePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async (boxType: string, price: number) => {
    if (!session) {
      toast.error("Please login to subscribe!");
      router.push('/login');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxType, price }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(`Successfully subscribed to ${boxType}! 🎉`);
      toast.success(`Bonus: Earned 100 Spice Points!`);
      router.push('/account/subscriptions');
    } catch (error: any) {
      toast.error(error.message || "Failed to subscribe");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-6xl py-12 md:py-16 px-4 min-h-[60vh] pt-28 md:pt-36">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
          <Leaf className="w-4 h-4" /> Organic & Homemade
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">Taste of Spicy Nuts Box</h1>
        <p className="text-lg text-muted-foreground">
          Discover a curated selection of our finest Royal Dry Fruits (Mamra Almonds, Goan Cashews), freshly roasted organic snacks, and artisanal Chai masalas delivered to your door every month.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Standard Box */}
        <div className="relative bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary/50">
          <div className="mb-6">
            <h3 className="text-2xl font-bold font-heading mb-2">Standard Box</h3>
            <p className="text-muted-foreground text-sm">Perfect for individuals or couples wanting to spice up their meals.</p>
          </div>
          <div className="mb-6 flex items-baseline gap-2">
            <span className="text-4xl font-bold">₹999</span>
            <span className="text-muted-foreground">/ month</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>1 Premium Jar of Royal Dry Fruits (Mamra Almonds / Cashews)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>1 Large pack of Organic Snacks (Makhana/Khakhra)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>1 Signature Spice Blend sample</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>Free Shipping</span>
            </li>
          </ul>

          <Button 
            className="w-full h-12 text-md rounded-xl"
            disabled={isProcessing}
            onClick={() => handleSubscribe("Standard Box", 999)}
          >
            <Package className="w-4 h-4 mr-2" /> Subscribe Standard
          </Button>
        </div>

        {/* Family Box */}
        <div className="relative bg-primary/5 rounded-3xl p-8 border-2 border-primary shadow-lg flex flex-col overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> BEST VALUE
          </div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold font-heading mb-2 text-primary">Family Box</h3>
            <p className="text-muted-foreground text-sm">Our most popular choice. Abundant flavors for the whole family.</p>
          </div>
          <div className="mb-6 flex items-baseline gap-2">
            <span className="text-4xl font-bold">₹1999</span>
            <span className="text-muted-foreground">/ month</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium">2 Premium Jars of Royal Dry Fruits (Almonds & Cashews)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium">3 Large packs of Organic Snacks</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium">2 Signature Spice Blends</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium text-amber-600">Exclusive early-access items</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>Free Premium Shipping</span>
            </li>
          </ul>

          <Button 
            className="w-full h-12 text-md rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            disabled={isProcessing}
            onClick={() => handleSubscribe("Family Box", 1999)}
          >
            <Package className="w-4 h-4 mr-2" /> Subscribe Family
          </Button>
        </div>
      </div>
    </div>
  );
}
