import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/storefront/Navbar";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { PromoBanner } from "@/components/storefront/promo-banner";
import { Footer } from "@/components/storefront/Footer";
import { NotOnDocuments, StorefrontOnly } from "@/components/storefront/storefront-only";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/storefront/auth-provider";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { DeferredWidgets } from "@/components/storefront/deferred-widgets";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CookieConsent } from "@/components/storefront/cookie-consent";
import { getSiteContent } from "@/lib/site-content";
import { SITE_URL } from "@/lib/site";
import { storeJsonLd as jsonLd } from "@/lib/store-jsonld";

// Fonts: Manrope for interface and prices, Cormorant Garamond for headings, Cinzel for royal eyebrows
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cormorant",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-cinzel",
});

const siteUrl = SITE_URL;

// Paint the phone's browser bar maroon and let the page reach under the iPhone home bar,
// so the tab bar's safe-area padding works in the installed app.
export const viewport: Viewport = {
  themeColor: "#1a0509",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Name under the icon when added to an iPhone home screen (otherwise the long page title).
  appleWebApp: { capable: true, title: "Spicy Nuts", statusBarStyle: "default" },
  title: {
    default: "Spicy Nuts — Premium Dry Fruits, Nuts & Spices | Buy Online India",
    template: "%s | Spicy Nuts",
  },
  description:
    "Buy premium dry fruits, whole spices, Mamra almonds, Kashmiri walnuts, cashews, pistachios, and handcrafted masalas online. Free shipping above ₹999. From B.M.V. Spices & Dry Fruits, Bidar, Karnataka.",
  keywords: [
    "buy dry fruits online",
    "premium dry fruits India",
    "whole spices online",
    "Mamra almonds",
    "Kashmiri walnuts",
    "cashew nuts online",
    "pistachio online India",
    "handmade masala",
    "dry fruits shop near me",
    "dry fruits online store",
    "premium nuts India",
    "cold pressed oils",
    "Spicy Nuts",
    "B.M.V. Spices",
    "dry fruits Bidar Karnataka",
    "natural spices India",
    "whole spices online",
    "saffron online India",
    "dry fruits gift box",
    "corporate gifting dry fruits",
    "healthy snacks online",
    "sugar free dry fruits",
    "kaju online",
    "badam online",
    "akhrot online",
    "pista online",
    "kishmish online",
    "anjeer online",
    "mixed dry fruits pack",
    "spice box online",
    "masala powder online",
  ],
  openGraph: {
    type: "website",
    siteName: "Spicy Nuts",
    title: "Spicy Nuts — Premium Dry Fruits, Nuts & Spices | Buy Online",
    description:
      "Shop premium Mamra almonds, Kashmiri walnuts, handcrafted masalas, and royal dry fruits. Free delivery above ₹999. Packed fresh in Bidar.",
    url: siteUrl,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spicy Nuts — Premium Dry Fruits & Spices Online",
    description:
      "Premium dry fruits, whole spices & handcrafted masalas. Free shipping above ₹999. Shop now!",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [announcement, popup, contact] = await Promise.all([getSiteContent("announcement"), getSiteContent("popup"), getSiteContent("contact")]);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${manrope.variable} ${cormorant.variable} ${cinzel.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            disableTransitionOnChange
          >
            <StorefrontOnly><div className="print:hidden"><Navbar announcement={announcement} /></div></StorefrontOnly><main className="flex-1 pb-[var(--mobile-chrome-bottom,6rem)] md:pb-0 print:m-0 print:p-0">
              {children}
            </main>
            <StorefrontOnly><div className="print:hidden"><Footer contact={contact} /><MobileBottomNav /><NotOnDocuments><WhatsAppButton /><DeferredWidgets popup={popup} /></NotOnDocuments></div><ScrollReveal /></StorefrontOnly>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
        <StorefrontOnly><CookieConsent gaId={process.env.NEXT_PUBLIC_GA_ID} /></StorefrontOnly>
      </body>
    </html>
  );
}
