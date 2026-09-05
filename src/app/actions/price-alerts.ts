'use server';

import { prisma } from '@/lib/db/prisma';

export async function subscribeToPriceDrop(productId: string, email: string) {
  if (!email || !email.includes('@')) return { success: false, error: 'Invalid email' };
  
  await prisma.priceAlert.create({
    data: { productId, email }
  });
  
  return { success: true };
}
