import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      select: { id: true, title: true, image: true, prepTime: true },
      take: 20
    });
    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
