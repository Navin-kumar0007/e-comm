'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import { audit } from '@/lib/audit';

const last10 = (p?: string | null) => (p || '').replace(/\D/g, '').slice(-10);

export async function getPrivacyRequests() {
  await requirePermission('staff.manage');
  const rows = await prisma.privacyRequest.findMany({ orderBy: [{ status: 'asc' }, { dueAt: 'asc' }], take: 300 });
  return JSON.parse(JSON.stringify(rows));
}

/** Log a request that came by email, phone or in the shop. */
export async function createPrivacyRequestAction(input: { email?: string; phone?: string; type: 'ACCESS' | 'CORRECTION' | 'ERASURE' | 'WITHDRAW'; details?: string }) {
  await requirePermission('staff.manage');
  const email = input.email?.trim().toLowerCase() || null;
  const phone = last10(input.phone) || null;
  if (!email && !phone) return { error: 'Enter the customer’s email or phone.' };
  const user = await prisma.user.findFirst({ where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone: { endsWith: phone } }] : [])] }, select: { id: true } });
  await prisma.privacyRequest.create({ data: { userId: user?.id ?? null, email, phone, type: input.type, details: input.details?.trim().slice(0, 1000) || null, dueAt: new Date(Date.now() + 90 * 864e5) } });
  revalidatePath('/admin/privacy');
  return { success: true };
}

export async function closePrivacyRequestAction(id: string, status: 'DONE' | 'REJECTED', note?: string) {
  await requirePermission('staff.manage');
  const actor = await staffActor();
  await prisma.privacyRequest.update({ where: { id }, data: { status, note: note?.trim().slice(0, 1000) || null, closedAt: new Date(), closedBy: actor } });
  await audit({ action: `privacy.${status.toLowerCase()}`, entity: 'PrivacyRequest', entityId: id, summary: `Privacy request ${status === 'DONE' ? 'completed' : 'rejected'}${note ? `: ${note}` : ''}`, actor });
  revalidatePath('/admin/privacy');
  return { success: true };
}

/**
 * Erases a customer: account details, saved address, chats, notes, marketing lists and alerts.
 * Orders and invoices are kept (GST law: about 6 years) but are no longer linked to marketing.
 */
export async function eraseCustomerAction(requestId: string) {
  await requirePermission('staff.manage');
  const actor = await staffActor();
  const req = await prisma.privacyRequest.findUnique({ where: { id: requestId } });
  if (!req || req.type !== 'ERASURE' || req.status !== 'OPEN') return { error: 'This is not an open deletion request.' };
  const user = req.userId ? await prisma.user.findUnique({ where: { id: req.userId } }) : null;
  if (user && user.role !== 'USER') return { error: 'This is a staff account. Remove their staff role first.' };
  const email = (user?.email ?? req.email ?? '').toLowerCase();
  const phone = last10(user?.phone ?? req.phone);
  const phoneVariants = phone ? [phone, `91${phone}`] : [];

  await prisma.$transaction(async (tx: any) => {
    if (user) {
      await tx.notification.deleteMany({ where: { userId: user.id } });
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: 'Deleted customer', email: `deleted-${user.id}@deleted.spicynuts.in`, phone: null, password: null, image: null, provider: null,
          address: null, city: null, state: null, pincode: null, points: 0, whatsappOptIn: false, emailOptIn: false,
          businessName: null, gstin: null, wholesaleDiscount: null, customerType: 'RETAIL', totpSecret: null, totpEnabledAt: null, totpBackupCodes: null,
        },
      });
    }
    await tx.priceAlert.deleteMany({ where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone: { endsWith: phone } }] : [])] } });
    if (phoneVariants.length) {
      await tx.whatsAppSubscriber.deleteMany({ where: { phone: { in: phoneVariants } } });
      await tx.whatsAppLog.deleteMany({ where: { phone: { in: phoneVariants } } });
    }
    await tx.customerNote.deleteMany({ where: { key: { in: [phone, email].filter(Boolean) } } });
    await tx.privacyRequest.update({ where: { id: requestId }, data: { status: 'DONE', closedAt: new Date(), closedBy: actor, note: 'Account and personal data erased; invoices kept for GST record-keeping.' } });
  }, { timeout: 15000, maxWait: 5000 });

  if (email && !email.endsWith('@deleted.spicynuts.in')) {
    try {
      const { notifyAdminContact } = await import('@/lib/email');
      // Confirmation goes to the shop inbox with the customer's email, so staff can reply from the usual mailbox.
      await notifyAdminContact('Privacy', email, `Account for ${email} has been deleted. Reply to the customer to confirm.`);
    } catch { /* not critical */ }
  }
  await audit({ action: 'privacy.erase', entity: 'PrivacyRequest', entityId: requestId, summary: `Erased customer data for ${phone || email || 'unknown'}`, actor });
  revalidatePath('/admin/privacy');
  revalidatePath('/admin/customers');
  return { success: true };
}
