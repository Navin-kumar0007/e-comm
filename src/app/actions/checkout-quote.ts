'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { priceCart, CheckoutError } from '@/lib/pricing';
import { checkDelivery } from '@/lib/shipping/service';

export interface CheckoutQuoteResult {
  error?: string;
  couponError?: string | null;
  appliedCouponCode?: string | null;
  subtotal?: number;
  couponDiscount?: number;
  pointsDiscount?: number;
  shippingFee?: number;
  freeShippingThreshold?: number;
  taxAmount?: number;
  gstRate?: number;
  total?: number;
  delivery?: { serviceable: boolean; codAvailable: boolean; message: string } | null;
}

/** Same pricing the checkout API uses, so the preview always matches the charge. */
export async function getCheckoutQuote(input: {
  items: Array<{ productId: string; variantId?: string; quantity: number; weight?: string; name?: string; blend?: unknown }>;
  couponCode?: string;
  usePoints?: boolean;
  pincode?: string;
}): Promise<CheckoutQuoteResult> {
  try {
    const session = await auth();
    const user = session?.user?.email
      ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, email: true, points: true } })
      : null;

    const quote = await priceCart({
      items: input.items,
      couponCode: input.couponCode,
      usePoints: input.usePoints,
      userPoints: user?.points ?? 0,
      customer: { userId: user?.id, email: user?.email },
    });

    const delivery = input.pincode && /^[1-9]\d{5}$/.test(input.pincode)
      ? await checkDelivery(input.pincode, { orderValue: quote.total })
      : null;

    return {
      delivery: delivery && { serviceable: delivery.serviceable, codAvailable: delivery.codAvailable, message: delivery.message },
      couponError: quote.couponError,
      appliedCouponCode: quote.appliedCouponCode,
      subtotal: quote.subtotal,
      couponDiscount: quote.couponDiscount,
      pointsDiscount: quote.pointsDiscount,
      shippingFee: quote.shippingFee,
      freeShippingThreshold: quote.freeShippingThreshold,
      taxAmount: quote.taxAmount,
      gstRate: quote.gstRate,
      total: quote.total,
    };
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    console.error('Checkout quote failed:', e);
    return { error: 'Could not calculate your total. Please refresh.' };
  }
}
