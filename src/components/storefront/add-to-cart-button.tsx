'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
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
      className={`gap-2 rounded-full shadow-lg hover:shadow-primary/25 transition-all ${
        isAdded ? 'bg-green-600 hover:bg-green-600 scale-105' : ''
      } ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
    >
      {isAdded ? (
        <>
          <Check className="h-4 w-4 animate-in zoom-in duration-200" />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
