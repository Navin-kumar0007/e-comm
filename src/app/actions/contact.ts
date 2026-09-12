'use server';
import { prisma } from '@/lib/db/prisma';
import { notifyAdminContact } from '@/lib/email';

// Simple server-side rate limit for contact form (per-email, 3 messages per 15 min)
const contactBuckets = new Map<string, { count: number; resetAt: number }>();

function contactRateLimit(email: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const limit = 3;
  const key = email.toLowerCase().trim();
  const bucket = contactBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    contactBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export async function submitContact(data: { name: string, email: string, message: string }) {
  try {
    if (!data.name || !data.email || !data.message) return { error: 'All fields are required' };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) return { error: 'Invalid email address' };

    // Rate limit: max 3 messages per 15 minutes per email
    if (!contactRateLimit(data.email)) {
      return { error: 'Too many messages. Please try again later.' };
    }

    // Sanitize inputs (strip HTML tags)
    const sanitize = (str: string) => str.replace(/<[^>]*>/g, '').trim();

    await prisma.contactMessage.create({
      data: {
        name: sanitize(data.name),
        email: data.email.toLowerCase().trim(),
        message: sanitize(data.message),
      }
    });
    try { await notifyAdminContact(data.name, data.email, data.message); } catch(e) { console.error('Admin notification failed', e); }
    return { success: true };
  } catch (error: any) {
    return { error: 'Failed to send message' };
  }
}
