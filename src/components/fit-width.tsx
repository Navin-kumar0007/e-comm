"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Shows a fixed-width document (an A4 invoice is 794 px) scaled down to fit narrow screens,
 * the way a PDF viewer does, instead of squashing its columns. Printing always uses full size.
 */
export function FitWidth({ width, children }: { width: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={ref} className="fit-width w-full min-w-0">
      <div className="fit-width-inner" style={{ zoom: scale }}>{children}</div>
    </div>
  );
}
