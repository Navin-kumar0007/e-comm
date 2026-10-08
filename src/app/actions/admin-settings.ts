'use server'

import { audit } from '@/lib/audit';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth-guard';
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/store-settings';
import { getProvider } from '@/lib/shipping';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export async function getAdminSettings() {
  await requirePermission('settings.manage');
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
  fssaiLicense?: string | null;
  signatoryName?: string | null;
  invoiceTerms?: string | null;
  shippingProvider?: string;
  pickupName?: string | null;
  pickupPhone?: string | null;
  pickupAddress?: string | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;
  defaultPackageWeightGrams?: number;
  packageLengthCm?: number;
  packageBreadthCm?: number;
  packageHeightCm?: number;
  codEnabled?: boolean;
  codMaxOrderValue?: number;
  returnWindowHours?: number;
}) {
  await requirePermission('settings.manage');

  if (data.gstin) {
    data.gstin = data.gstin.trim().toUpperCase();
    if (!GSTIN_RE.test(data.gstin)) return { error: 'Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)' };
  }
  if (data.fssaiLicense) {
    data.fssaiLicense = data.fssaiLicense.replace(/\s+/g, '');
    if (!/^\d{14}$/.test(data.fssaiLicense)) return { error: 'FSSAI licence number must be 14 digits' };
  }
  if (data.invoicePrefix !== undefined) {
    data.invoicePrefix = data.invoicePrefix.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10) || DEFAULT_STORE_SETTINGS.invoicePrefix;
  }
  if (data.pickupPincode && !/^[1-9][0-9]{5}$/.test(data.pickupPincode)) return { error: 'Pickup pincode must be 6 digits' };
  if (data.shippingProvider) {
    const provider = getProvider(data.shippingProvider);
    if (!provider) return { error: 'Unknown delivery partner' };
    if (!provider.isConfigured()) return { error: `${provider.name} needs API credentials in environment variables first.` };
  }
  for (const k of ['defaultPackageWeightGrams', 'packageLengthCm', 'packageBreadthCm', 'packageHeightCm', 'returnWindowHours'] as const) {
    if (data[k] !== undefined) data[k] = Math.round(Number(data[k]));
  }
  for (const n of [data.freeShippingThreshold, data.flatShippingRate, data.gstRate, data.codMaxOrderValue, data.defaultPackageWeightGrams, data.packageLengthCm, data.packageBreadthCm, data.packageHeightCm, data.returnWindowHours]) {
    if (n !== undefined && (!Number.isFinite(n) || n < 0)) return { error: 'Amounts must be zero or more' };
  }
  const existing = await prisma.settings.findFirst();
  const id = existing ? existing.id : "default";

  const updated = await prisma.settings.upsert({
    where: { id },
    update: data,
    create: {
      ...data,
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
  await audit({ action: 'settings.update', entity: 'Settings', entityId: 'default', summary: `Changed store settings: ${Object.keys(data).join(', ')}`.slice(0, 300), data });
  return updated;
}
