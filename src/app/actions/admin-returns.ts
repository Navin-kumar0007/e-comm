'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import type { Permission } from '@/lib/permissions';
import { issueRefund, amountPaid } from '@/lib/refunds';
import { transitionOrder } from '@/lib/order-status';
import { logOrderEvent } from '@/lib/order-events';
import { sendReturnUpdate } from '@/lib/email';

async function actor(permission: Permission) {
  await requirePermission(permission);
  return staffActor();
}

function done(orderId: string) {
  revalidatePath('/admin/returns');
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function getReturnRequests() {
  await requirePermission('returns.manage');
  const rows = await prisma.returnRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { order: { select: { id: true, customerName: true, customerEmail: true, customerPhone: true, total: true, refundedAmount: true, paymentMethod: true, paymentId: true, paidAt: true, status: true } } },
  });
  return rows.map((r: any) => ({
    ...r,
    images: (() => { try { return JSON.parse(r.images) as string[]; } catch { return []; } })(),
    refundable: Math.max(0, Math.round((amountPaid(r.order) - r.order.refundedAmount) * 100) / 100),
  }));
}

export async function decideReturnAction(id: string, decision: 'APPROVE' | 'REJECT', note: string) {
  const who = await actor('returns.manage');
  const req = await prisma.returnRequest.findUnique({ where: { id }, include: { order: true } });
  if (!req || req.status !== 'REQUESTED') return { error: 'Request not found or already decided' };
  if (decision === 'REJECT' && !note.trim()) return { error: 'Tell the customer why it was rejected.' };

  const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  await prisma.returnRequest.update({ where: { id }, data: { status, adminNote: note.trim() || null } });
  await logOrderEvent(null, { orderId: req.orderId, type: 'RETURN', message: `Return ${status.toLowerCase()}${note.trim() ? `: ${note.trim()}` : ''}`, actor: who });
  try { await sendReturnUpdate(req.order.customerEmail, req.orderId, status, note.trim() || null); } catch (e) { console.error('Return email failed:', e); }
  done(req.orderId);
  return { success: true };
}

/**
 * Closes an approved return.
 * REFUND: refunds `amount` (Razorpay for prepaid, manual for COD). A full refund marks the order RETURNED.
 * REPLACEMENT: you ship a replacement (create it from Orders → New Order); recorded here for the audit trail.
 */
export async function resolveReturnAction(id: string, resolution: 'REFUND' | 'REPLACEMENT', amount: number, note: string) {
  const who = await actor(resolution === 'REFUND' ? 'refunds.issue' : 'returns.manage');
  const req = await prisma.returnRequest.findUnique({ where: { id }, include: { order: true } });
  if (!req || req.status !== 'APPROVED') return { error: 'Approve the request first.' };

  if (resolution === 'REFUND') {
    const r = await issueRefund({ orderId: req.orderId, amount, reason: `Return: ${req.reason}${note.trim() ? ` — ${note.trim()}` : ''}`, actor: who });
    if (!r.ok) return { error: r.error };
    const order = await prisma.order.findUnique({ where: { id: req.orderId } });
    if (order && order.refundedAmount >= amountPaid(order) - 0.01 && order.status === 'DELIVERED') {
      await transitionOrder(order.id, 'RETURNED', { actor: who, reason: 'Fully refunded after return' });
    }
  } else {
    await logOrderEvent(null, { orderId: req.orderId, type: 'RETURN', message: `Replacement promised${note.trim() ? `: ${note.trim()}` : ''}`, actor: who });
  }

  await prisma.returnRequest.update({
    where: { id },
    data: { status: 'RESOLVED', resolution, adminNote: note.trim() || req.adminNote },
  });
  try { await sendReturnUpdate(req.order.customerEmail, req.orderId, 'RESOLVED', resolution === 'REFUND' ? `Refund of ₹${amount.toFixed(2)} initiated.` : note.trim() || 'A replacement is on its way.'); } catch (e) { console.error('Return email failed:', e); }
  done(req.orderId);
  return { success: true };
}
