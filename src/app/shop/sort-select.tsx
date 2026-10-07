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
      className="h-10 cursor-pointer rounded-full border border-border bg-card px-3.5 text-[13px] font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="newest">Newest</option>
      <option value="featured">Featured</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </select>
  );
}
