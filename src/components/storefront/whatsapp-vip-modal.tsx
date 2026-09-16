"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, Loader2, Gift, Bell, Tag } from "lucide-react";
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
import { subscribeWhatsAppAction } from "@/app/actions/whatsapp-actions";

interface WhatsAppVIPModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WhatsAppVIPModal({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: WhatsAppVIPModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [offers, setOffers] = useState(true);
  const [releases, setReleases] = useState(true);
  const [priceDrops, setPriceDrops] = useState(true);
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
      const res = await subscribeWhatsAppAction(phone, name, {
        offers,
        releases,
        priceDrops,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        setSuccess(true);
        toast.success("Welcome to Spicy Nuts VIP! Check your WhatsApp for your 10% coupon code.");
      }
    } catch {
      toast.error("Failed to join VIP club. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setPhone("");
    setName("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleReset();
      }}
    >
      {trigger && <DialogTrigger render={trigger as any} />}

      <DialogContent className="sm:max-w-md p-6 rounded-2xl border border-border shadow-2xl bg-card">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              VIP WhatsApp Circle
            </span>
          </div>
          <DialogTitle className="text-2xl font-heading font-bold text-foreground">
            Get 10% OFF on WhatsApp
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Join the inner circle for secret harvest deals, new product launches, and instant price drop alerts directly on your WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-heading font-bold text-xl text-foreground">
              You are on the VIP List! 🎉
            </h4>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center w-full">
              <p className="text-xs text-emerald-800 font-medium mb-1">Your 10% Welcome Coupon:</p>
              <span className="text-xl font-mono font-extrabold text-emerald-700 tracking-wider">
                ROYAL10
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              We also sent this coupon and a warm welcome note straight to your WhatsApp.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => setOpen(false)}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="vip-name" className="text-xs font-semibold text-foreground">
                Your Name
              </Label>
              <Input
                id="vip-name"
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vip-phone" className="text-xs font-semibold text-foreground">
                WhatsApp Phone Number <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <span className="px-3 py-2 text-xs font-semibold bg-muted text-muted-foreground border-r border-border">
                  🇮🇳 +91
                </span>
                <input
                  id="vip-phone"
                  type="tel"
                  required
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="pt-2 pb-1 space-y-2 border-t border-border/60">
              <p className="text-xs font-semibold text-foreground">Choose what you wish to receive:</p>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={offers}
                    onChange={(e) => setOffers(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exclusive festive discounts & secret flash sales</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={releases}
                    onChange={(e) => setReleases(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fresh seasonal harvest arrivals & new products</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={priceDrops}
                    onChange={(e) => setPriceDrops(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <Bell className="w-3.5 h-3.5 text-blue-500" />
                  <span>Price drop & inventory clearance alerts</span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-all text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining VIP Club...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Unlock 10% OFF on WhatsApp
                </>
              )}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Zero spam. You can reply STOP at any time to unsubscribe.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
