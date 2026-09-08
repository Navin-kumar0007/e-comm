import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy | Spicy Nuts",
  description: "Shipping policy for Spicy Nuts (B.M.V. Spices & Dry Fruits). Free shipping on orders above ₹999. Delivery across India in 3-7 business days.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-12">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">Shipping Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: September 2026</p>

      <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-sm">

        <h2>1. Processing Time</h2>
        <p>All orders are processed within <strong>1&ndash;2 business days</strong> (Monday to Saturday, excluding public holidays) after receiving your order confirmation. Orders placed after 4:00 PM IST will be processed on the next business day.</p>

        <h2>2. Shipping Rates</h2>
        <table>
          <thead>
            <tr><th>Order Value</th><th>Shipping Charge</th></tr>
          </thead>
          <tbody>
            <tr><td>Above ₹999</td><td><strong>FREE</strong></td></tr>
            <tr><td>Below ₹999</td><td>₹50 (flat rate)</td></tr>
          </tbody>
        </table>

        <h2>3. Delivery Estimates</h2>
        <table>
          <thead>
            <tr><th>Region</th><th>Estimated Delivery</th></tr>
          </thead>
          <tbody>
            <tr><td>Karnataka (local)</td><td>2&ndash;3 business days</td></tr>
            <tr><td>South India (AP, TN, KL, TG)</td><td>3&ndash;5 business days</td></tr>
            <tr><td>North / West / East India</td><td>5&ndash;7 business days</td></tr>
            <tr><td>Remote / North-East areas</td><td>7&ndash;10 business days</td></tr>
          </tbody>
        </table>
        <p>These are estimates and actual delivery times may vary depending on the shipping partner and your location.</p>

        <h2>4. Order Tracking</h2>
        <p>Once your order is shipped, you will receive an email and an in-app notification with a tracking number and link. You can also track your order anytime from your <strong>Account &rarr; Orders</strong> page.</p>

        <h2>5. Shipping Partners</h2>
        <p>We partner with reputed logistics providers including India Post, Delhivery, and BlueDart to ensure safe and timely delivery of your orders.</p>

        <h2>6. Packaging</h2>
        <p>All orders are carefully packed with food-grade packaging materials to preserve freshness. Dry fruits and spices are sealed in airtight pouches. We use eco-friendly packaging materials wherever possible.</p>

        <h2>7. Damaged Goods During Transit</h2>
        <p>If your order arrives damaged or tampered with, please:</p>
        <ol>
          <li>Take photos of the damaged package before opening.</li>
          <li>Email us at <strong>spicynuts1973@gmail.com</strong> within 48 hours of delivery.</li>
          <li>Include your order number and photos in the email.</li>
        </ol>
        <p>We will arrange a free replacement or full refund within 5&ndash;7 business days.</p>

        <h2>8. Undeliverable Orders</h2>
        <p>If an order is returned to us due to an incorrect address or failed delivery attempts, we will contact you to rearrange delivery. Re-shipping charges may apply.</p>

        <h2>9. Cash on Delivery (COD)</h2>
        <p>We offer Cash on Delivery for orders within India. Please keep the exact amount ready at the time of delivery. COD is subject to availability in your area.</p>

        <h2>10. Contact</h2>
        <p>For shipping-related queries, email us at <strong>spicynuts1973@gmail.com</strong>.</p>

      </div>
    </div>
  );
}
