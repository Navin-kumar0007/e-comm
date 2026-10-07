import { Metadata } from "next";
import { PageHero } from "@/components/storefront/royal/page-hero";

export const metadata: Metadata = {
  title: "Terms & Conditions | Spicy Nuts",
};

export default function TermsConditions() {
  return (
    <>
      <PageHero eyebrow={"Policy"} title={"Terms & Conditions"} crumbs={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]} />
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-10">
      <div className="prose prose-sm sm:prose-base prose-amber dark:prose-invert">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
        <p>Welcome to Spicy Nuts (operated by B.M.V. SPICES & DRY FRUITS).</p>
        
        <h3>1. General Terms</h3>
        <p>By accessing our website and placing an order, you agree to be bound by these terms. We reserve the right to refuse service to anyone for any reason at any time.</p>

        <h3>2. Product Information</h3>
        <p>We make every effort to display the colors and images of our products accurately. However, natural products (spices and dry fruits) may vary in appearance, size, and color from batch to batch.</p>

        <h3>3. Pricing & Payments</h3>
        <p>All prices are in INR and are inclusive of GST. We reserve the right to modify prices without prior notice. Payments are securely processed via authorized payment gateways.</p>

        <h3>4. Limitation of Liability</h3>
        <p>Spicy Nuts shall not be liable for any special or consequential damages that result from the use of, or the inability to use, the materials on this site or the performance of the products.</p>

        <h3>5. Governing Law</h3>
        <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in Bidar, Karnataka.</p>
      </div>
    </div>
    </>
  );
}
