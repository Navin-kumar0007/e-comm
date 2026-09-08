import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spicy-nuts.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { path: '', priority: 1.0 },
    { path: '/shop', priority: 0.9 },
    { path: '/about', priority: 0.7 },
    { path: '/recipes', priority: 0.7 },
    { path: '/blog', priority: 0.6 },
    { path: '/contact', priority: 0.6 },
    { path: '/blend-creator', priority: 0.6 },
    { path: '/traceability', priority: 0.5 },
    { path: '/founder', priority: 0.5 },
    { path: '/help', priority: 0.4 },
    { path: '/privacy-policy', priority: 0.3 },
    { path: '/shipping-policy', priority: 0.3 },
    { path: '/returns', priority: 0.3 },
    { path: '/terms', priority: 0.3 },
  ].map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority,
  }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const [products, categories, recipes] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.recipe.findMany({
        where: { status: 'APPROVED' },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    dynamicRoutes = [
      ...products.map((p: { slug: string; updatedAt: Date }) => ({
        url: `${siteUrl}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...categories.map((c: { slug: string; updatedAt: Date }) => ({
        url: `${siteUrl}/category/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...recipes.map((r: { slug: string; updatedAt: Date }) => ({
        url: `${siteUrl}/recipes/${r.slug}`,
        lastModified: r.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ];
  } catch {
    dynamicRoutes = [];
  }

  return [...staticRoutes, ...dynamicRoutes];
}
