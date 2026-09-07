import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/storefront/product-card';
import { prisma } from '@/lib/db/prisma';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const category = await prisma.category.findUnique({ where: { slug: resolvedParams.slug } });
  if (!category) return { title: 'Not Found' };
  return {
    title: `${category.name} | Nutty World`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const category = await prisma.category.findUnique({ where: { slug: resolvedParams.slug } });
  
  if (!category) {
    notFound();
  }

  const rawProducts = await prisma.product.findMany({ where: { categoryId: category.id } });
  const categoryProducts = rawProducts.map((p: any) => ({...p, weight: p.weight || undefined, images: JSON.parse(p.images), tags: p.tags ? p.tags.split(',') : []}));

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-28 md:pb-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary mb-2">
          {category.name}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          {category.description}
        </p>
      </div>

      {categoryProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No products found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {categoryProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
