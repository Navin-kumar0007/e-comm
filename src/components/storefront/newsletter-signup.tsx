"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to subscribe");
      } else {
        setIsSubscribed(true);
        toast.success("Welcome to the Spicy Nuts family! 🎉");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <section className="py-6 md:py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-10 dark:opacity-5" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl mx-auto glass rounded-3xl p-4 md:p-12 text-center animate-on-scroll">
          <h2 className="text-xl md:text-5xl font-bold mb-2 md:mb-4 text-foreground">Join the Spicy Nuts Family</h2>
          <p className="text-muted-foreground mb-3 md:mb-8 text-sm md:text-lg">
            Subscribe to our newsletter for exclusive offers, traditional recipes, and stories from the farm.
          </p>

          {isSubscribed ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>You\'re subscribed! Check your email for a welcome surprise.</span>
            </div>
          ) : (
            <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-full bg-background/80 border-border/50 text-base px-6 focus-visible:ring-brand-green"
                required
              />
              <Button type="submit" disabled={isLoading} className="h-12 rounded-full bg-brand-green hover:bg-brand-green/90 px-8">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            We respect your privacy. No spam, ever.
          </p>
        </div>
      </div>
    </section>
  );
}
