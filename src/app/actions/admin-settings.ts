'use server'

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/store-settings';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export async function getAdminSettings() {
  await requireAdmin();
  return getStoreSettings();
}

export async function updateAdminSettingsAction(data: {
  storeName?: string;
  contactEmail?: string;
  storeDescription?: string;
  freeShippingThreshold?: number;
  flatShippingRate?: number;
  gstRate?: number;
  gstin?: string | null;
  legalName?: string | null;
  businessAddress?: string | null;
  businessState?: string | null;
  invoicePrefix?: string;
}) {
  await requireAdmin();

  if (data.gstin) {
    data.gstin = data.gstin.trim().toUpperCase();
    if (!GSTIN_RE.test(data.gstin)) return { error: 'Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)' };
  }
  if (data.invoicePrefix !== undefined) {
    data.invoicePrefix = data.invoicePrefix.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10) || DEFAULT_STORE_SETTINGS.invoicePrefix;
  }
  for (const n of [data.freeShippingThreshold, data.flatShippingRate, data.gstRate]) {
    if (n !== undefined && (!Number.isFinite(n) || n < 0)) return { error: 'Amounts must be zero or more' };
  }
  const existing = await prisma.settings.findFirst();
  const id = existing ? existing.id : "default";

  const updated = await prisma.settings.upsert({
    where: { id },
    update: data,
    create: {
      id,
      storeName: data.storeName || "Spicy Nuts",
      contactEmail: data.contactEmail || 'spicynuts1973@gmail.com',
      storeDescription: data.storeDescription || 'Pure, Natural, Organic Indian Groceries',
      freeShippingThreshold: data.freeShippingThreshold ?? 999,
      flatShippingRate: data.flatShippingRate ?? 50,
      gstRate: data.gstRate ?? 5,
      currency: 'INR',
      gstin: data.gstin ?? null,
      legalName: data.legalName ?? null,
      businessAddress: data.businessAddress ?? null,
      businessState: data.businessState ?? null,
      invoicePrefix: data.invoicePrefix ?? DEFAULT_STORE_SETTINGS.invoicePrefix,
    }
  });

  revalidatePath('/admin/settings');
  return updated;
}
