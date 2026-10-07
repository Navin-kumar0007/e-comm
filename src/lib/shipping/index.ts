import { manualProvider } from "./manual";
import { xpressbeesProvider } from "./xpressbees";
import { shiprocketProvider } from "./shiprocket";
import type { ShippingProvider } from "./types";

// Register new delivery partners here.
const PROVIDERS: ShippingProvider[] = [manualProvider, shiprocketProvider, xpressbeesProvider];

export function getProvider(id: string | null | undefined): ShippingProvider | null {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

/** Provider chosen in Settings, falling back to Manual if it isn't configured. */
export function getActiveProvider(settingId: string | null | undefined): ShippingProvider {
  const p = getProvider(settingId);
  return p && p.isConfigured() ? p : manualProvider;
}

export function listProviders() {
  return PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    configured: p.isConfigured(),
    capabilities: p.capabilities,
  }));
}

export { manualProvider };
export * from "./types";
export * from "./status";
