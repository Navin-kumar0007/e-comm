'use client';

import { create } from 'zustand';

/** One cart sheet for the whole shop: the header bag, the desktop pill and the phone tab bar all open it. */
export const useCartSheet = create<{ open: boolean; setOpen: (open: boolean) => void }>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

/** A short vibration on Android phones when something is added (iPhones ignore it). */
export function haptic(ms = 8) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
  } catch {
    // Some browsers throw when vibration is blocked; the tap still works.
  }
}
