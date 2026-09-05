'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { WishlistButton } from "./wishlist-button";
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/lib/store/cart-store';
import { toast } from 'sonner';

export function ProductCard({ product, userDietaryTagIds = [] }: { product: any, userDietaryTagIds?: string[] }) {
  const addItem = useCartStore(state => state.addItem);
  const [isAdding, setIsAdding] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Interactive 3D card tilt + pointer-tracked glare.
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
    transition: 'transform 0.5s ease',
  });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = -((y - rect.height / 2) / 12);
    const rotateY = (x - rect.width / 2) / 12;

    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`,
      transition: 'transform 0.1s ease',
    });
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.35 });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
      transition: 'transform 0.5s ease-out',
    });
    setGlare((g) => ({ ...g, opacity: 0 }));
  };

  // Try to parse images if it's a JSON string
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
      price: product.price,
      slug: product.slug,
      image: imageUrl,
      weight: product.weight || '250g',
    });
    toast.success(`${product.name} added to cart!`);
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full [perspective:1200px]">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ ...tiltStyle, transformStyle: 'preserve-3d' }}
        className="glass-card relative rounded-2xl overflow-hidden flex flex-col h-full bg-card/60 border border-border/30 shadow-lg hover:shadow-2xl transition-shadow duration-500"
      >
        {/* Image Container (floats forward on tilt) */}
        <div
          className="relative aspect-[4/3.8] overflow-hidden bg-muted"
          style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}
        >
          <div className="w-full h-full transform transition-transform duration-700 group-hover:scale-110">
            <img src={imageUrl} alt={product.name} className="object-cover w-full h-full" />
          </div>

          {/* Depth vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="absolute top-3 right-3 z-10" style={{ transform: 'translateZ(45px)' }}>
            <WishlistButton productId={product.id} />
          </div>

          {/* Smart Dietary Badges */}
          <div
            className="absolute top-3 left-3 z-10 flex flex-col gap-1"
            style={{ transform: 'translateZ(45px)' }}
          >
            {product.isFeatured && (
              <Badge className="bg-brand-gold/95 text-primary border border-brand-gold/40 backdrop-blur-md font-semibold">Featured</Badge>
            )}
            {product.isOrganic && (
              <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md">Organic</Badge>
            )}
            {product.dietaryTags?.map((tag: any) => {
              const isMatch = userDietaryTagIds.includes(tag.id);
              if (isMatch) {
                return (
                  <Badge key={tag.id} className="bg-emerald-600/95 text-white backdrop-blur-md border border-emerald-500">
                    ✓ {tag.name}
                  </Badge>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Content */}
        <div
          className="p-4 flex flex-col flex-1 relative z-20 bg-card/85 backdrop-blur-sm border-t border-border/20"
          style={{ transform: 'translateZ(20px)' }}
        >
          <div className="mb-2">
            <h3 className="font-heading text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{product.weight}</p>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              {product.salePrice ? (
                <>
                  <span className="text-lg font-bold text-foreground tnum">₹{product.salePrice}</span>
                  <span className="text-xs text-muted-foreground line-through tnum">₹{product.price}</span>
                </>
              ) : (
                <span className="text-lg font-bold text-foreground tnum">₹{product.price}</span>
              )}
            </div>
            <Button
              size="icon"
              variant="secondary"
              aria-label={`Add ${product.name} to cart`}
              className="rounded-full h-10 w-10 bg-secondary/15 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Pointer-tracked specular glare */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-soft-light transition-opacity duration-200"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8), transparent 45%)`,
            transform: 'translateZ(60px)',
          }}
        />
      </div>
    </Link>
  );
}
