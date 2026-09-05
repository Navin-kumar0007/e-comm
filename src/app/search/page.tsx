import { prisma } from '@/lib/db/prisma';
import { ProductCard } from '@/components/storefront/product-card';
import { Search } from 'lucide-react';

export const metadata = {
  title: 'Search Results | Nutty World',
  description: 'Search results for your query.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const { q } = resolvedParams;
  
  const rawProducts = await prisma.product.findMany();
  const mockProducts = rawProducts.map(p => ({
    ...p, 
    weight: p.weight || undefined, 
    images: JSON.parse(p.images), 
    tags: p.tags ? p.tags.split(',') : []
  }));
  
  const results = q ? mockProducts.filter((p: any) => 
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.description.toLowerCase().includes(q.toLowerCase())
  ) : [];

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-28 md:pb-10 min-h-[60vh]">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
          Search Results
        </h1>
        {q ? (
          <p className="text-muted-foreground">
            Showing results for <span className="font-medium text-foreground">"{q}"</span>
          </p>
        ) : (
          <p className="text-muted-foreground">Please enter a search term.</p>
        )}
      </div>

      {q && results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : q ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No results found</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't find anything matching "{q}". Try adjusting your search or browse our categories.
          </p>
        </div>
      ) : null}
    </div>
  );
}
