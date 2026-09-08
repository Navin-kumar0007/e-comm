import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | Spicy Nuts",
  description: "Terms and Conditions for using the Spicy Nuts website. Read our terms governing purchases, accounts, and use of services.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-12">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">Terms & Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: September 2026</p>

      <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-sm">

        <h2>1. About Us</h2>
        <p>This website is owned and operated by <strong>B.M.V. Spices & Dry Fruits</strong> (trading as &ldquo;Spicy Nuts&rdquo;), a Proprietorship firm registered under the laws of India, with GSTIN 29FCBPM9871D1Z6, having its registered office at Shop No 1/206/1, Bhaskar Nagar Chitguppa, Chitgoppa, Bidar, Karnataka &ndash; 585412.</p>

        <h2>2. Acceptance of Terms</h2>
        <p>By accessing or using our website, creating an account, or placing an order, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.</p>

        <h2>3. Account Registration</h2>
        <ul>
          <li>You must provide accurate and complete information during registration.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You must be at least 18 years of age to create an account.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
        </ul>

        <h2>4. Products & Pricing</h2>
        <ul>
          <li>All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST.</li>
          <li>Product images are for illustration purposes. Actual products may vary slightly in appearance.</li>
          <li>We reserve the right to modify prices without prior notice.</li>
          <li>In case of a pricing error, we will contact you before processing your order.</li>
        </ul>

        <h2>5. Orders & Payment</h2>
        <ul>
          <li>Placing an order constitutes an offer to purchase. We reserve the right to accept or reject any order.</li>
          <li>We accept payments via Razorpay (UPI, Credit/Debit Cards, Net Banking) and Cash on Delivery (COD).</li>
          <li>All online payments are processed securely through Razorpay&apos;s PCI DSS compliant gateway.</li>
          <li>Orders are confirmed only after successful payment (or acceptance of COD).</li>
        </ul>

        <h2>6. Shipping & Delivery</h2>
        <p>Please refer to our <Link href="/shipping-policy" className="text-primary hover:underline">Shipping Policy</Link> for detailed information about delivery times, charges, and procedures.</p>

        <h2>7. Returns & Refunds</h2>
        <p>Please refer to our <Link href="/returns" className="text-primary hover:underline">Returns & Refunds Policy</Link> for detailed information about our return and refund procedures.</p>

        <h2>8. Intellectual Property</h2>
        <p>All content on this website, including but not limited to text, images, logos, product descriptions, recipes, and design, is the property of B.M.V. Spices & Dry Fruits and is protected by Indian copyright and trademark laws. You may not reproduce, distribute, or use any content without our prior written consent.</p>

        <h2>9. User Content</h2>
        <p>By submitting reviews, recipes, or other content on our platform, you grant us a non-exclusive, royalty-free license to use, display, and share that content on our website and marketing materials.</p>

        <h2>10. Limitation of Liability</h2>
        <ul>
          <li>We strive for accuracy but do not guarantee that all product descriptions, nutritional information, or images are error-free.</li>
          <li>Our liability is limited to the value of the product purchased.</li>
          <li>We are not liable for delays caused by shipping partners, natural disasters, or force majeure events.</li>
        </ul>

        <h2>11. Privacy</h2>
        <p>Your use of our website is also governed by our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, which describes how we collect, use, and protect your personal data in compliance with the Digital Personal Data Protection Act, 2023.</p>

        <h2>12. Governing Law & Jurisdiction</h2>
        <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in <strong>Bidar, Karnataka, India</strong>.</p>

        <h2>13. Changes to Terms</h2>
        <p>We reserve the right to modify these Terms & Conditions at any time. Changes will be effective upon posting on this page. Continued use of the website after changes constitutes acceptance of the updated terms.</p>

        <h2>14. Contact</h2>
        <p>For questions about these terms, contact us at:</p>
        <ul>
          <li><strong>Email:</strong> spicynuts1973@gmail.com</li>
          <li><strong>Address:</strong> Shop No 1/206/1, Bhaskar Nagar Chitguppa, Chitgoppa, Bidar, Karnataka &ndash; 585412</li>
        </ul>

      </div>
    </div>
  );
}
