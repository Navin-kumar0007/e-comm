// Verified catalogue photos in public/products, keyed by product slug.
// Sources and licences are listed in public/products/credits.json.
// An image uploaded through admin always wins over these fallbacks.

export const PRODUCT_PLACEHOLDER = "/placeholder.jpg";

const PRODUCT_PHOTOS = new Set([
  "anjir-figs", "apricot", "badam-almonds", "black-dry-coconut", "black-resins-kishmish",
  "california-almond", "chia-seeds", "dalchini-cinnamon", "dhaga-mishri", "dhaniya-coriander-seeds",
  "dry-dates", "dry-fruits-mix-breakfast", "elaichi-7mm-cardamom", "elaichi-8mm-cardamom", "flaxseed",
  "golden-raisins", "gondh-katira", "green-pumpkin-seeds", "jaipal-nutmeg", "jaivatri-mace",
  "kaju-cashews", "kalimirchi-black-pepper", "kharbuj-seeds-muskmelon", "kishmish-raisins", "kiwi-dried",
  "kolanji-nigella-seeds", "long-clove", "makhana-fox-nuts", "munakka", "panch-mewa-mix",
  "pencil-dalchini", "pistachios", "premium-cashew-w180", "roasted-chana", "sabja-seeds",
  "salted-pistachios", "shahjeera", "sonora-almond", "star-phool-star-anise", "sunflower-seeds",
  "tarbuj-seeds-watermelon", "tej-patta-bay-leaf", "walnut", "whole-cashew-regular",
]);

// For products added later without a photo: closest verified photo by keyword.
const KEYWORD_PHOTOS: [RegExp, string][] = [
  [/almond|badam/, "california-almond"],
  [/cashew|kaju/, "kaju-cashews"],
  [/walnut|akhrot/, "walnut"],
  [/pista/, "pistachios"],
  [/makhana|fox ?nut/, "makhana-fox-nuts"],
  [/anjir|anjeer|fig/, "anjir-figs"],
  [/apricot|khubani/, "apricot"],
  [/munakka/, "munakka"],
  [/golden raisin/, "golden-raisins"],
  [/black (raisin|resin)/, "black-resins-kishmish"],
  [/raisin|kishmish/, "kishmish-raisins"],
  [/date|khajur|chhuhara/, "dry-dates"],
  [/chia/, "chia-seeds"],
  [/flax|alsi/, "flaxseed"],
  [/sabja|basil seed/, "sabja-seeds"],
  [/pumpkin/, "green-pumpkin-seeds"],
  [/sunflower/, "sunflower-seeds"],
  [/watermelon|tarbuj/, "tarbuj-seeds-watermelon"],
  [/melon|kharbuj|magaz/, "kharbuj-seeds-muskmelon"],
  [/chana|chickpea/, "roasted-chana"],
  [/mix|mewa/, "panch-mewa-mix"],
  [/elaichi|cardamom/, "elaichi-8mm-cardamom"],
  [/dalchini|cinnamon/, "dalchini-cinnamon"],
  [/clove|laung|\blong\b/, "long-clove"],
  [/pepper|kalimirchi/, "kalimirchi-black-pepper"],
  [/star anise|star phool/, "star-phool-star-anise"],
  [/nutmeg|jaiphal|jaipal/, "jaipal-nutmeg"],
  [/mace|javitri|jaivatri/, "jaivatri-mace"],
  [/coriander|dhaniya/, "dhaniya-coriander-seeds"],
  [/nigella|kalonji|kolanji/, "kolanji-nigella-seeds"],
  [/shahjeera|shah jeera|black cumin/, "shahjeera"],
  [/bay leaf|tej ?patta/, "tej-patta-bay-leaf"],
  [/coconut|copra|khopra/, "black-dry-coconut"],
];

export function slugifyProductName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Local verified photo for a product, or the branded placeholder. */
export function fallbackProductPhoto(productName: string): string {
  const slug = slugifyProductName(productName || "");
  if (PRODUCT_PHOTOS.has(slug)) return `/products/${slug}.jpg`;
  // No verified photo, and the nearest keyword photo would show the wrong colour.
  if (slug === "green-raisins") return PRODUCT_PLACEHOLDER;
  const name = (productName || "").toLowerCase();
  const match = KEYWORD_PHOTOS.find(([re]) => re.test(name));
  return match ? `/products/${match[1]}.jpg` : PRODUCT_PLACEHOLDER;
}

/** True for stored image values that are empty or a generated placeholder. */
export function isPlaceholderImage(img: unknown): boolean {
  return !img || typeof img !== "string" || img.includes("placehold.co") || img === PRODUCT_PLACEHOLDER;
}
