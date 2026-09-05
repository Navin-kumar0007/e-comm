'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/store/cart-store';
import { toast } from 'sonner';

export function RecipeAddToCart({ products }: { products: any[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const addItem = useCartStore(s => s.addItem);

  const handleAddAll = async () => {
    setIsLoading(true);
    try {
      products.forEach((p: any) => {
        addItem({
          productId: p.id,
          name: p.name,
          slug: p.slug,
          price: p.salePrice || p.price,
          weight: p.weight || '100g',
          image: p.images ? JSON.parse(p.images)[0] : '/placeholder.jpg'
        });
      });
      toast.success(`Added ${products.length} ingredients to your cart!`);
    } catch (e) {
      toast.error('Failed to add ingredients.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleAddAll} disabled={isLoading} className="w-full rounded-full shadow-md bg-primary hover:bg-primary/90">
      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
      Add All to Cart
    </Button>
  );
}
