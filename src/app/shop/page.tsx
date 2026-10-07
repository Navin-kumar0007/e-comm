import Image from 'next/image';
import Link from 'next/link';
import { ProductCard, type ProductCardProduct } from '@/components/storefront/product-card';
import { prisma } from '@/lib/db/prisma';
import { ShopSidebar } from './shop-sidebar';
import { SortSelect } from './sort-select';
import { COLLECTIONS, getCollection, collectionWhere } from '@/lib/collections';
import { PageHero } from '@/components/storefront/royal/page-hero';

export const metadata = {
  title: 'Buy Premium Dry Fruits, Nuts & Seeds Online — Spicy Nuts Shop',
  description: 'Shop almonds, cashews, walnuts, pistachios, dates, raisins, figs, makhana and seeds. Free shipping above ₹999.',
  keywords: ['buy dry fruits online', 'almonds online', 'cashew nuts online', 'walnuts online', 'dates and raisins'],
};

type Params = { [key: string]: string | string[] | undefined };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const one = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : undefined);

  const collection = getCollection(one('collection'));
  const categoryFilter = one('category');
  const priceFilter = one('price');
  const sortFilter = one('sort');
  const query = one('q')?.trim();
  const dietaryFilters = Array.isArray(params.dietary) ? params.dietary : typeof params.dietary === 'string' ? params.dietary.split(',') : [];

  const and: object[] = [];
  if (collection) and.push(collectionWhere(collection));
  if (query) and.push({ name: { contains: query, mode: 'insensitive' } });
  if (dietaryFilters.length > 0) {
    and.push({
      OR: [
        { dietaryTags: { some: { slug: { in: dietaryFilters } } } },
        ...dietaryFilters.map((df) => ({ tags: { contains: df } })),
      ],
    });
  }

  const where: Record<string, unknown> = { status: 'ACTIVE' };
  if (categoryFilter && categoryFilter !== 'all') where.category = { slug: categoryFilter };
  if (priceFilter === 'under-500') where.price = { lt: 500 };
  if (priceFilter === '500-1000') where.price = { gte: 500, lte: 1000 };
  if (priceFilter === 'over-1000') where.price = { gt: 1000 };
  if (and.length > 0) where.AND = and;

  let orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' };
  if (sortFilter === 'price-asc') orderBy = { price: 'asc' };
  if (sortFilter === 'price-desc') orderBy = { price: 'desc' };
  if (sortFilter === 'featured') orderBy = { isFeatured: 'desc' };

  const rawProducts = await prisma.product.findMany({
    where,
    orderBy,
    include: { variants: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }] } },
  });

  const products: ProductCardProduct[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    salePrice: p.salePrice,
    images: p.images,
    weight: p.weight,
    stock: p.stock,
    variants: p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, salePrice: v.salePrice, stock: v.stock })),
  }));

  const title = collection ? collection.name : query ? `Results for “${query}”` : 'Dry Fruits & Seeds';
  const keep = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const k of ['price', 'sort']) if (one(k)) sp.set(k, one(k)!);
    dietaryFilters.forEach((d) => sp.append('dietary', d));
    for (const [k, v] of Object.entries(extra)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/shop?${s}` : '/shop';
  };

  return (
    <div className="pb-10">
      <PageHero
        eyebrow="The royal pantry"
        title={title}
        subtitle={`${products.length} ${products.length === 1 ? 'product' : 'products'} · free shipping above ₹999`}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Shop' }]}
        compact
      />

      {/* Collection rail */}
      <div className="top-header sticky z-30 border-b border-border bg-background/95 backdrop-blur">
        <nav aria-label="Collections" className="hide-scrollbar container mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href={keep({})}
            aria-current={!collection ? 'page' : undefined}
            className={`flex h-10 shrink-0 items-center rounded-full border px-4 text-[13px] font-bold ${!collection ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'}`}
          >
            All
          </Link>
          {COLLECTIONS.map((c) => {
            const on = collection?.slug === c.slug;
            return (
              <Link
                key={c.slug}
                href={keep({ collection: c.slug })}
                aria-current={on ? 'page' : undefined}
                className={`flex h-10 shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-[13px] font-bold ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'}`}
              >
                <Image src={c.image} alt="" width={80} height={80} className="h-8 w-8 rounded-full object-cover" />
                {c.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 md:pt-8">
        <div className="flex gap-8 lg:gap-10">
          <ShopSidebar variant="desktop" />

          <main className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
              <p className="hidden text-sm text-muted-foreground md:block">
                Showing <span className="font-bold text-foreground">{products.length}</span> {products.length === 1 ? 'product' : 'products'}
              </p>
              <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-end">
                <ShopSidebar variant="mobile" />
                <SortSelect />
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center">
                <h2 className="font-heading text-3xl font-bold text-primary">Nothing here yet</h2>
                <p className="mt-2 text-muted-foreground">Try another collection or clear your filters.</p>
                <Link href="/shop" className="mt-5 inline-flex h-12 items-center rounded-2xl bg-primary px-6 font-extrabold text-primary-foreground">
                  See all dry fruits
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
