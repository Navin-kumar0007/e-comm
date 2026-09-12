import { ProductCard } from '@/components/storefront/product-card';
import { prisma } from '@/lib/db/prisma';
import { ShopSidebar } from './shop-sidebar';
import { SortSelect } from './sort-select';
import { unstable_cache } from 'next/cache';
import { auth } from '@/lib/auth';

export const metadata = {
  title: 'Buy Premium Dry Fruits & Organic Spices Online — Spicy Nuts Shop',
  description: 'Shop Afghan Mamra almonds, Kashmiri walnuts, Goan W180 cashews, organic turmeric, handcrafted masalas, and trail mixes. Free shipping above ₹999. 100% natural, no chemical processing.',
  keywords: ['buy dry fruits online', 'organic spices shop', 'Mamra almonds', 'Kashmiri walnuts', 'cashew nuts online'],
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  
  const categoryFilter = typeof params.category === 'string' ? params.category : undefined;
  const priceFilter = typeof params.price === 'string' ? params.price : undefined;
  const sortFilter = typeof params.sort === 'string' ? params.sort : undefined;
  
  const dietaryFilters = Array.isArray(params.dietary) ? params.dietary : typeof params.dietary === 'string' ? params.dietary.split(',') : [];
  const spiceFilters = Array.isArray(params.spice) ? params.spice : typeof params.spice === 'string' ? params.spice.split(',') : [];

  // Build Prisma Where Clause
  let where: any = {};
  
  if (categoryFilter && categoryFilter !== 'all') {
    where.category = { slug: categoryFilter };
  }

  if (priceFilter && priceFilter !== 'all') {
    if (priceFilter === 'under-500') where.price = { lt: 500 };
    if (priceFilter === '500-1000') where.price = { gte: 500, lte: 1000 };
    if (priceFilter === 'over-1000') where.price = { gt: 1000 };
  }
  
  let andConditions: any[] = [];

  if (dietaryFilters.length > 0) {
    andConditions.push({
      OR: [
        { dietaryTags: { some: { slug: { in: dietaryFilters } } } },
        ...dietaryFilters.map(df => ({ tags: { contains: df } }))
      ]
    });
  }

  if (spiceFilters.length > 0) {
    andConditions.push({
      OR: spiceFilters.map(sf => ({ tags: { contains: sf } }))
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Build Prisma OrderBy
  let orderBy: any = { createdAt: 'desc' }; // Default to newest
  if (sortFilter === 'price-asc') orderBy = { price: 'asc' };
  if (sortFilter === 'price-desc') orderBy = { price: 'desc' };
  if (sortFilter === 'featured') {
    orderBy = { isFeatured: 'desc' }; 
  }

  // Fetch Categories for Sidebar
  const categories = await unstable_cache(
    async () => await prisma.category.findMany(),
    ['categories-all'],
    { revalidate: 3600 }
  )();

  // We need counts for the sidebar, let's fetch all products minimally and calculate it.
  const allProducts = await unstable_cache(
    async () => await prisma.product.findMany({ select: { categoryId: true } }),
    ['products-counts'],
    { revalidate: 3600 }
  )();
  
  const counts = {
    total: allProducts.length,
    categories: allProducts.reduce((acc: any, p: any) => {
      acc[p.categoryId] = (acc[p.categoryId] || 0) + 1;
      return acc;
    }, {})
  };

  // Fetch User Dietary Tags
  const session = await auth();
  let userDietaryTagIds: string[] = [];
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { dietaryTags: true }
    });
    if (user && user.dietaryTags) {
      userDietaryTagIds = user.dietaryTags.map((t: any) => t.id);
    }
  }

  // Fetch Filtered Products
  const rawProducts = await prisma.product.findMany({
    where,
    orderBy,
    include: { dietaryTags: true }
  });

  const products = rawProducts.map((p: any) => ({
    ...p, 
    weight: p.weight || undefined, 
    images: JSON.parse(p.images), 
    tags: p.tags ? p.tags.split(',') : []
  }));

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-28 md:pb-10">
      <div className="mb-6 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
          The Imperial Harvests & Pantry
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          Explore single-estate Afghan Mamra almonds, high-altitude Kashmiri walnuts, Goan king cashews, and slow-roasted whole spices.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <ShopSidebar categories={categories} counts={counts} />

        <main className="flex-1">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <p className="text-muted-foreground text-xs md:text-sm font-medium">
              Showing <span className="text-foreground font-bold">{products.length}</span> {products.length === 1 ? 'harvest' : 'harvests'}
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:inline text-xs md:text-sm text-muted-foreground">Sort by:</span>
              <SortSelect />
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} userDietaryTagIds={userDietaryTagIds} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-border/50 rounded-2xl bg-muted/20">
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search criteria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
