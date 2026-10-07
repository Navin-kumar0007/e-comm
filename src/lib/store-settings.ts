import { prisma } from "@/lib/db/prisma";

export const DEFAULT_STORE_SETTINGS = {
  storeName: "Spicy Nuts",
  contactEmail: "spicynuts1973@gmail.com",
  storeDescription: "Pure, Natural, Organic Indian Groceries",
  freeShippingThreshold: 999,
  flatShippingRate: 50,
  gstRate: 5,
  currency: "INR",
  // Business identity (from the GST registration); editable in Admin → Settings.
  gstin: "29FCBPM9871D1Z6" as string | null,
  legalName: "B.M.V. Spices & Dry Fruits" as string | null,
  businessAddress: "Shop No 1/206/1, Bhaskar Nagar Chitguppa, Chitguppa Sub Post Office, Chitgoppa, Bidar, Karnataka – 585412" as string | null,
  businessState: "Karnataka" as string | null,
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
  fssaiLicense: null as string | null,
  signatoryName: null as string | null,
  invoiceTerms: null as string | null,
};

export type StoreSettings = typeof DEFAULT_STORE_SETTINGS;

/** Server-only: store settings with defaults filled in. Not admin-guarded. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const settings = await prisma.settings.findFirst();
  if (!settings) return { ...DEFAULT_STORE_SETTINGS };
  // Blank saved fields fall back to the defaults (e.g. the business identity).
  const merged: StoreSettings = { ...DEFAULT_STORE_SETTINGS };
  for (const [k, v] of Object.entries(settings)) {
    if (v !== null && v !== undefined && v !== "") (merged as Record<string, unknown>)[k] = v;
  }
  return merged;
}
