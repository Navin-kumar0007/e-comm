// Pure helpers (no database) — unit-testable.

export interface WeightSettings {
  defaultPackageWeightGrams: number;
}

/** "150g", "1 kg", "500 gm", "1.5KG" → grams. */
export function parseWeightGrams(weight: string | null | undefined): number | null {
  if (!weight) return null;
  const m = weight.toLowerCase().replace(/\s+/g, "").match(/^([\d.]+)(kg|kgs|g|gm|gms|grams?)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(m[2]?.startsWith("k") ? n * 1000 : n);
}

/** Packed weight estimate: product weights + 15% packaging, never below the default box weight. */
export function estimateOrderWeight(
  items: Array<{ quantity: number; weight: string; product?: { shippingWeightGrams?: number | null; weight?: string | null } | null }>,
  settings: WeightSettings
) {
  const net = items.reduce((sum, i) => {
    // The order line's own size first (pack sizes differ from the product's default size).
    const per = parseWeightGrams(i.weight) ?? i.product?.shippingWeightGrams ?? parseWeightGrams(i.product?.weight) ?? 250;
    return sum + per * i.quantity;
  }, 0);
  return Math.max(settings.defaultPackageWeightGrams, Math.round(net * 1.15));
}

