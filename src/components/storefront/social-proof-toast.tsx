"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

const NOTIFICATIONS = [
  "Someone in Mumbai just bought Mango Pickle",
  "Sneha from Delhi ordered Cold-Pressed Oil",
  "Fresh batch of Ghee just sold out!",
  "Raj in Bangalore just bought Guntur Chilli Powder",
];

export function SocialProofToast() {
  useEffect(() => {
    // Start interval to show random toasts
    const interval = setInterval(() => {
      // 30% chance to show a toast every 15 seconds
      if (Math.random() > 0.3) {
        const randomMsg = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
        toast(randomMsg, {
          icon: <ShoppingBag className="h-4 w-4 text-brand-green" />,
          duration: 4000,
          position: "bottom-left",
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
