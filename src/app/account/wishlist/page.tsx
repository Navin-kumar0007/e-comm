"use client";
import { useEffect, useState } from "react";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { getProductsByIds } from "@/app/actions/products";
import { ProductCard } from "@/components/storefront/product-card";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WishlistDashboardPage() {
  const { items } = useWishlistStore();
  const [mounted, setMounted] = useState(false);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    getProductsByIds(items).then(setWishlistProducts);
  }, [items]);

  if (!mounted) return null;



  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">My Wishlist</h1>
        <p className="text-muted-foreground">Products you've saved for later.</p>
      </div>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border/50 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">Save your favourite items here so you don't lose track of them.</p>
          <Link href="/shop">
            <Button className="rounded-full px-8 shadow-sm">
              <ShoppingBag className="w-4 h-4 mr-2" /> Start Exploring
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
