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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nuttyworld.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nutty World | Pure, Natural, Organic",
    template: "%s | Nutty World",
  },
  description:
    "Bringing pure, natural, and organic food directly from our trusted farms to your table. Artisanal masalas, pickles, and dry fruits.",
  keywords: [
    "organic food",
    "natural masala",
    "homemade pickles",
    "dry fruits",
    "Nutty World",
  ],
  openGraph: {
    type: "website",
    siteName: "Nutty World",
    title: "Nutty World | Pure, Natural, Organic",
    description:
      "Pure, natural, and organic food directly from our trusted farms to your table.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Nutty World | Pure, Natural, Organic",
    description:
      "Pure, natural, and organic food directly from our trusted farms to your table.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="print:hidden"><PromoBanner /><Navbar /></div><main className="flex-1 print:m-0 print:p-0">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <div className="print:hidden"><Footer /><MobileBottomNav /><AIConcierge /><AccessibilityToolbar /></div><ScrollReveal />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
