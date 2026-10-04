// Single source of truth for custom spice blend ingredients and pricing.
// Imported by the spice mixer UI (for display) and by checkout (authoritative price).

export const BASES = [
  { id: 'turmeric', name: 'Golden Turmeric', hex: '#EAB308', rate: 2.5 },
  { id: 'coriander', name: 'Roasted Coriander', hex: '#B45309', rate: 2.0 },
  { id: 'cumin', name: 'Earthy Cumin', hex: '#57534E', rate: 3.0 },
  { id: 'fennel', name: 'Fennel Seed', hex: '#A3E635', rate: 2.8 },
  { id: 'mustard', name: 'Black Mustard', hex: '#3F3F46', rate: 3.2 },
];

export const HEATS = [
  { id: 'mild', name: 'Mild Paprika', hex: '#F87171', rate: 3.0 },
  { id: 'medium', name: 'Kashmiri Chili', hex: '#DC2626', rate: 3.5 },
  { id: 'hot', name: 'Guntur Chili', hex: '#991B1B', rate: 4.0 },
  { id: 'ghost', name: 'Ghost Pepper', hex: '#EA580C', rate: 5.5 },
  { id: 'pepper', name: 'Black Pepper', hex: '#18181B', rate: 3.8 },
];

export const AROMATICS = [
  { id: 'cardamom', name: 'Green Cardamom', hex: '#86EFAC', rate: 5.0 },
  { id: 'clove', name: 'Rich Clove', hex: '#292524', rate: 6.0 },
  { id: 'cinnamon', name: 'Sweet Cinnamon', hex: '#9A3412', rate: 4.5 },
  { id: 'anise', name: 'Star Anise', hex: '#78350F', rate: 5.8 },
  { id: 'nutmeg', name: 'Royal Nutmeg', hex: '#7C2D12', rate: 6.2 },
];

export const BLEND_MIN_PRICE = 249; // packaging baseline floor
export const BLEND_WEIGHT = '150g';

export interface BlendSpec {
  blendName: string;
  base: string;
  heat: string;
  aromatic: string;
  basePct: number;
  heatPct: number;
  aromaticPct: number;
}

export function calculateBlendPrice(spec: Pick<BlendSpec, 'base' | 'heat' | 'aromatic' | 'basePct' | 'heatPct' | 'aromaticPct'>) {
  const base = BASES.find(b => b.id === spec.base);
  const heat = HEATS.find(h => h.id === spec.heat);
  const aromatic = AROMATICS.find(a => a.id === spec.aromatic);
  if (!base || !heat || !aromatic) return null;
  const raw = Math.round(spec.basePct * base.rate + spec.heatPct * heat.rate + spec.aromaticPct * aromatic.rate);
  return Math.max(BLEND_MIN_PRICE, raw);
}

export function blendDisplayName(spec: BlendSpec) {
  const base = BASES.find(b => b.id === spec.base)!;
  const heat = HEATS.find(h => h.id === spec.heat)!;
  const aromatic = AROMATICS.find(a => a.id === spec.aromatic)!;
  return `Custom Blend: ${spec.blendName} (${spec.basePct}% ${base.name} / ${spec.heatPct}% ${heat.name} / ${spec.aromaticPct}% ${aromatic.name})`;
}

/**
 * Validates an untrusted blend spec from the client. Returns a clean spec and
 * its server-computed price, or null if anything is off.
 */
export function parseBlendSpec(input: unknown): { spec: BlendSpec; price: number } | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const pcts = [raw.basePct, raw.heatPct, raw.aromaticPct];
  if (!pcts.every(p => Number.isInteger(p) && (p as number) >= 0 && (p as number) <= 100)) return null;
  if ((pcts as number[]).reduce((a, b) => a + b, 0) !== 100) return null;

  const blendName = typeof raw.blendName === 'string'
    ? raw.blendName.replace(/[^\p{L}\p{N} '&-]/gu, '').trim().slice(0, 40)
    : '';
  if (!blendName) return null;

  const spec: BlendSpec = {
    blendName,
    base: String(raw.base),
    heat: String(raw.heat),
    aromatic: String(raw.aromatic),
    basePct: raw.basePct as number,
    heatPct: raw.heatPct as number,
    aromaticPct: raw.aromaticPct as number,
  };
  const price = calculateBlendPrice(spec);
  if (price === null) return null;
  return { spec, price };
}
