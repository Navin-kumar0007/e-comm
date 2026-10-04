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
};

export type StoreSettings = typeof DEFAULT_STORE_SETTINGS;

/** Server-only: store settings with defaults filled in. Not admin-guarded. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const settings = await prisma.settings.findFirst();
  if (!settings) return { ...DEFAULT_STORE_SETTINGS };
  return { ...DEFAULT_STORE_SETTINGS, ...settings };
}
