'use server';

import { prisma } from '@/lib/db/prisma';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { audit } from '@/lib/audit';

const last10 = (p: string) => p.replace(/\D/g, '').slice(-10);
/** WhatsApp only allows free-text replies within 24 hours of the customer's last message. */
const WINDOW_MS = 24 * 36e5;

/** One row per phone number that has messaged us, newest first. */
export async function getConversations() {
  await requirePermission('customers.view');
  const inbound = await prisma.whatsAppLog.findMany({ where: { type: 'INBOUND' }, orderBy: { createdAt: 'desc' }, take: 2000, select: { phone: true, message: true, createdAt: true, readAt: true } });
  const byPhone = new Map<string, { phone: string; last: string; at: Date; unread: number }>();
  for (const m of inbound as any[]) {
    const k = last10(m.phone);
    const cur = byPhone.get(k);
    if (!cur) byPhone.set(k, { phone: k, last: m.message, at: m.createdAt, unread: m.readAt ? 0 : 1 });
    else if (!m.readAt) cur.unread++;
  }
  const phones = [...byPhone.keys()];
  const [orders, users] = await Promise.all([
    prisma.order.findMany({ where: { OR: phones.map((p) => ({ customerPhone: { endsWith: p } })) }, orderBy: { createdAt: 'desc' }, select: { customerPhone: true, customerName: true } }),
    prisma.user.findMany({ where: { OR: phones.map((p) => ({ phone: { endsWith: p } })) }, select: { phone: true, name: true } }),
  ]);
  const nameOf = (p: string) => users.find((u: any) => u.phone && last10(u.phone) === p)?.name ?? orders.find((o: any) => last10(o.customerPhone) === p)?.customerName ?? null;
  return JSON.parse(JSON.stringify([...byPhone.values()].map((c) => ({ ...c, name: nameOf(c.phone), canReply: Date.now() - new Date(c.at).getTime() < WINDOW_MS }))));
}

/** Messages with one customer (both ways), oldest first; marks their messages as read. */
export async function getThread(phone: string) {
  await requirePermission('customers.view');
  const p = last10(phone);
  if (p.length !== 10) return { messages: [], orders: [], canReply: false };
  const variants = [p, `91${p}`];
  const [messages, orders] = await Promise.all([
    prisma.whatsAppLog.findMany({ where: { phone: { in: variants } }, orderBy: { createdAt: 'asc' }, take: 300 }),
    prisma.order.findMany({ where: { customerPhone: { endsWith: p }, status: { not: 'DELETED' } }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, status: true, total: true, createdAt: true, codStatus: true } }),
  ]);
  await prisma.whatsAppLog.updateMany({ where: { phone: { in: variants }, type: 'INBOUND', readAt: null }, data: { readAt: new Date() } });
  const lastIn = [...messages].reverse().find((m: any) => m.type === 'INBOUND');
  return JSON.parse(JSON.stringify({ messages, orders, canReply: !!lastIn && Date.now() - lastIn.createdAt.getTime() < WINDOW_MS }));
}

export async function sendReplyAction(phone: string, text: string) {
  await requirePermission('customers.view');
  const actor = await staffActor();
  const body = text.trim().slice(0, 3000);
  if (!body) return { error: 'Type a message.' };
  const p = last10(phone);
  const lastIn = await prisma.whatsAppLog.findFirst({ where: { phone: { in: [p, `91${p}`] }, type: 'INBOUND' }, orderBy: { createdAt: 'desc' } });
  if (!lastIn || Date.now() - lastIn.createdAt.getTime() >= WINDOW_MS) {
    return { error: 'WhatsApp only allows free replies within 24 hours of the customer’s last message. Call them, or send an order update.' };
  }
  const res = await sendWhatsAppMessage({ to: `91${p}`, message: body, type: 'REPLY' });
  if (!res.success) return { error: res.status === 'SIMULATED' ? 'WhatsApp is not set up on this server.' : `Not sent: ${res.error ?? 'WhatsApp error'}` };
  await audit({ action: 'whatsapp.reply', entity: 'Customer', entityId: p, summary: `Replied on WhatsApp: ${body.slice(0, 80)}`, actor });
  return { success: true };
}

export async function getUnreadCount() {
  await requirePermission('customers.view');
  return prisma.whatsAppLog.count({ where: { type: 'INBOUND', readAt: null } });
}
