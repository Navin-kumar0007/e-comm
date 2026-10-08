'use server';

import { audit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getStaffContext, requirePermission } from '@/lib/auth-guard';
import { STAFF_ROLES, isStaffRole } from '@/lib/permissions';

export async function getStaff() {
  await requirePermission('staff.manage');
  return prisma.user.findMany({
    where: { role: { in: [...STAFF_ROLES] } },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

/** Give an existing account a staff role, change it, or remove staff access ('USER'). */
export async function setStaffRoleAction(email: string, role: string) {
  await requirePermission('staff.manage');
  const me = await getStaffContext();
  const target = email.trim().toLowerCase();
  if (role !== 'USER' && !isStaffRole(role)) return { error: 'Unknown role' };

  const user = await prisma.user.findUnique({ where: { email: target } });
  if (!user) return { error: 'No account with that email. Ask them to sign up on the store first, then add them here.' };
  if (user.id === me?.user.id) return { error: "You can't change your own role." };
  if (user.role === 'ADMIN' && role !== 'ADMIN') {
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (admins <= 1) return { error: 'There must always be at least one Owner/Admin.' };
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } });
  revalidatePath('/admin/staff');
  await audit({ action: 'staff.role', entity: 'User', entityId: user.id, summary: `Set role of ${target} to ${role}` });
  return { success: true, name: user.name };
}
