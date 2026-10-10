"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { clearTwoStepCookieAction } from "@/app/actions/auth";

/** Signs out on this device (also forgets the admin two-step check), then goes to the home page. */
export function SignOutButton({ className, label = "Sign out" }: { className?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await clearTwoStepCookieAction();
        } catch {
          // still sign out
        }
        await signOut({ callbackUrl: "/" });
      }}
      className={className}
    >
      <LogOut className="h-4 w-4" /> {busy ? "Signing out…" : label}
    </button>
  );
}
