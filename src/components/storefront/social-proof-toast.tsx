"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const NOTIFICATIONS = [
  "Someone in Mumbai just ordered 1kg Royal Afghan Mamra Almonds",
  "Sneha from Delhi reserved 500g Kashmiri Snow-White Walnuts",
  "Priya from Bangalore just ordered 5g Grade A1 Mogra Saffron",
  "Fresh batch of Goan Jumbo Cashews W180 just shipped to Hyderabad",
  "Rajesh from Pune just ordered Tandoori Chai & Malabar Spices",
  "Sunita from Kolkata just ordered Royal Festive Dry Fruit Casket",
];

export function SocialProofToast() {
  useEffect(() => {
    // Start interval to show random toasts
    const interval = setInterval(() => {
      // 35% chance to show a toast every 18 seconds
      if (Math.random() > 0.35) {
        const randomMsg = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
        toast(randomMsg, {
          icon: <Sparkles className="h-4 w-4 text-amber-500" />,
          duration: 4000,
          position: "top-right",
        });
      }
    }, 18000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
