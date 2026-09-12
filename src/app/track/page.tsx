"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 pt-28 md:pt-36">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold">Track Your Order</h1>
          <p className="text-muted-foreground mt-2">
            Enter your order ID and email address to see the latest status.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium mb-1.5">
              Order ID
            </label>
            <input
              id="orderId"
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. NW-A1B2C3D4 or full order ID"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="The email used during checkout"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                Track Order
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your Order ID was sent to your email when you placed the order.
          <br />
          Check your inbox for &quot;Order Confirmed&quot; from Spicy Nuts.
        </p>
      </div>
    </div>
  );
}
