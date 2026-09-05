'use server'

import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export async function getAdminCustomers() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    include: {
      orders: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return users.map(u => {
    const userOrders = u.orders || [];
    const spent = userOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      orders: userOrders.length,
      spent: spent,
      status: u.role === 'ADMIN' ? 'Admin' : 'Active'
    };
  });
}
