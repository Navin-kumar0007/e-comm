'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';

// Load the WebGL scene only on the client, and only when actually mounted.
const ProductViewer3D = dynamic(() => import('@/components/three/product-viewer-3d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
    </div>
  ),
});

interface Product3DViewerProps {
  /** Spice fill color for the 3D jar (derived from the product). */
  spiceColor?: string;
  altText?: string;
}

/**
 * Interactive 3D product viewer. Renders a procedural glass spice jar with
 * OrbitControls. Respects prefers-reduced-motion by showing a static jar
 * (no auto-rotate) and never blocks the page if WebGL is unavailable.
 */
export function Product3DViewer({ spiceColor = '#c59b27', altText }: Product3DViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <div
      className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-muted/40 via-background to-muted/60 border border-border/50 shadow-inner group"
      role="img"
      aria-label={altText || '3D view of the product jar'}
    >
      {mounted && <ProductViewer3D spiceColor={spiceColor} />}

      {!reduced && (
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-foreground flex items-center gap-2 border border-border/50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <RotateCcw className="w-3 h-3" /> Drag to rotate
        </div>
      )}
    </div>
  );
}
