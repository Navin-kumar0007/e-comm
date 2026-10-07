// Shopper-facing collections within Dry Fruits & Seeds. Products are matched by
// name keywords, so new products join the right collection without admin setup.

export interface Collection {
  slug: string;
  name: string;
  terms: string[];
  image: string;
}

export const COLLECTIONS: Collection[] = [
  { slug: "almonds", name: "Almonds", terms: ["almond", "badam"], image: "/products/california-almond.jpg" },
  { slug: "cashews", name: "Cashews", terms: ["cashew", "kaju"], image: "/products/kaju-cashews.jpg" },
  { slug: "pistachios", name: "Pistachios", terms: ["pista"], image: "/products/pistachios.jpg" },
  { slug: "walnuts", name: "Walnuts", terms: ["walnut", "akhrot"], image: "/products/walnut.jpg" },
  { slug: "dates", name: "Dates", terms: ["date", "khajur"], image: "/products/dry-dates.jpg" },
  { slug: "raisins", name: "Raisins", terms: ["raisin", "resin", "kishmish", "munakka"], image: "/products/kishmish-raisins.jpg" },
  { slug: "figs-apricots", name: "Figs & Apricots", terms: ["anjir", "fig", "apricot", "kiwi"], image: "/products/anjir-figs.jpg" },
  { slug: "makhana", name: "Makhana", terms: ["makhana", "fox nut"], image: "/products/makhana-fox-nuts.jpg" },
  { slug: "seeds", name: "Seeds", terms: ["seed", "chia", "flax", "sabja"], image: "/products/chia-seeds.jpg" },
  { slug: "mixes", name: "Mixes", terms: ["mix", "mewa"], image: "/products/panch-mewa-mix.jpg" },
];

export function getCollection(slug: string | undefined): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

/** Prisma `where` fragment matching products in a collection by name. */
export function collectionWhere(collection: Collection) {
  return { OR: collection.terms.map((t) => ({ name: { contains: t, mode: "insensitive" as const } })) };
}
