'use client';

import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/store/cart-store';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    weight: string;
  };
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export function AddToCartButton({ product, className, size = 'default', fullWidth = false }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      weight: product.weight,
    });

    setIsAdded(true);
    toast.success(`${product.name} added to cart!`, {
      description: `${product.weight} — ₹${product.price}`,
    });

    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <Button
      size={size}
      onClick={handleAdd}
      className={`gap-2 rounded-2xl font-bold bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white shadow-lg active:scale-95 transition-all ${
        isAdded ? 'bg-emerald-700 hover:bg-emerald-700 text-white scale-105' : ''
      } ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
    >
      {isAdded ? (
        <>
          <Check className="h-4 w-4 animate-in zoom-in duration-200" />
          Added!
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" />
          Add to Bag
        </>
      )}
    </Button>
  );
}
