"use client";

import React, { useState } from "react";
import { BellRing, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { subscribePriceAlertAction } from "@/app/actions/whatsapp-actions";

interface WhatsAppPriceAlertModalProps {
  productId: string;
  productName: string;
  currentPrice: number | string;
}

export function WhatsAppPriceAlertModal({
  productId,
  productName,
  currentPrice,
}: WhatsAppPriceAlertModalProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await subscribePriceAlertAction(productId, phone, email);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSuccess(true);
        toast.success("Price drop alert activated on WhatsApp!");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setPhone("");
    setEmail("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleReset();
      }}
    >
      <DialogTrigger className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <BellRing className="w-3.5 h-3.5" />
        <span>Price Drop Alert on WhatsApp</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-6 rounded-2xl border border-border shadow-2xl bg-card">
        <DialogHeader className="text-left space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <DialogTitle className="text-xl font-heading font-bold text-foreground">
            Price Drop Alert on WhatsApp
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            We will ping your WhatsApp directly as soon as the price of{" "}
            <span className="font-semibold text-foreground">{productName}</span>{" "}
            (currently ₹{currentPrice}) drops.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-heading font-bold text-lg text-foreground">
              WhatsApp Alert Activated!
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
              We have sent a verification note to your WhatsApp. Sit back — we will message you the second this product goes on discount.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone" className="text-xs font-semibold text-foreground">
                WhatsApp Phone Number <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <span className="px-3 py-2 text-xs font-semibold bg-muted text-muted-foreground border-r border-border">
                  🇮🇳 +91
                </span>
                <input
                  id="wa-phone"
                  type="tel"
                  required
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
                  maxLength={15}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Zero spam. You will only receive an automated notification when the price drops.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wa-email" className="text-xs font-semibold text-muted-foreground">
                Email (Optional backup)
              </Label>
              <Input
                id="wa-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Notify Me on WhatsApp
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
