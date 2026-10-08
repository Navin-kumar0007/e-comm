"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import { verifyTwoStepAction } from "@/app/actions/admin-security";

export function VerifyForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [backup, setBackup] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await verifyTwoStepAction(code);
      if ("error" in res && res.error) { setError(res.error); setCode(""); return; }
      window.location.href = "/admin";
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#2a0a12] p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-7 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" width={80} height={64} className="h-14 w-auto" />
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fbf6ee]"><ShieldCheck className="h-6 w-6 text-[#6E1A2C]" /></div>
          <h1 className="font-serif text-xl font-semibold text-[#2a0a12]">Two-step check</h1>
          <p className="text-sm text-muted-foreground">
            {backup ? "Enter one of your backup codes." : "Open your authenticator app and enter the 6-digit code for Spicy Nuts Admin."}
            <br /><span className="text-xs">{email}</span>
          </p>
        </div>
        <input
          autoFocus
          inputMode={backup ? "text" : "numeric"}
          autoComplete="one-time-code"
          maxLength={backup ? 9 : 6}
          value={code}
          onChange={(e) => setCode(backup ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ""))}
          placeholder={backup ? "XXXX-XXXX" : "123456"}
          aria-label={backup ? "Backup code" : "Six-digit code"}
          className="h-14 w-full rounded-xl border border-border text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-[#6E1A2C] focus:ring-2 focus:ring-[#6E1A2C]/10"
        />
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <button disabled={pending || (backup ? code.length < 8 : code.length !== 6)} className="h-11 w-full rounded-xl bg-[#6E1A2C] text-sm font-semibold text-white hover:bg-[#5a1424] disabled:opacity-40">
          {pending ? "Checking…" : "Continue to admin"}
        </button>
        <div className="flex justify-between text-xs">
          <button type="button" className="font-medium text-[#6E1A2C] hover:underline" onClick={() => { setBackup(!backup); setCode(""); setError(null); }}>
            {backup ? "Use the app code" : "Lost your phone? Use a backup code"}
          </button>
          <button type="button" className="text-muted-foreground hover:underline" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</button>
        </div>
      </form>
    </main>
  );
}
