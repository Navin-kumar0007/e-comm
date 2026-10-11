'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Smartphone, Share } from 'lucide-react';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const noopSubscribe = () => () => {};
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * "Add Spicy Nuts to your home screen" after an order. Android shows the browser's install prompt;
 * iPhone gets the two-tap instructions (Safari has no prompt). Hidden once the app is installed.
 */
export function InstallAppCard() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [done, setDone] = useState(false);
  const env = useSyncExternalStore(
    noopSubscribe,
    () => (isStandalone() ? 'installed' : isIOS() ? 'ios' : 'other'),
    () => 'installed',
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (env === 'installed' || done || (env === 'other' && !prompt)) return null;

  return (
    <div className="royal-card mx-auto mt-8 flex max-w-xl items-center gap-4 p-4 print:hidden">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-primary text-primary-foreground">
        <Smartphone className="h-6 w-6" />
      </span>
      <div className="flex-1">
        <p className="font-bold">Add Spicy Nuts to your home screen</p>
        {env === 'ios' ? (
          <p className="text-[13px] text-muted-foreground">
            Tap <Share className="inline h-4 w-4 align-[-3px]" aria-label="Share" /> in Safari, then <strong>Add to Home Screen</strong>. Track orders and reorder in one tap.
          </p>
        ) : (
          <p className="text-[13px] text-muted-foreground">Opens like an app. Track orders and reorder in one tap.</p>
        )}
      </div>
      {prompt && (
        <button
          type="button"
          onClick={async () => {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(null);
            setDone(true);
          }}
          className="h-11 shrink-0 rounded-[var(--radius-control)] border border-brand-gold bg-primary px-4 text-sm font-extrabold text-primary-foreground"
        >
          Add
        </button>
      )}
    </div>
  );
}
