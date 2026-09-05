"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShopSidebar({ categories, counts }: { categories: any[], counts: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || 'all';
  const currentPrice = searchParams.get('price') || 'all';
  const currentDietary = searchParams.getAll('dietary');
  const currentSpice = searchParams.getAll('spice');

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
    
    // Remove all existing to rebuild
    params.delete(key);
    
    if (currentValues.includes(value)) {
      // Remove it
      const newValues = currentValues.filter(v => v !== value);
      newValues.forEach(v => params.append(key, v));
    } else {
      // Add it
      currentValues.forEach(v => params.append(key, v));
      params.append(key, value);
    }
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <aside className="w-full md:w-64 shrink-0 space-y-8">
      <div className="flex items-center justify-between md:hidden mb-4">
        <h2 className="text-lg font-bold">Filters</h2>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="hidden md:block space-y-8 sticky top-24">
        {/* Category Filter */}
        <div>
          <h3 className="font-heading font-semibold text-lg mb-4 pb-2 border-b">Categories</h3>
          <ul className="space-y-3">
            <li>
              <button 
                onClick={() => updateFilters('category', 'all')}
                className={`flex items-center justify-between w-full text-left transition-colors font-medium ${currentCategory === 'all' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                <span>All Products</span>
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{counts.total}</span>
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <button 
                  onClick={() => updateFilters('category', category.slug)}
                  className={`flex items-center justify-between w-full text-left transition-colors font-medium ${currentCategory === category.slug ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                  <span>{category.name}</span>
                  <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{counts.categories[category.id] || 0}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Price Filter */}
        <div>
          <h3 className="font-heading font-semibold text-lg mb-4 pb-2 border-b">Price</h3>
          <ul className="space-y-3 text-muted-foreground">
            {[
              { label: 'All Prices', value: 'all' },
              { label: 'Under ₹500', value: 'under-500' },
              { label: '₹500 - ₹1000', value: '500-1000' },
              { label: 'Over ₹1000', value: 'over-1000' },
            ].map(price => (
              <li key={price.value}>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="price" 
                    className="sr-only" 
                    checked={currentPrice === price.value}
                    onChange={() => updateFilters('price', price.value)}
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${currentPrice === price.value ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'}`}>
                    {currentPrice === price.value && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <span className={currentPrice === price.value ? 'text-foreground font-medium' : ''}>{price.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Dietary Tags (Multi-select) */}
        <div>
          <h3 className="font-heading font-semibold text-lg mb-4 pb-2 border-b">Dietary Needs</h3>
          <ul className="space-y-3 text-muted-foreground">
            {[
              { label: 'Vegan', value: 'vegan' },
              { label: 'Gluten-Free', value: 'gluten-free' },
              { label: 'Nut-Free', value: 'nut-free' },
              { label: 'Organic', value: 'organic' },
            ].map(dietary => (
              <li key={dietary.value}>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={currentDietary.includes(dietary.value)}
                    onChange={() => toggleArrayFilter('dietary', dietary.value)}
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${currentDietary.includes(dietary.value) ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'}`}>
                    {currentDietary.includes(dietary.value) && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <span className={currentDietary.includes(dietary.value) ? 'text-foreground font-medium' : ''}>{dietary.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Spice Level (Multi-select) */}
        <div>
          <h3 className="font-heading font-semibold text-lg mb-4 pb-2 border-b">Spice Level</h3>
          <ul className="space-y-3 text-muted-foreground">
            {[
              { label: 'Mild', value: 'mild' },
              { label: 'Medium', value: 'medium' },
              { label: 'Hot & Spicy', value: 'spicy' },
            ].map(spice => (
              <li key={spice.value}>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={currentSpice.includes(spice.value)}
                    onChange={() => toggleArrayFilter('spice', spice.value)}
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${currentSpice.includes(spice.value) ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'}`}>
                    {currentSpice.includes(spice.value) && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <span className={currentSpice.includes(spice.value) ? 'text-foreground font-medium' : ''}>{spice.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
