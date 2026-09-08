'use client';

import Image from "next/image";
import { useState, useEffect } from 'react';
import { Search, ChefHat, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function CommandPalette({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{products: any[], recipes: any[]}>({ products: [], recipes: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  useEffect(() => {
    if (!query) {
      setResults({ products: [], recipes: [] });
      return;
    }
    const delay = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => setResults(data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 border-0 max-w-2xl bg-background overflow-hidden gap-0 rounded-2xl shadow-2xl mt-[5vh] mb-auto">
        <div className="flex items-center px-4 py-3 border-b border-border/50">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, recipes..."
            className="flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground text-foreground"
            autoFocus
          />
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query && <div className="p-8 text-center text-muted-foreground text-sm">Type something to search...</div>}
          
          {loading && <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Searching...</div>}
          
          {query && !loading && results.products.length === 0 && results.recipes.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No results found for "{query}"</div>
          )}

          {results.products.length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Products</div>
              {results.products.map(p => {
                const img = Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' && p.images.startsWith('[') ? JSON.parse(p.images)[0] : p.images);
                return (
                  <div key={p.id} onClick={() => handleSelect(`/product/${p.slug}`)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                      <Image width={800} height={800} unoptimized={false} src={img || ''} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium group-hover:text-primary transition-colors">{p.name}</div>
                      <div className="text-xs text-muted-foreground">₹{p.price}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {results.recipes.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipes</div>
              {results.recipes.map(r => (
                <div key={r.id} onClick={() => handleSelect(`/recipes/${r.slug}`)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                    {r.image ? <Image width={800} height={800} unoptimized={false} src={r.image} className="w-full h-full object-cover" /> : <ChefHat className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">{r.title}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
