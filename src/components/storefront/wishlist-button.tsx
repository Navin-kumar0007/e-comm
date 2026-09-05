"use client";
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function WishlistButton({ productId, variant = 'icon' }: { productId: string, variant?: 'icon' | 'outline' }) {
  const [mounted, setMounted] = useState(false);
  const { items, toggleItem, isInWishlist } = useWishlistStore();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Button variant={variant === 'icon' ? "ghost" : "outline"} size={variant === 'icon' ? "icon" : "default"} disabled><Heart className="w-4 h-4" /></Button>;

  const active = isInWishlist(productId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(productId);
    toast.success(active ? "Removed from wishlist" : "Added to wishlist");
  };

  if (variant === 'outline') {
    return (
      <Button variant="outline" size="lg" className="w-full gap-2 rounded-xl" onClick={handleToggle}>
        <Heart className={`w-5 h-5 transition-colors ${active ? 'fill-red-500 text-red-500' : ''}`} />
        {active ? "Saved to Wishlist" : "Save to Wishlist"}
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className={`rounded-full bg-background/50 backdrop-blur-md hover:bg-background/80 ${active ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
      onClick={handleToggle}
    >
      <Heart className={`w-5 h-5 transition-colors ${active ? 'fill-red-500' : ''}`} />
      <span className="sr-only">Toggle Wishlist</span>
    </Button>
  );
}
