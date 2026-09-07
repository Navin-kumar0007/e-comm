import { prisma } from '@/lib/db/prisma';
import { ProductCard } from '@/components/storefront/product-card';
import { Search } from 'lucide-react';

export const metadata = {
  title: 'Search Results | Spicy Nuts',
  description: 'Search results for your query.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const { q } = resolvedParams;
  
  let results: any[] = [];

  if (q && q.trim()) {
    try {
      const dbProducts = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q.trim(), mode: 'insensitive' } },
            { description: { contains: q.trim(), mode: 'insensitive' } },
            { tags: { contains: q.trim(), mode: 'insensitive' } },
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      results = dbProducts.map((p: any) => ({
        ...p, 
        weight: p.weight || undefined, 
        images: JSON.parse(p.images), 
        tags: p.tags ? p.tags.split(',') : []
      }));
    } catch (err) {
      console.error("Search page DB query error:", err);
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-28 md:pb-10 min-h-[60vh]">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
          Search Results
        </h1>
        {q ? (
          <p className="text-muted-foreground text-sm">
            Showing results for <span className="font-semibold text-foreground">"{q}"</span> ({results.length} found)
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">Please enter a search term.</p>
        )}
      </div>

      {q && results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {results.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : q ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-border/40 rounded-3xl bg-card">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">No matching products found</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            We couldn't find anything matching "{q}". Check the spelling or browse our gourmet collections.
          </p>
        </div>
      ) : null}
    </div>
  );
}
