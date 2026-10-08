'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth-guard';
import { isValidGstin } from '@/lib/gst';
import { audit } from '@/lib/audit';

const BOOKED = ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'RETURNED', 'RTO'];

export async function getAdminCustomers() {
  await requirePermission('customers.view');
  const users = await prisma.user.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Spend and last order per user with single aggregate queries
  const spendData = await prisma.order.groupBy({
    by: ['userId'],
    _sum: { total: true },
    _max: { createdAt: true },
    where: { userId: { not: null }, status: { in: BOOKED } },
  });
  const spendByUser = new Map(spendData.map((s: any) => [s.userId, s]));

  return users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    city: u.city,
    orders: u._count.orders,
    spent: spendByUser.get(u.id)?._sum.total || 0,
    lastOrder: spendByUser.get(u.id)?._max.createdAt?.toISOString() ?? null,
    joined: u.createdAt.toISOString(),
    status: u.role === 'USER' ? 'Active' : 'Staff',
    customerType: u.customerType,
    businessName: u.businessName,
    gstin: u.gstin,
    wholesaleDiscount: u.wholesaleDiscount,
    address: u.address,
    state: u.state,
    pincode: u.pincode,
  }));
}

export interface BusinessCustomerInput {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  gstin?: string | null;
  wholesaleDiscount?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  customerType: 'RETAIL' | 'WHOLESALE';
}

const clean = (s: unknown, max = 200) => (typeof s === 'string' ? s.trim().slice(0, max) : '') || null;

/** Shop / wholesale buyer details: GSTIN on their invoices and their usual discount on manual orders. */
export async function saveBusinessCustomerAction(input: BusinessCustomerInput) {
  await requirePermission('orders.create');
  const name = clean(input.name, 100);
  const email = clean(input.email, 120)?.toLowerCase() ?? null;
  if (!name) return { error: 'Enter the contact name.' };
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email (used to match their orders).' };
  const gstin = clean(input.gstin, 15)?.toUpperCase() ?? null;
  if (gstin && !isValidGstin(gstin)) return { error: 'GSTIN should be 15 characters, like 29ABCDE1234F1Z5.' };
  const discount = input.wholesaleDiscount === null || input.wholesaleDiscount === undefined || Number.isNaN(Number(input.wholesaleDiscount)) ? null : Number(input.wholesaleDiscount);
  if (discount !== null && (discount < 0 || discount > 60)) return { error: 'Discount should be between 0 and 60%.' };
  const pincode = clean(input.pincode, 6);
  if (pincode && !/^\d{6}$/.test(pincode)) return { error: 'Pincode is 6 digits.' };
  const data = {
    name, phone: clean(input.phone, 15), businessName: clean(input.businessName, 120), gstin, wholesaleDiscount: discount,
    address: clean(input.address, 300), city: clean(input.city, 60), state: clean(input.state, 40), pincode,
    customerType: input.customerType === 'WHOLESALE' ? 'WHOLESALE' : 'RETAIL',
  };

  let id = input.id;
  if (id) {
    await prisma.user.update({ where: { id }, data });
  } else {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data });
      id = existing.id;
    } else {
      // An account without a password: they can't sign in until they reset it, but orders and invoices work.
      id = (await prisma.user.create({ data: { ...data, email, role: 'USER', provider: 'admin' } })).id;
    }
  }
  await audit({ action: 'customer.business', entity: 'User', entityId: id, summary: `${data.customerType === 'WHOLESALE' ? 'Wholesale' : 'Retail'} customer ${data.businessName ?? name}${gstin ? ` (${gstin})` : ''}${discount ? `, ${discount}% off` : ''}` });
  revalidatePath('/admin/customers');
  return { success: true, id };
}

/** Wholesale buyers for the manual order form. */
export async function getWholesaleCustomers() {
  await requirePermission('orders.create');
  const rows = await prisma.user.findMany({
    where: { customerType: 'WHOLESALE' },
    orderBy: [{ businessName: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, email: true, phone: true, businessName: true, gstin: true, wholesaleDiscount: true, address: true, city: true, state: true, pincode: true },
  });
  return rows;
}
