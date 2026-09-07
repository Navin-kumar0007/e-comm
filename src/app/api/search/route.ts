import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || !q.trim()) return NextResponse.json({ products: [], recipes: [] });

  try {
    const products = await prisma.product.findMany({
      where: { 
        OR: [
          { name: { contains: q.trim(), mode: 'insensitive' } },
          { description: { contains: q.trim(), mode: 'insensitive' } },
          { tags: { contains: q.trim(), mode: 'insensitive' } },
        ]
      },
      select: { id: true, name: true, slug: true, images: true, price: true, salePrice: true, weight: true },
      take: 8
    });
    
    const recipes = await prisma.recipe.findMany({
      where: { 
        title: { contains: q.trim(), mode: 'insensitive' } 
      },
      select: { id: true, title: true, slug: true, image: true },
      take: 4
    });

    return NextResponse.json({ products, recipes });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
