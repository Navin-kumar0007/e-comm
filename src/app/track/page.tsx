"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Truck, MessageCircle } from "lucide-react";
import { DeliveryJourney } from "@/components/storefront/royal/delivery-journey";

export default function TrackOrderLookup() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!orderId.trim()) {
      setError("Please enter your order ID");
      return;
    }

    setLoading(true);
    try {
      // Try to fetch the order - the tracking page handles the display
      const res = await fetch(`/api/track?orderId=${encodeURIComponent(orderId.trim())}&email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.orderId) {
        router.push(`/track/${data.orderId}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="jaali relative flex min-h-[86vh] items-center overflow-hidden px-4 pb-16 pt-[calc(var(--header-h)+32px)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_20%_30%,rgba(244,166,42,0.18),transparent_70%),radial-gradient(40%_50%_at_90%_80%,rgba(201,164,90,0.16),transparent_70%)]" />
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <div className="text-white">
          <span className="lux-glass mb-5 grid h-14 w-14 place-items-center rounded-2xl text-brand-gold"><Truck className="h-7 w-7" /></span>
          <span className="eyebrow block text-brand-gold">From Bidar to your door</span>
          <h1 className="mt-2 font-heading text-[44px] font-bold leading-[0.95] md:text-[60px]">Where are<br /><span className="foil-text">my jars?</span></h1>
          <p className="mt-4 max-w-md text-white/80">Enter the order ID from your confirmation email and the email you ordered with. You will see each step, from packing in Bidar to your doorstep.</p>
          <div className="lux-glass mt-7 hidden rounded-3xl p-5 md:block" aria-hidden="true">
            <DeliveryJourney current={2} tone="dark" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="lux-card space-y-5 p-6 sm:p-8">
          <div>
            <h2 className="font-heading text-[30px] font-bold leading-none text-primary">Track your order</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Both details are in your &ldquo;Order confirmed&rdquo; email from Spicy Nuts.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="orderId" className="block text-xs font-bold">Order ID</label>
            <input id="orderId" type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="SN-A1B2C3D4 or the full order ID" autoComplete="off"
              className="lux-input w-full border px-4 font-mono text-sm uppercase tracking-wide outline-none" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-bold">Email address</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="The email used at checkout" autoComplete="email"
              className="lux-input w-full border px-4 text-sm outline-none" />
          </div>
          {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">{error}</p>}
          <button type="submit" disabled={loading} className="flex h-13 min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-extrabold text-primary-foreground shadow-[0_14px_30px_-14px_rgba(110,26,44,0.8)] transition-all hover:bg-primary/90 disabled:opacity-60">
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><Search className="h-4 w-4" /> Find my order <ArrowRight className="h-4 w-4" /></>}
          </button>
          <p className="flex items-start gap-2 text-xs text-muted-foreground"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Can&apos;t find your order ID? WhatsApp us at <span className="tnum select-all font-bold text-foreground">+91 85500 07073</span>.</p>
        </form>
      </div>
    </div>
  );
}
