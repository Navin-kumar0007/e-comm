"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

const KEY = "sn-cookie-consent"; // "granted" | "denied"
export const OPEN_COOKIE_SETTINGS = "sn:cookie-settings";

/**
 * Google Analytics loads only after the visitor says yes (DPDP: consent before tracking).
 * Essential cookies (login, cart) don't need consent and are always on.
 * Shown only when an Analytics ID is configured.
 */
export function CookieConsent({ gaId }: { gaId?: string }) {
  const [choice, setChoice] = useState<"granted" | "denied" | null | "loading">("loading");

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* private mode */ }
    setChoice(saved === "granted" || saved === "denied" ? saved : null);
    const reopen = () => setChoice(null);
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, []);

  if (!gaId) return null;

  const decide = (c: "granted" | "denied") => {
    try { localStorage.setItem(KEY, c); } catch { /* ignore */ }
    setChoice(c);
    if (c === "denied" && typeof window !== "undefined") {
      // Stop any analytics already running in this tab.
      (window as any)[`ga-disable-${gaId}`] = true;
    }
  };

  return (
    <>
      {choice === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {choice === null && (
        <div role="dialog" aria-label="Cookie choices" className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-xl rounded-2xl border border-brand-gold/40 bg-white p-4 text-sm text-foreground shadow-2xl md:bottom-5 print:hidden">
          <p className="leading-snug">
            We use essential cookies to run the shop (login, cart). With your permission we also use Google Analytics to see which pages are useful.
            {" "}<Link href="/privacy-policy" className="font-medium text-primary underline">Privacy Policy</Link>
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button onClick={() => decide("denied")} className="h-9 rounded-full border border-border px-4 text-[13px] font-semibold hover:bg-muted">Only essential</button>
            <button onClick={() => decide("granted")} className="h-9 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:opacity-90">Accept analytics</button>
          </div>
        </div>
      )}
    </>
  );
}

/** Footer link to change the cookie choice later. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}>
      Cookie settings
    </button>
  );
}
