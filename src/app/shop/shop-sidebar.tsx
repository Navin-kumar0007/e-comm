"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Check, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function ShopSidebar({ categories, counts }: { categories: any[], counts: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentCategory = searchParams.get('category') || 'all';
  const currentPrice = searchParams.get('price') || 'all';
  const currentDietary = searchParams.getAll('dietary');
  const currentSpice = searchParams.getAll('spice');

  const activeFilterCount = (currentCategory !== 'all' ? 1 : 0) +
    (currentPrice !== 'all' ? 1 : 0) +
    currentDietary.length +
    currentSpice.length;

  // For single-value filters (category, price)
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // For multi-value filters (dietary, spice)
  const toggleArrayFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = params.getAll(key);
    
    params.delete(key);
    
    if (currentValues.includes(value)) {
      const newValues = currentValues.filter(v => v !== value);
      newValues.forEach(v => params.append(key, v));
    } else {
      currentValues.forEach(v => params.append(key, v));
      params.append(key, value);
    }
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const FilterSections = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3 pb-2 border-b border-border/50 text-foreground">
          Collections
        </h3>
        <ul className="space-y-2 text-sm">
          <li>
            <button 
              onClick={() => updateFilters('category', 'all')}
              className={`flex items-center justify-between w-full text-left transition-colors font-medium py-1 px-2 rounded-lg ${
                currentCategory === 'all' 
                  ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>All Products</span>
              <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-mono">{counts.total}</span>
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <button 
                onClick={() => updateFilters('category', category.slug)}
                className={`flex items-center justify-between w-full text-left transition-colors font-medium py-1 px-2 rounded-lg ${
                  currentCategory === category.slug 
                    ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{category.name}</span>
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-mono">{counts.categories[category.id] || 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Filter */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3 pb-2 border-b border-border/50 text-foreground">
          Price Range
        </h3>
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          {[
            { label: 'All Prices', value: 'all' },
            { label: 'Under ₹500', value: 'under-500' },
            { label: '₹500 - ₹1000', value: '500-1000' },
            { label: 'Over ₹1000', value: 'over-1000' },
          ].map(price => (
            <li key={price.value}>
              <label className="flex items-center gap-3 cursor-pointer group py-0.5 px-2 rounded-lg hover:bg-muted/50">
                <input 
                  type="radio" 
                  name="price" 
                  className="sr-only" 
                  checked={currentPrice === price.value}
                  onChange={() => updateFilters('price', price.value)}
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  currentPrice === price.value ? 'border-amber-600 bg-amber-600 text-white' : 'border-border group-hover:border-amber-600'
                }`}>
                  {currentPrice === price.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={currentPrice === price.value ? 'text-foreground font-bold' : ''}>{price.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Dietary Tags (Multi-select) */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3 pb-2 border-b border-border/50 text-foreground">
          Purity &amp; Diet
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            { label: '100% Organic', value: 'organic' },
            { label: 'Raw & Unpolished', value: 'raw' },
            { label: 'Gluten-Free', value: 'gluten-free' },
            { label: 'Vegan Friendly', value: 'vegan' },
          ].map(dietary => (
            <li key={dietary.value}>
              <label className="flex items-center gap-3 cursor-pointer group py-0.5 px-2 rounded-lg hover:bg-muted/50">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={currentDietary.includes(dietary.value)}
                  onChange={() => toggleArrayFilter('dietary', dietary.value)}
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  currentDietary.includes(dietary.value) ? 'bg-[#0A261D] dark:bg-amber-500 border-[#0A261D] dark:border-amber-500 text-white dark:text-zinc-950' : 'border-border group-hover:border-amber-600'
                }`}>
                  {currentDietary.includes(dietary.value) && <Check className="w-3 h-3" />}
                </div>
                <span className={currentDietary.includes(dietary.value) ? 'text-foreground font-bold' : ''}>{dietary.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="w-full text-xs font-semibold rounded-xl border-dashed border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Reset All Filters
        </Button>
      )}
    </div>
  );

  return (
    <aside className="w-full md:w-64 shrink-0">
      {/* Mobile Horizontal Category Quick Scroll */}
      <div className="md:hidden mb-3 overflow-x-auto no-scrollbar -mx-4 px-4 flex gap-2 pb-1">
        <button
          onClick={() => updateFilters('category', 'all')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            currentCategory === 'all'
              ? 'bg-[#0A261D] dark:bg-amber-500 text-white dark:text-zinc-950 shadow-sm'
              : 'bg-muted/80 text-muted-foreground hover:text-foreground border border-border/40'
          }`}
        >
          All ({counts.total})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => updateFilters('category', c.slug)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentCategory === c.slug
                ? 'bg-[#0A261D] dark:bg-amber-500 text-white dark:text-zinc-950 shadow-sm'
                : 'bg-muted/80 text-muted-foreground hover:text-foreground border border-border/40'
            }`}
          >
            {c.name} ({counts.categories[c.id] || 0})
          </button>
        ))}
      </div>

      {/* Mobile Filter Trigger Bar */}
      <div className="flex items-center justify-between md:hidden mb-4 pb-3 border-b border-border/60">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="inline-flex items-center justify-center whitespace-nowrap text-xs font-bold rounded-xl border border-amber-500/40 bg-white/80 dark:bg-zinc-900/80 px-3.5 py-2 text-foreground shadow-sm hover:bg-amber-500/10 gap-2"
          >
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Refine Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl p-6 overflow-y-auto bg-[#FAF8F4] dark:bg-zinc-950 border-t border-amber-500/30">
            <SheetHeader className="mb-4 text-left">
              <SheetTitle className="font-heading font-bold text-xl">Refine Harvests</SheetTitle>
            </SheetHeader>
            <FilterSections />
            <div className="mt-6 pt-4 border-t border-border">
              <Button
                onClick={() => setMobileOpen(false)}
                className="w-full bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white rounded-xl h-11 font-bold text-xs"
              >
                Apply Filters &amp; View Results
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Reset ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Desktop Sticky Sidebar */}
      <div className="hidden md:block space-y-6 sticky top-28 bg-white/60 dark:bg-zinc-900/60 p-5 rounded-3xl border border-border/40 shadow-sm backdrop-blur-sm">
        <FilterSections />
      </div>
    </aside>
  );
}
