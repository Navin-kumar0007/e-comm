'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';

export async function createCouponAction(data: {
  code: string;
  discountType: string;
  discountValue: number;
  minPurchase?: number;
}) {
  await requireAdmin();
  
  const coupon = await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      minPurchase: data.minPurchase || null,
      active: true,
    }
  });

  revalidatePath('/admin/coupons');
  return coupon;
}

export async function deleteCouponAction(id: string) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath('/admin/coupons');
  return { success: true };
}
