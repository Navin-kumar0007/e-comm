"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, CheckCircle2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeWhatsAppAction } from "@/app/actions/whatsapp-actions";

export function WhatsAppWelcomePrompt() {
  const [visible, setVisible] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Only display if user has not interacted or closed before
    const seen = localStorage.getItem("sn_wa_welcome_seen");
    if (seen) return;

    // Show after 3.5 seconds of browsing
    const timer = setTimeout(() => {
      setVisible(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("sn_wa_welcome_seen", "dismissed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      toast.error("Please enter a valid 10-digit WhatsApp number.");
      return;
    }

    setLoading(true);
    try {
      const res = await subscribeWhatsAppAction(phone, undefined, {
        offers: true,
        releases: true,
        priceDrops: true,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        setSuccess(true);
        localStorage.setItem("sn_wa_welcome_seen", "subscribed");
        toast.success("Welcome! Your 10% coupon has been sent to WhatsApp.");
        setTimeout(() => {
          setVisible(false);
        }, 3500);
      }
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative p-4 sm:p-5 rounded-2xl bg-card/95 backdrop-blur-md border border-emerald-500/30 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground flex items-center justify-center transition-colors"
          aria-label="Close welcome prompt"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {success ? (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-foreground">
                Coupon Sent to WhatsApp! 🎉
              </h4>
              <p className="text-xs text-muted-foreground">
                Use code <span className="font-mono font-bold text-emerald-600">ROYAL10</span> for 10% OFF. Check your WhatsApp for details!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-heading font-bold text-sm text-foreground">
                    Get 10% OFF on WhatsApp
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                    VIP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive secret harvest deals & your instant welcome code.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex items-center rounded-xl border border-input bg-background/80 overflow-hidden flex-1 focus-within:ring-2 focus-within:ring-emerald-500">
                <span className="px-2.5 py-1.5 text-xs font-semibold bg-muted text-muted-foreground border-r border-border">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-transparent outline-none placeholder:text-muted-foreground/60"
                  maxLength={15}
                />
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Gift className="w-3.5 h-3.5 mr-1" />
                    Get Code
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
