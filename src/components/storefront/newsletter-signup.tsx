"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Gift, Sparkles, Mail } from "lucide-react";
import { toast } from "sonner";
import { subscribeWhatsAppAction } from "@/app/actions/whatsapp-actions";

export function NewsletterSignup() {
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (channel === "whatsapp") {
        if (!phone || phone.replace(/\D/g, "").length < 10) {
          toast.error("Please enter a valid 10-digit mobile number.");
          setIsLoading(false);
          return;
        }
        const res = await subscribeWhatsAppAction(phone, name, {
          offers: true,
          releases: true,
          priceDrops: true,
        });
        if (res.error) {
          toast.error(res.error);
        } else {
          setIsSubscribed(true);
          setCouponCode("ROYAL10");
          toast.success("Welcome to Spicy Nuts VIP! Check your WhatsApp for your 10% coupon code.");
        }
      } else {
        if (!email.trim()) {
          setIsLoading(false);
          return;
        }
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
          setCouponCode("ROYAL10");
          toast.success("Welcome to the Spicy Nuts family! 🎉");
        }
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-8 md:py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508061253366-f7da158b6d46?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-10 dark:opacity-5" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl mx-auto glass rounded-3xl p-6 md:p-12 text-center animate-on-scroll border border-border/60 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Gift className="w-3.5 h-3.5" />
            <span>Instant 10% OFF Welcome Gift</span>
          </div>

          <h2 className="text-2xl md:text-5xl font-heading font-bold mb-2 md:mb-4 text-foreground tracking-tight">
            Join the Spicy Nuts VIP Circle
          </h2>
          <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-lg max-w-xl mx-auto">
            Get instant secret deals, harvest release notifications, and price drop updates delivered right to your fingertips.
          </p>

          {isSubscribed ? (
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-xl text-foreground">
                You are Subscribed! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-emerald-900 font-medium">
                Use code <span className="font-mono font-bold text-emerald-700 text-base">{couponCode}</span> at checkout for 10% OFF.
              </p>
              <p className="text-xs text-muted-foreground">
                {channel === "whatsapp"
                  ? "We also sent a confirmation ping with your coupon directly to your WhatsApp."
                  : "We sent your welcome coupon to your email inbox."}
              </p>
            </div>
          ) : (
            <div className="max-w-lg mx-auto space-y-4">
              {/* Channel Selector */}
              <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/50 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setChannel("whatsapp")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                    channel === "whatsapp"
                      ? "bg-emerald-600 text-white shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>WhatsApp VIP (Fastest)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                    channel === "email"
                      ? "bg-brand-green text-white shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Newsletter</span>
                </button>
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                {channel === "whatsapp" ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center rounded-full border border-border/60 bg-background/90 overflow-hidden flex-1 focus-within:ring-2 focus-within:ring-emerald-500 shadow-sm">
                      <span className="px-3.5 py-3 text-xs font-semibold bg-muted text-muted-foreground border-r border-border">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="Enter 10-digit WhatsApp number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 px-4 py-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
                        maxLength={15}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-7 font-medium text-sm shadow-md"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1.5" />
                          Get 10% OFF
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-full bg-background/90 border-border/60 text-sm px-6 focus-visible:ring-brand-green flex-1"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-12 rounded-full bg-brand-green hover:bg-brand-green/90 px-7 font-medium text-sm shadow-md"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            🔒 We respect your privacy. No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
