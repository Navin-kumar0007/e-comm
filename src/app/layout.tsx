import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Script from 'next/script';

function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/storefront/Navbar";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { PageTransition } from "@/components/ui/page-transition";
import { PromoBanner } from "@/components/storefront/promo-banner";
import { Footer } from "@/components/storefront/Footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/storefront/auth-provider";
import { AIConcierge } from "@/components/storefront/ai-concierge";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { AccessibilityToolbar } from "@/components/accessibility/accessibility-toolbar";
import { ScrollReveal } from "@/components/scroll-reveal";

// Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spicy-nuts.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Spicy Nuts — Premium Dry Fruits, Nuts & Organic Spices | Buy Online India",
    template: "%s | Spicy Nuts",
  },
  description:
    "Buy premium dry fruits, organic spices, Mamra almonds, Kashmiri walnuts, cashews, pistachios, and handcrafted masalas online. Free shipping above ₹999. From B.M.V. Spices & Dry Fruits, Bidar, Karnataka.",
  keywords: [
    "buy dry fruits online",
    "premium dry fruits India",
    "organic spices online",
    "Mamra almonds",
    "Kashmiri walnuts",
    "cashew nuts online",
    "pistachio online India",
    "organic masala",
    "handmade masala",
    "dry fruits shop near me",
    "dry fruits online store",
    "premium nuts India",
    "cold pressed oils",
    "organic food online",
    "Spicy Nuts",
    "B.M.V. Spices",
    "dry fruits Bidar Karnataka",
    "natural spices India",
    "whole spices online",
    "turmeric powder organic",
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
    "garam masala organic",
  ],
  openGraph: {
    type: "website",
    siteName: "Spicy Nuts",
    title: "Spicy Nuts — Premium Dry Fruits, Nuts & Organic Spices | Buy Online",
    description:
      "Shop premium Mamra almonds, Kashmiri walnuts, organic masalas, and royal dry fruits. Free delivery above ₹999. From trusted farms to your table.",
    url: siteUrl,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spicy Nuts — Premium Dry Fruits & Organic Spices Online",
    description:
      "Premium dry fruits, organic spices & handcrafted masalas. Free shipping above ₹999. Shop now!",
  },
  alternates: {
    canonical: siteUrl,
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Spicy Nuts",
  alternateName: "B.M.V. Spices & Dry Fruits",
  description: "Premium dry fruits, organic spices, Mamra almonds, Kashmiri walnuts, and handcrafted masalas. Online store delivering across India.",
  url: siteUrl,
  telephone: "+91-spicynuts1973",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            disableTransitionOnChange
          >
            <div className="print:hidden"><Navbar /></div><main className="flex-1 pb-16 md:pb-0 print:m-0 print:p-0">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <div className="print:hidden"><Footer /><MobileBottomNav /><AIConcierge /><WhatsAppButton /><AccessibilityToolbar /></div><ScrollReveal />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
