import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  items: string[]; // Array of product IDs
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (productId) => {
        const currentItems = get().items;
        if (currentItems.includes(productId)) {
          set({ items: currentItems.filter(id => id !== productId) });
        } else {
          set({ items: [...currentItems, productId] });
        }
      },
      isInWishlist: (productId) => get().items.includes(productId),
    }),
    {
      name: 'nuttyworld-wishlist',
    }
  )
);
