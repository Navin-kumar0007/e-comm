'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { getStaffContext } from '@/lib/auth-guard';
import { isStaffRole, ROLE_LABELS, type StaffRole } from '@/lib/permissions';
import { audit } from '@/lib/audit';
import {
  decryptSecret, encryptSecret, hashCode, newBackupCodes, newTotpSecret, otpauthUrl, signTwoStep, TWO_STEP_COOKIE, TWO_STEP_HOURS, useBackupCode, verifyTotp,
} from '@/lib/totp';

const MAX_FAILS = 5;
const FAIL_WINDOW_MS = 15 * 60 * 1000;

async function setVerifiedCookie(userId: string) {
  (await cookies()).set(TWO_STEP_COOKIE, signTwoStep(userId), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: TWO_STEP_HOURS * 3600,
  });
}

/** Staff member already through two-step (or not using it). */
async function verifiedStaff() {
  const ctx = await getStaffContext();
  if (!ctx || !ctx.twoStepOk) throw new Error('Unauthorized');
  return ctx;
}

const actorOf = (role: string, email: string) => `${role.toLowerCase()}:${email}`;

export async function getSecurityStatus() {
  const ctx = await verifiedStaff();
  const me = await prisma.user.findUnique({ where: { id: ctx.user.id }, select: { totpEnabledAt: true, totpBackupCodes: true } });
  const staff = ctx.can('staff.manage')
    ? await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'MANAGER', 'SUPPORT', 'PACKER'] } }, orderBy: { name: 'asc' }, select: { id: true, name: true, email: true, role: true, totpEnabledAt: true } })
    : [];
  return JSON.parse(JSON.stringify({
    me: { id: ctx.user.id, email: ctx.user.email, enabledAt: me?.totpEnabledAt ?? null, backupLeft: me?.totpBackupCodes ? JSON.parse(me.totpBackupCodes).length : 0 },
    staff: staff.map((s: any) => ({ ...s, roleName: isStaffRole(s.role) ? ROLE_LABELS[s.role as StaffRole].name : s.role })),
    canManage: ctx.can('staff.manage'),
  }));
}

/** Step 1: a new secret to scan. Not active until a code from the app is confirmed. */
export async function startTwoStepSetupAction() {
  const ctx = await verifiedStaff();
  const secret = newTotpSecret();
  await prisma.user.update({ where: { id: ctx.user.id }, data: { totpSecret: encryptSecret(secret), totpEnabledAt: null, totpBackupCodes: null } });
  return { secret, url: otpauthUrl(secret, ctx.user.email) };
}

/** Step 2: the first code proves the app is set up; then two-step is on. */
export async function confirmTwoStepAction(code: string) {
  const ctx = await verifiedStaff();
  const u = await prisma.user.findUnique({ where: { id: ctx.user.id }, select: { totpSecret: true } });
  if (!u?.totpSecret) return { error: 'Start the setup again.' };
  if (!verifyTotp(decryptSecret(u.totpSecret), code)) return { error: "That code didn't match. Check the time on your phone and try the newest code." };
  const codes = newBackupCodes();
  await prisma.user.update({ where: { id: ctx.user.id }, data: { totpEnabledAt: new Date(), totpBackupCodes: JSON.stringify(codes.map(hashCode)) } });
  await setVerifiedCookie(ctx.user.id);
  await audit({ action: 'security.2fa_on', entity: 'User', entityId: ctx.user.id, summary: 'Turned on two-step login' });
  revalidatePath('/admin/security');
  return { success: true, backupCodes: codes };
}

export async function newBackupCodesAction(code: string) {
  const ctx = await verifiedStaff();
  const u = await prisma.user.findUnique({ where: { id: ctx.user.id }, select: { totpSecret: true, totpEnabledAt: true } });
  if (!u?.totpSecret || !u.totpEnabledAt) return { error: 'Two-step login is off.' };
  if (!verifyTotp(decryptSecret(u.totpSecret), code)) return { error: "That code didn't match." };
  const codes = newBackupCodes();
  await prisma.user.update({ where: { id: ctx.user.id }, data: { totpBackupCodes: JSON.stringify(codes.map(hashCode)) } });
  await audit({ action: 'security.2fa_backup_codes', entity: 'User', entityId: ctx.user.id, summary: 'Made new backup codes' });
  revalidatePath('/admin/security');
  return { success: true, backupCodes: codes };
}

export async function disableTwoStepAction(code: string) {
  const ctx = await verifiedStaff();
  const u = await prisma.user.findUnique({ where: { id: ctx.user.id }, select: { totpSecret: true, totpBackupCodes: true } });
  if (!u?.totpSecret) return { success: true };
  const ok = verifyTotp(decryptSecret(u.totpSecret), code) || useBackupCode(u.totpBackupCodes, code) !== null;
  if (!ok) return { error: "That code didn't match." };
  await prisma.user.update({ where: { id: ctx.user.id }, data: { totpSecret: null, totpEnabledAt: null, totpBackupCodes: null } });
  await audit({ action: 'security.2fa_off', entity: 'User', entityId: ctx.user.id, summary: 'Turned off two-step login' });
  revalidatePath('/admin/security');
  return { success: true };
}

/** Owner: for staff who lost their phone. They sign in with just a password and set it up again. */
export async function resetStaffTwoStepAction(userId: string) {
  const ctx = await verifiedStaff();
  if (!ctx.can('staff.manage')) return { error: 'Only the owner can do this.' };
  const u = await prisma.user.update({ where: { id: userId }, data: { totpSecret: null, totpEnabledAt: null, totpBackupCodes: null }, select: { email: true } });
  await audit({ action: 'security.2fa_reset', entity: 'User', entityId: userId, summary: `Reset two-step login for ${u.email}` });
  revalidatePath('/admin/security');
  return { success: true };
}

/** The check at /admin-verify after signing in. Locks for 15 minutes after 5 wrong codes. */
export async function verifyTwoStepAction(code: string) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: 'Please sign in again.' };
  const u = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true, totpSecret: true, totpEnabledAt: true, totpBackupCodes: true } });
  if (!u || !isStaffRole(u.role) || !u.totpEnabledAt || !u.totpSecret) return { success: true };
  const actor = actorOf(u.role, u.email);

  const fails = await prisma.auditLog.count({ where: { action: 'auth.2fa_failed', entityId: u.id, createdAt: { gte: new Date(Date.now() - FAIL_WINDOW_MS) } } });
  if (fails >= MAX_FAILS) return { error: 'Too many wrong codes. Wait 15 minutes and try again.' };

  const clean = code.replace(/\s/g, '');
  let ok = false;
  try {
    ok = /^\d{6}$/.test(clean) && verifyTotp(decryptSecret(u.totpSecret), clean);
  } catch (e) {
    console.error('[2FA] Could not read the stored secret (AUTH_SECRET changed?)', e); // backup codes still work
  }
  let usedBackup = false;
  if (!ok) {
    const left = useBackupCode(u.totpBackupCodes, clean);
    if (left) {
      await prisma.user.update({ where: { id: u.id }, data: { totpBackupCodes: JSON.stringify(left) } });
      ok = true;
      usedBackup = true;
    }
  }
  if (!ok) {
    await audit({ action: 'auth.2fa_failed', entity: 'User', entityId: u.id, summary: 'Wrong two-step code', actor });
    return { error: `That code didn't match. ${Math.max(0, MAX_FAILS - fails - 1)} tries left.` };
  }
  await setVerifiedCookie(u.id);
  await audit({ action: 'auth.2fa_verified', entity: 'User', entityId: u.id, summary: usedBackup ? 'Signed in with a backup code' : 'Passed two-step check', actor });
  return { success: true };
}
