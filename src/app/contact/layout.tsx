import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Us — B.M.V. Spices & Dry Fruits, Bidar, Karnataka",
  description: "Get in touch with Spicy Nuts (B.M.V. Spices & Dry Fruits). Visit us at Shop No 1/206/1, Bhaskar Nagar Chitguppa, Bidar, Karnataka 585412. Email: spicynuts1973@gmail.com",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
