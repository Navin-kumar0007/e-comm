"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";

interface StickyMobileBuyBarProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number | null;
    image: string;
    weight: string;
  };
}

export function StickyMobileBuyBar({ product }: StickyMobileBuyBarProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const effectivePrice = product.salePrice ?? product.price;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: effectivePrice,
      image: product.image,
      weight: product.weight || "250g",
    });

    setIsAdded(true);
    toast.success(`${product.name} added to bag!`, {
      description: `₹${effectivePrice} • ${product.weight || "Standard"}`,
    });

    setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 md:hidden bg-background/95 backdrop-blur-2xl border-t border-amber-500/25 p-3 shadow-[0_-8px_20px_rgba(0,0,0,0.1)] transition-all">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Left: Mini product info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate">{product.name}</h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-amber-700 dark:text-amber-400 tnum">₹{effectivePrice}</span>
              {product.salePrice && (
                <span className="text-[10px] text-muted-foreground line-through tnum">₹{product.price}</span>
              )}
              <span className="text-[10px] text-muted-foreground font-mono">({product.weight || "250g"})</span>
            </div>
          </div>
        </div>

        {/* Right: Add button */}
        <Button
          size="sm"
          onClick={handleAdd}
          className={`shrink-0 rounded-xl h-10 px-4 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all ${
            isAdded
              ? "bg-emerald-700 text-white"
              : "bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Bag</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
