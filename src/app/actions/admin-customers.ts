'use server'

import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export async function getAdminCustomers() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get total spend per user with a single aggregate query
  const spendData = await prisma.order.groupBy({
    by: ['userId'],
    _sum: { total: true },
    where: { userId: { not: null }, status: { notIn: ['CANCELLED', 'DELETED'] } }
  });
  const spendByUser = new Map(spendData.map(s => [s.userId, s._sum.total || 0]));

  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    orders: u._count.orders,
    spent: spendByUser.get(u.id) || 0,
    status: u.role === 'ADMIN' ? 'Admin' : 'Active'
  }));
}
