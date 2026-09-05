'use server';
import { prisma } from '@/lib/db/prisma';

export async function validateCoupon(code: string, cartTotal: number) {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    
    if (!coupon || !coupon.active) return { error: 'Invalid coupon' };
    if (coupon.expiryDate && new Date() > coupon.expiryDate) return { error: 'Coupon expired' };
    if (coupon.minPurchase && cartTotal < coupon.minPurchase) return { error: `Minimum purchase of ₹${coupon.minPurchase} required` };

    return { 
      success: true, 
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    };
  } catch (error: any) {
    return { error: 'Failed to validate coupon' };
  }
}
