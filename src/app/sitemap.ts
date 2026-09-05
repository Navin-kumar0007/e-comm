import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nuttyworld.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/shop',
    '/about',
    '/recipes',
    '/blog',
    '/contact',
    '/blend-creator',
    '/traceability',
    '/privacy-policy',
    '/shipping-policy',
    '/returns',
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
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
        priority: 0.6,
      })),
    ];
  } catch {
    // If the DB is unreachable at build time, still emit static routes.
    dynamicRoutes = [];
  }

  return [...staticRoutes, ...dynamicRoutes];
}
