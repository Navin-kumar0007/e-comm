import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductCard, type ProductCardProduct } from '@/components/storefront/product-card';
import { PageHero } from '@/components/storefront/royal/page-hero';
import { prisma } from '@/lib/db/prisma';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const category = await prisma.category.findUnique({ where: { slug: resolvedParams.slug } });
  if (!category) return { title: 'Not Found' };
  return {
    title: `${category.name} | Spicy Nuts`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const category = await prisma.category.findUnique({ where: { slug: resolvedParams.slug } });

  if (!category) {
    notFound();
  }

  const rawProducts = await prisma.product.findMany({
    where: { categoryId: category.id, status: 'ACTIVE' },
    include: { variants: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }] } },
  });
  const products: ProductCardProduct[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    images: p.images,
    weight: p.weight,
    stock: p.stock,
    variants: p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, salePrice: v.salePrice, stock: v.stock })),
  }));

  return (
    <div className="pb-12">
      <PageHero
        eyebrow="Shop by category"
        title={category.name}
        subtitle={category.description}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: category.name }]}
        compact
      />
      <div className="container mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 md:pt-8">
        {products.length === 0 ? (
          <div className="royal-card px-6 py-14 text-center">
            <h2 className="font-heading text-3xl font-bold text-primary">Nothing here yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">No products found in this category.</p>
            <Link href="/shop" className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-extrabold text-primary-foreground">See all products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
