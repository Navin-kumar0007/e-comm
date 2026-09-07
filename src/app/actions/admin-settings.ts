'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';

export async function getAdminSettings() {
  await requireAdmin();
  const settings = await prisma.settings.findFirst();
  if (!settings) {
    // Return default properties if not seeded
    return {
      storeName: "Nutty World",
      contactEmail: 'support@nuttyworld.com',
      storeDescription: 'Pure, Natural, Organic Indian Groceries',
      freeShippingThreshold: 999,
      flatShippingRate: 50,
      gstRate: 5,
      currency: 'INR',
    };
  }
  return settings;
}

export async function updateAdminSettingsAction(data: {
  storeName?: string;
  contactEmail?: string;
  storeDescription?: string;
  freeShippingThreshold?: number;
  flatShippingRate?: number;
  gstRate?: number;
}) {
  await requireAdmin();
  const existing = await prisma.settings.findFirst();
  const id = existing ? existing.id : "default";

  const updated = await prisma.settings.upsert({
    where: { id },
    update: data,
    create: {
      id,
      storeName: data.storeName || "Nutty World",
      contactEmail: data.contactEmail || 'support@nuttyworld.com',
      storeDescription: data.storeDescription || 'Pure, Natural, Organic Indian Groceries',
      freeShippingThreshold: data.freeShippingThreshold ?? 999,
      flatShippingRate: data.flatShippingRate ?? 50,
      gstRate: data.gstRate ?? 5,
      currency: 'INR'
    }
  });

  revalidatePath('/admin/settings');
  return updated;
}
