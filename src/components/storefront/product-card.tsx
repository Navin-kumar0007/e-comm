'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { WishlistButton } from "./wishlist-button";
import { ShoppingBag, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/lib/store/cart-store';
import { toast } from 'sonner';

export function ProductCard({ product, userDietaryTagIds = [] }: { product: any, userDietaryTagIds?: string[] }) {
  const addItem = useCartStore(state => state.addItem);
  const [isAdding, setIsAdding] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  // 3D card tilt only for desktop mouse devices
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
    transition: 'transform 0.4s ease',
  });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = -((y - rect.height / 2) / 16);
    const rotateY = (x - rect.width / 2) / 16;

    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`,
      transition: 'transform 0.1s ease',
    });
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.25 });
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setTiltStyle({
      transform: 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
      transition: 'transform 0.4s ease-out',
    });
    setGlare((g) => ({ ...g, opacity: 0 }));
  };

  // Safe image parsing
  let images = product.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = [images];
    }
  }
  const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : '/placeholder.jpg';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    addItem({
      productId: product.id,
      name: product.name,
      price: product.salePrice ? product.salePrice : product.price,
      slug: product.slug,
      image: imageUrl,
      weight: product.weight || '250g',
    });
    toast.success(`${product.name} added to your bag!`);
    setTimeout(() => setIsAdding(false), 500);
  };

  const discountPercent = product.salePrice && product.price > product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full [perspective:1000px]">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={!isTouchDevice ? { ...tiltStyle, transformStyle: 'preserve-3d' } : undefined}
        className="relative rounded-2xl md:rounded-3xl overflow-hidden flex flex-col h-full bg-white dark:bg-zinc-900 border border-amber-500/20 hover:border-amber-500/60 shadow-sm hover:shadow-xl transition-all duration-300"
      >
        {/* Product Image Showcase */}
        <div className="relative aspect-[4/3.6] sm:aspect-square overflow-hidden bg-[#FAF8F4] dark:bg-zinc-950">
          <div className="w-full h-full transform transition-transform duration-700 group-hover:scale-105">
            <img
              src={imageUrl}
              alt={product.name}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Wishlist Button (Floating) */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <WishlistButton productId={product.id} />
          </div>

          {/* Quality & Discount Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
            {discountPercent && (
              <Badge className="bg-amber-600 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                Save {discountPercent}%
              </Badge>
            )}
            {product.isOrganic && (
              <Badge className="bg-[#0A261D] text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm border border-amber-500/30">
                Pure Organic
              </Badge>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-3 sm:p-4 flex flex-col flex-1 relative z-20 bg-white dark:bg-zinc-900 border-t border-border/40">
          {/* Rating & Origin / Weight */}
          <div className="flex items-center justify-between gap-1 mb-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <Star className="w-3 h-3 fill-current" />
              <span>4.9</span>
            </div>
            <span className="font-mono text-[10px] uppercase font-semibold text-zinc-500">{product.weight || '250g'}</span>
          </div>

          {/* Title */}
          <div className="mb-2">
            <h3 className="font-heading text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Price & Action */}
          <div className="mt-auto pt-2.5 sm:pt-3 border-t border-border/20 flex items-center justify-between gap-1.5">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0">
              {product.salePrice ? (
                <>
                  <span className="text-sm sm:text-base md:text-lg font-black text-amber-800 dark:text-amber-400 tnum truncate">₹{product.salePrice}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground line-through tnum">₹{product.price}</span>
                </>
              ) : (
                <span className="text-sm sm:text-base md:text-lg font-black text-foreground tnum truncate">₹{product.price}</span>
              )}
            </div>

            <Button
              size="sm"
              aria-label={`Add ${product.name} to cart`}
              className="rounded-xl h-8 sm:h-9 px-2 sm:px-3 bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95 shrink-0"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>

        {/* Specular glare (desktop only) */}
        {!isTouchDevice && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-soft-light transition-opacity duration-200"
            style={{
              opacity: glare.opacity,
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(212,175,55,0.4), transparent 50%)`,
            }}
          />
        )}
      </div>
    </Link>
  );
}
