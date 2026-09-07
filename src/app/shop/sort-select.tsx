"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sort') || 'newest';

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <select 
      value={currentSort} 
      onChange={handleSort}
      aria-label="Sort products"
      className="h-9 px-2.5 sm:px-3 text-xs sm:text-sm rounded-xl border border-amber-500/30 bg-background/90 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer font-medium transition-colors"
    >
      <option value="newest">✨ Newest Harvests</option>
      <option value="featured">👑 Featured Royal</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  );
}
