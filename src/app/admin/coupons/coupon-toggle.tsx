"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setCouponActiveAction } from "@/app/actions/admin-coupons";

export function CouponToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => {
        await setCouponActiveAction(id, !active);
        toast.success(active ? "Coupon paused" : "Coupon activated");
      })}
      title={active ? "Click to pause" : "Click to activate"}
      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-opacity disabled:opacity-50 ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
    >
      {active ? "Active" : "Paused"}
    </button>
  );
}
