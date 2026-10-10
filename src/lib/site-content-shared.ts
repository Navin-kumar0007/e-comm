// Website-editor content: types, section list and defaults. No database imports, so client
// components (the editor, the announcement bar) can use it.

import { BRAND_EMAIL, BRAND_PHONE_DISPLAY } from "@/lib/contact";

export interface AnnouncementMsg { text: string; link?: string; linkText?: string }
export interface Banner { id: string; image: string; mobileImage?: string; link?: string; alt: string; startsAt?: string; endsAt?: string; enabled: boolean }

export const HOME_SECTIONS = [
  { key: "collections", label: "Collections carousel" },
  { key: "shelf", label: "Bestsellers shelf" },
  { key: "gifts", label: "Gift tray builder" },
  { key: "atelier", label: "Uses & spice atelier" },
  { key: "founder", label: "Founder story" },
  { key: "trust", label: "Trust strip (shipping, GST, quality)" },
] as const;
export type HomeSectionKey = (typeof HOME_SECTIONS)[number]["key"];

export const CONTENT_DEFAULTS = {
  announcement: {
    enabled: true,
    messages: [
      { text: "FREE SHIPPING ABOVE ₹999" },
      { text: "CODE ROYAL15 · 15% OFF", link: "/shop", linkText: "Shop" },
      { text: "GST INVOICE WITH EVERY ORDER" },
    ] as AnnouncementMsg[],
  },
  hero: {
    eyebrow: "From Bidar, Karnataka",
    title: "The Royal Pantry",
    subtitle: "Almonds, cashews, walnuts, pistachios, dates, raisins and seeds, packed for gifting and for everyday.",
    primaryText: "Shop the pantry",
    primaryLink: "/shop",
    secondaryText: "Build a gift tray",
    secondaryLink: "#gift",
  },
  banners: [] as Banner[],
  sections: { order: HOME_SECTIONS.map((s) => s.key) as HomeSectionKey[], hidden: [] as HomeSectionKey[] },
  popup: {
    enabled: true,
    title: "Get 10% OFF on WhatsApp",
    text: "Receive secret harvest deals & your instant welcome code.",
    delaySeconds: 8,
  },
  contact: {
    phone: BRAND_PHONE_DISPLAY,
    email: BRAND_EMAIL,
    address: "Shop No 1/206/1, Bhaskar Nagar Chitguppa, Chitguppa Sub Post Office, Chitgoppa, Bidar, Karnataka – 585412",
    tagline: "Purveyors of Imperial Dry Fruits, Royal Nuts, and Rare Whole Spices sourced directly from single-estate farms.",
    instagram: "",
    youtube: "",
    facebook: "",
  },
  seo: {
    homeTitle: "Spicy Nuts — Premium Dry Fruits, Nuts & Organic Spices | Buy Online India",
    homeDescription: "Buy premium dry fruits, organic spices, Mamra almonds, Kashmiri walnuts, cashews, pistachios, and handcrafted masalas online. Free shipping above ₹999. From B.M.V. Spices & Dry Fruits, Bidar, Karnataka.",
  },
  policies: { privacy: "", terms: "", shipping: "", returns: "" },
};

export type ContentKey = keyof typeof CONTENT_DEFAULTS;
export type ContentOf<K extends ContentKey> = (typeof CONTENT_DEFAULTS)[K];
export const CONTENT_KEYS = Object.keys(CONTENT_DEFAULTS) as ContentKey[];

