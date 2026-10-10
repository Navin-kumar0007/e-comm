'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { recordConsent } from '@/lib/consent';

// A signed-in customer's own privacy controls (DPDP Act: consent withdrawal, access, erasure).

const DAYS_TO_ANSWER = 90; // Rule 14

async function me() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error('Please sign in again.');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Account not found.');
  return user;
}

export async function getMyPrivacy() {
  const u = await me();
  const open = await prisma.privacyRequest.findFirst({ where: { userId: u.id, type: 'ERASURE', status: 'OPEN' }, select: { createdAt: true } });
  return { whatsappOffers: u.whatsappOptIn, emailOffers: u.emailOptIn, hasPhone: !!u.phone, deletionRequestedAt: open?.createdAt.toISOString() ?? null };
}

/** Turn WhatsApp or email offers on or off. Order updates are not affected. */
export async function updateMarketingChoicesAction(choices: { whatsappOffers: boolean; emailOffers: boolean }) {
  const u = await me();
  const wa = !!choices.whatsappOffers && !!u.phone;
  await prisma.user.update({ where: { id: u.id }, data: { whatsappOptIn: wa, emailOptIn: !!choices.emailOffers } });
  if (u.phone) {
    await prisma.whatsAppSubscriber.updateMany({ where: { phone: u.phone }, data: { subscribedOffers: wa, subscribedNewReleases: wa, subscribedPriceDrops: wa } });
  }
  if (wa !== u.whatsappOptIn) await recordConsent({ purpose: 'WHATSAPP_OFFERS', granted: wa, source: 'ACCOUNT', userId: u.id, phone: u.phone });
  if (!!choices.emailOffers !== u.emailOptIn) await recordConsent({ purpose: 'EMAIL_OFFERS', granted: !!choices.emailOffers, source: 'ACCOUNT', userId: u.id, email: u.email });
  revalidatePath('/account/settings');
  return { success: true, whatsappOffers: wa };
}

/** Everything we hold about the customer, as a JSON file they can keep. */
export async function downloadMyDataAction() {
  const u = await me();
  const [orders, consents, subscriber, reviews] = await Promise.all([
    prisma.order.findMany({
      where: { OR: [{ userId: u.id }, { customerEmail: u.email }] , status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, status: true, total: true, paymentMethod: true, invoiceNumber: true, customerName: true, customerPhone: true, customerEmail: true, shippingAddress: true, items: { select: { productName: true, weight: true, quantity: true, price: true } } },
    }),
    prisma.consentRecord.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, select: { purpose: true, granted: true, source: true, noticeVersion: true, createdAt: true } }),
    u.phone ? prisma.whatsAppSubscriber.findUnique({ where: { phone: u.phone } }) : null,
    prisma.review.findMany({ where: { userId: u.id }, select: { rating: true, comment: true, createdAt: true } }).catch(() => []),
  ]);
  await prisma.privacyRequest.create({ data: { userId: u.id, email: u.email, phone: u.phone, type: 'ACCESS', status: 'DONE', details: 'Downloaded from account page', dueAt: new Date(), closedAt: new Date(), closedBy: 'self-service' } });
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    business: 'B.M.V. Spices & Dry Fruits (Spicy Nuts)',
    account: { name: u.name, email: u.email, phone: u.phone, address: u.address, city: u.city, state: u.state, pincode: u.pincode, createdAt: u.createdAt, spicePoints: u.points, whatsappOffers: u.whatsappOptIn, emailOffers: u.emailOptIn, termsAcceptedAt: u.termsAcceptedAt },
    orders, consents, whatsappSubscription: subscriber, reviews,
  }, null, 2);
}

/** Ask for the account to be deleted. Staff complete it; invoices are kept as GST law requires. */
export async function requestAccountDeletionAction(reason?: string) {
  const u = await me();
  const existing = await prisma.privacyRequest.findFirst({ where: { userId: u.id, type: 'ERASURE', status: 'OPEN' } });
  if (existing) return { success: true, already: true };
  await prisma.privacyRequest.create({
    data: { userId: u.id, email: u.email, phone: u.phone, type: 'ERASURE', details: reason?.trim().slice(0, 500) || null, dueAt: new Date(Date.now() + DAYS_TO_ANSWER * 864e5) },
  });
  // Stop marketing straight away; the rest is done by staff.
  await prisma.user.update({ where: { id: u.id }, data: { whatsappOptIn: false, emailOptIn: false } });
  await recordConsent({ purpose: 'WHATSAPP_OFFERS', granted: false, source: 'ACCOUNT', userId: u.id, phone: u.phone });
  try {
    const { notifyAdminContact } = await import('@/lib/email');
    await notifyAdminContact(u.name, u.email, `Privacy request: please delete my Spicy Nuts account.${reason ? ` Reason: ${reason}` : ''} (Open Admin → Privacy requests)`);
  } catch (e) {
    console.error('[PRIVACY] Admin notification failed', e);
  }
  revalidatePath('/account/settings');
  return { success: true };
}
