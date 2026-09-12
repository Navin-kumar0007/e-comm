import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Refunds | Spicy Nuts",
  description: "Returns and refund policy for Spicy Nuts. We offer replacements or refunds for damaged or incorrect items within 48 hours of delivery.",
};

export default function ReturnsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 pt-28 pb-10 md:pt-36 md:pb-12">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">Returns & Refunds Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: September 2026</p>

      <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-sm">

        <h2>1. Return Eligibility</h2>
        <p>Due to the perishable and consumable nature of our products (dry fruits, spices, nuts, and organic food items), we follow a strict return policy:</p>
        <ul>
          <li><strong>Damaged items:</strong> If the product arrives damaged, crushed, or in a tampered package — eligible for return/replacement.</li>
          <li><strong>Incorrect items:</strong> If you receive a product different from what you ordered — eligible for return/replacement.</li>
          <li><strong>Quality issues:</strong> If the product quality does not match our standards (stale, foul smell, contamination) — eligible for return/replacement.</li>
          <li><strong>Change of mind:</strong> We do not accept returns for change of mind, wrong quantity ordered, or if the product has been opened and consumed.</li>
        </ul>

        <h2>2. Reporting Timeline</h2>
        <p>You must report any issue within <strong>48 hours of delivery</strong>. Claims made after this window may not be eligible for a refund or replacement.</p>

        <h2>3. How to Request a Return</h2>
        <ol>
          <li>Email us at <strong>spicynuts1973@gmail.com</strong> with your order number.</li>
          <li>Include clear photos of the damaged/incorrect product and packaging.</li>
          <li>Describe the issue briefly.</li>
        </ol>
        <p>Our team will review your request and respond within <strong>24 hours</strong>.</p>

        <h2>4. Replacement vs Refund</h2>
        <ul>
          <li><strong>Replacement:</strong> If the same product is in stock, we will ship a free replacement within 2&ndash;3 business days.</li>
          <li><strong>Refund:</strong> If the product is out of stock or you prefer a refund, we will initiate a full refund to your original payment method.</li>
        </ul>

        <h2>5. Refund Timeline</h2>
        <table>
          <thead>
            <tr><th>Payment Method</th><th>Refund Timeline</th></tr>
          </thead>
          <tbody>
            <tr><td>UPI / Net Banking</td><td>3&ndash;5 business days</td></tr>
            <tr><td>Credit / Debit Card</td><td>5&ndash;7 business days</td></tr>
            <tr><td>Cash on Delivery</td><td>Refund via bank transfer within 7&ndash;10 business days</td></tr>
          </tbody>
        </table>

        <h2>6. Non-Returnable Items</h2>
        <ul>
          <li>Products that have been opened, used, or consumed.</li>
          <li>Custom Blend orders (personalized spice mixes).</li>
          <li>Gift hampers (unless damaged).</li>
          <li>Items reported after the 48-hour window.</li>
        </ul>

        <h2>7. Cancellations</h2>
        <p>You can cancel your order <strong>before it has been shipped</strong> by contacting us via email. Once shipped, cancellation is not possible — you may request a return after delivery instead.</p>

        <h2>8. Contact</h2>
        <p>For all return and refund queries, please contact:</p>
        <ul>
          <li><strong>Email:</strong> spicynuts1973@gmail.com</li>
          <li><strong>Response time:</strong> Within 24 hours</li>
        </ul>

      </div>
    </div>
  );
}
