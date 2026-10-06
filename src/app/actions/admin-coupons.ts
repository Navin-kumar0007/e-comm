'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth-guard';

const positiveOrNull = (n: unknown) => (Number(n) > 0 ? Number(n) : null);

export async function createCouponAction(data: {
  code: string;
  discountType: string;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  firstOrderOnly?: boolean;
  expiryDate?: string;
}) {
  await requirePermission('marketing.manage');

  const code = data.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (code.length < 3) return { error: 'Code must be at least 3 letters/numbers.' };
  if (!['PERCENTAGE', 'FIXED'].includes(data.discountType)) return { error: 'Invalid discount type.' };
  if (!(data.discountValue > 0) || (data.discountType === 'PERCENTAGE' && data.discountValue > 100)) {
    return { error: 'Percentage must be between 1 and 100.' };
  }
  if (await prisma.coupon.findUnique({ where: { code } })) return { error: `Coupon ${code} already exists.` };

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minPurchase: positiveOrNull(data.minPurchase),
      maxDiscount: data.discountType === 'PERCENTAGE' ? positiveOrNull(data.maxDiscount) : null,
      usageLimit: positiveOrNull(data.usageLimit) && Math.round(Number(data.usageLimit)),
      perUserLimit: positiveOrNull(data.perUserLimit) && Math.round(Number(data.perUserLimit)),
      firstOrderOnly: !!data.firstOrderOnly,
      // End of the chosen day, India time.
      expiryDate: data.expiryDate ? new Date(`${data.expiryDate}T23:59:59+05:30`) : null,
      active: true,
    }
  });

  revalidatePath('/admin/coupons');
  return { success: true, id: coupon.id };
}

export async function setCouponActiveAction(id: string, active: boolean) {
  await requirePermission('marketing.manage');
  await prisma.coupon.update({ where: { id }, data: { active } });
  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function deleteCouponAction(id: string) {
  await requirePermission('marketing.manage');
  await prisma.coupon.delete({ where: { id } });
  revalidatePath('/admin/coupons');
  return { success: true };
}
