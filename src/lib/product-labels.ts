/**
 * Jar label artwork exported from the label designs (public/labels).
 * `front` is the front panel without the net-weight band; `full` is the whole wrap.
 */

export type ProductLabel = { key: string; front: string; full: string; band: string; band1: string; gold: string; deep: string };

const PALETTE: Record<string, { band: string; band1: string; gold: string; deep: string }> = {
  almond: { band: "#5A2C14", band1: "#8A4B26", gold: "#E9C987", deep: "#6A3416" },
  anjir: { band: "#45172A", band1: "#76323F", gold: "#EBCB8A", deep: "#5A2433" },
  apricot: { band: "#7A3A0C", band1: "#B8641E", gold: "#F0D49A", deep: "#9A4F14" },
  badam: { band: "#5C2D14", band1: "#8F4E28", gold: "#E9C987", deep: "#6E3818" },
  blackkishmish: { band: "#2A0F20", band1: "#52263F", gold: "#EBCB8A", deep: "#3A1A2E" },
  breakfast: { band: "#6A2A0A", band1: "#A5521C", gold: "#F0D49A", deep: "#8A3C12" },
  cashew: { band: "#6E4F14", band1: "#A07626", gold: "#F0D49A", deep: "#7A5418" },
  chana: { band: "#5E3808", band1: "#9A6420", gold: "#F0D49A", deep: "#7A4A14" },
  chia: { band: "#26323A", band1: "#4A5A5E", gold: "#E2CF9A", deep: "#2F3B40" },
  dates: { band: "#3E150C", band1: "#6E2E1A", gold: "#E9C987", deep: "#5A1F10" },
  drydates: { band: "#45180A", band1: "#7A3A1E", gold: "#E9C987", deep: "#5E2A14" },
  flax: { band: "#553208", band1: "#8A5A22", gold: "#E9C987", deep: "#6B4214" },
  goldenraisins: { band: "#6E4608", band1: "#A87420", gold: "#F0D49A", deep: "#8A5A10" },
  gondh: { band: "#4E4220", band1: "#8A7A44", gold: "#E9D08F", deep: "#6A5A2E" },
  greenraisins: { band: "#3E440C", band1: "#6E7624", gold: "#E6D49A", deep: "#4E5414" },
  kaju: { band: "#6A4A12", band1: "#9C7424", gold: "#F0D49A", deep: "#7A5418" },
  kharbuj: { band: "#6E4418", band1: "#B47A3A", gold: "#F0D49A", deep: "#8A5A2A" },
  kishmish: { band: "#47440C", band1: "#7C7A26", gold: "#E9D08F", deep: "#5E5A16" },
  kiwi: { band: "#33500A", band1: "#6A8E22", gold: "#E6D49A", deep: "#4A6A14" },
  makhana: { band: "#5A1E36", band1: "#8C3A5A", gold: "#EBCB8A", deep: "#7A2E48" },
  mishri: { band: "#22394A", band1: "#3F6274", gold: "#E2CF9A", deep: "#2E4A5A" },
  munakka: { band: "#40101F", band1: "#74263E", gold: "#EBCB8A", deep: "#5A1A2E" },
  panchmewa: { band: "#4A0F1D", band1: "#8A2236", gold: "#EBCB80", deep: "#6E1A2C" },
  pistachio: { band: "#34481A", band1: "#5E7A2A", gold: "#E6D49A", deep: "#3F5A1E" },
  pistachios: { band: "#38501A", band1: "#64822C", gold: "#E6D49A", deep: "#46621E" },
  pumpkin: { band: "#2E4614", band1: "#557A2A", gold: "#E6D49A", deep: "#3A5A1E" },
  sabja: { band: "#1C2622", band1: "#3A4A44", gold: "#E2CF9A", deep: "#24302C" },
  sonora: { band: "#4E2412", band1: "#7E4428", gold: "#E9C987", deep: "#5E2E1A" },
  sunflower: { band: "#5A4808", band1: "#9A7E1A", gold: "#EFD98E", deep: "#6E5A10" },
  tarbuj: { band: "#5A1A14", band1: "#8E3A2E", gold: "#EBCB8A", deep: "#6E2A22" },
  walnut: { band: "#3E2614", band1: "#6B4428", gold: "#E9C987", deep: "#4A2E1C" },
  wholecashew: { band: "#5E4614", band1: "#8E6E2E", gold: "#EBD29A", deep: "#6E5420" },
  yellowdates: { band: "#5E3E0A", band1: "#9A6E20", gold: "#EBCF8E", deep: "#7A5214" },
};

const BY_SLUG: Record<string, string> = {
  "anjir-figs": "anjir",
  "apricot": "apricot",
  "badam-almonds": "badam",
  "black-dry-dates": "dates",
  "black-resins-kishmish": "blackkishmish",
  "california-almond": "almond",
  "chia-seeds": "chia",
  "dhaga-mishri": "mishri",
  "dry-dates": "drydates",
  "dry-fruits-mix-breakfast": "breakfast",
  "flaxseed": "flax",
  "golden-raisins": "goldenraisins",
  "gondh-katira": "gondh",
  "green-pumpkin-seeds": "pumpkin",
  "green-raisins": "greenraisins",
  "kaju-cashews": "kaju",
  "kharbuj-seeds-muskmelon": "kharbuj",
  "kishmish-raisins": "kishmish",
  "kiwi-dried": "kiwi",
  "makhana-fox-nuts": "makhana",
  "munakka": "munakka",
  "panch-mewa-mix": "panchmewa",
  "pistachios": "pistachios",
  "premium-cashew-w180": "cashew",
  "roasted-chana": "chana",
  "sabja-seeds": "sabja",
  "salted-pistachios": "pistachio",
  "sonora-almond": "sonora",
  "sunflower-seeds": "sunflower",
  "tarbuj-seeds-watermelon": "tarbuj",
  "walnut": "walnut",
  "whole-cashew-regular": "wholecashew",
  "yellow-dates": "yellowdates",
};

export function getProductLabel(slug: string): ProductLabel | null {
  const key = BY_SLUG[slug];
  if (!key) return null;
  return { key, front: `/labels/${key}-front.webp`, full: `/labels/${key}.webp`, ...PALETTE[key] };
}
