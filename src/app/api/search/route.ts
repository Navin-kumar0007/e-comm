import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) return NextResponse.json({ products: [], recipes: [] });

  try {
    const products = await prisma.product.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, slug: true, images: true, price: true },
      take: 5
    });
    
    const recipes = await prisma.recipe.findMany({
      where: { title: { contains: q } },
      select: { id: true, title: true, slug: true, image: true },
      take: 5
    });

    return NextResponse.json({ products, recipes });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
