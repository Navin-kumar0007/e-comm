import { prisma } from "@/lib/db/prisma";

export const DEFAULT_STORE_SETTINGS = {
  storeName: "Spicy Nuts",
  contactEmail: "spicynuts1973@gmail.com",
  storeDescription: "Pure, Natural, Organic Indian Groceries",
  freeShippingThreshold: 999,
  flatShippingRate: 50,
  gstRate: 5,
  currency: "INR",
  gstin: null as string | null,
  legalName: null as string | null,
  businessAddress: null as string | null,
  businessState: null as string | null,
  invoicePrefix: "SN",
  shippingProvider: "MANUAL",
  pickupName: null as string | null,
  pickupPhone: null as string | null,
  pickupAddress: null as string | null,
  pickupCity: null as string | null,
  pickupState: null as string | null,
  pickupPincode: null as string | null,
  defaultPackageWeightGrams: 500,
  packageLengthCm: 20,
  packageBreadthCm: 15,
  packageHeightCm: 10,
  codEnabled: true,
  codMaxOrderValue: 5000,
  returnWindowHours: 48,
};

export type StoreSettings = typeof DEFAULT_STORE_SETTINGS;

/** Server-only: store settings with defaults filled in. Not admin-guarded. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const settings = await prisma.settings.findFirst();
  if (!settings) return { ...DEFAULT_STORE_SETTINGS };
  return { ...DEFAULT_STORE_SETTINGS, ...settings };
}
