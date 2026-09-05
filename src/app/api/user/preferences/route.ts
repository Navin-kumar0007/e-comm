import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({});
  
  const profile = await prisma.dietaryProfile.findUnique({
    where: { userId: (await prisma.user.findUnique({where: {email: session.user.email!}}))?.id || session.user.id }
  });
  
  return NextResponse.json(profile || {});
}
