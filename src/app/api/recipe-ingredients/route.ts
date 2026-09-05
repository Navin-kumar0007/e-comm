import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const { ingredients } = await req.json();
    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json({ error: 'Invalid ingredients' }, { status: 400 });
    }

    // Try to find products that match any of the ingredient names
    // We do a simple OR query using contains
    const orConditions = ingredients.map(ing => ({
      name: { contains: ing.split(' ')[0], lte: '' } // VERY basic heuristic: search for the first word (e.g. "Turmeric")
    }));
    
    // Better heuristic:
    const keywords = ingredients.flatMap(ing => ing.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')).filter(k => k.length > 3);
    
    if (keywords.length === 0) return NextResponse.json({ products: [] });

    const products = await prisma.product.findMany({
      where: {
        OR: keywords.map(kw => ({ name: { contains: kw } }))
      }
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
