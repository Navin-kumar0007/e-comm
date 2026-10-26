import { BRAND_PHONE_TEL } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";

const siteUrl = SITE_URL;

/** Store details for search engines (schema.org), used by the site layout and the homepage. */
export const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Spicy Nuts",
  alternateName: "B.M.V. Spices & Dry Fruits",
  description: "Premium dry fruits, whole spices, Mamra almonds, Kashmiri walnuts, and handcrafted masalas. Online store delivering across India.",
  url: siteUrl,
  telephone: BRAND_PHONE_TEL,
  email: "spicynuts1973@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Shop No 1/206/1, Bhaskar Nagar Chitguppa",
    addressLocality: "Chitgoppa, Bidar",
    addressRegion: "Karnataka",
    postalCode: "585412",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "17.718",
    longitude: "77.091",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "10:00",
      closes: "18:00",
    },
  ],
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: "Cash, UPI, Credit Card, Debit Card, Net Banking",
  taxID: "29FCBPM9871D1Z6",
  sameAs: [],
};
