"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff } from "lucide-react";

/**
 * Reads barcodes with the phone or laptop camera.
 * Uses the browser's built-in BarcodeDetector (Chrome on Android, desktop Chrome) and falls back
 * to the ZXing library elsewhere (iPhone Safari). The same code is ignored for 1.5 s so one pack
 * held in front of the camera isn't added twice.
 */
export function CameraScanner({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<string>("");
  const last = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const cb = useRef(onCode);
  cb.current = onCode;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let raf = 0;
    let zxingControls: { stop: () => void } | null = null;

    const hit = (code: string) => {
      const now = Date.now();
      if (code === last.current.code && now - last.current.at < 1500) return;
      last.current = { code, at: now };
      try { navigator.vibrate?.(60); } catch { /* ignore */ }
      beep();
      cb.current(code);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();

        const BD = (window as any).BarcodeDetector;
        const formats: string[] = BD ? await BD.getSupportedFormats?.().catch(() => []) : [];
        if (BD && formats.includes("ean_13")) {
          setEngine("built-in");
          const detector = new BD({ formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"].filter((f) => formats.includes(f)) });
          let lastRun = 0;
          const tick = async (t: number) => {
            if (stopped) return;
            if (t - lastRun > 120 && video.current && video.current.readyState >= 2) {
              lastRun = t;
              try {
                const found = await detector.detect(video.current);
                if (found[0]?.rawValue) hit(found[0].rawValue);
              } catch { /* frame not ready */ }
            }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } else {
          setEngine("zxing");
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader();
          zxingControls = await reader.decodeFromVideoElement(video.current, (result) => {
            if (result) hit(result.getText());
          });
        }
      } catch (e: any) {
        setError(e?.name === "NotAllowedError" ? "Camera permission was blocked. Allow the camera for this site in the browser settings." : "No camera found, or it is being used by another app.");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <CameraOff className="h-4 w-4 shrink-0" /> {error}
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video ref={video} playsInline muted className="h-52 w-full object-cover" />
      <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
      <span className="absolute bottom-1.5 right-2 rounded bg-black/50 px-1.5 text-[10px] text-white/80">{engine === "built-in" ? "Fast scan" : engine ? "Scan" : "Starting…"}</span>
    </div>
  );
}

let ctx: AudioContext | null = null;
function beep() {
  try {
    ctx = ctx ?? new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 1800;
    g.gain.value = 0.08;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.08);
  } catch { /* no audio */ }
}
