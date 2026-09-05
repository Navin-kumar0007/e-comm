'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  isOrganic?: boolean;
}

/**
 * Premium Product Visual Gallery featuring high-res studio photography,
 * smooth hover zoom, and multi-angle thumbnail navigation.
 */
export function ProductGallery({ images, productName, isOrganic }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const safeImages = images?.length ? images : ['/placeholder.jpg'];

  return (
    <div className="space-y-3">
      {/* Primary High-Resolution Image Display */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/20 border border-border/50 shadow-sm">
        <Image
          src={safeImages[active]}
          alt={productName}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {isOrganic && (
          <Badge className="absolute top-3.5 left-3.5 bg-emerald-700 hover:bg-emerald-700 text-white border-none shadow-md text-xs font-semibold px-2.5 py-1">
            <Leaf className="w-3 h-3 mr-1" /> 100% Organic
          </Badge>
        )}
      </div>

      {/* Thumbnails row if multiple photos exist */}
      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {safeImages.slice(0, 4).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={`relative aspect-square rounded-xl overflow-hidden border transition-all ${
                active === i ? 'border-primary ring-2 ring-primary/30 shadow-sm' : 'border-border/50 hover:border-primary/40 opacity-80 hover:opacity-100'
              }`}
            >
              <Image src={img} alt={`${productName} thumbnail ${i + 1}`} fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
