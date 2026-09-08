import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Spicy Nuts",
  description: "Privacy Policy of B.M.V. Spices & Dry Fruits (Spicy Nuts). Learn how we collect, use, and protect your personal data in compliance with the Digital Personal Data Protection Act, 2023.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-12">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: September 2026</p>

      <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-sm">

        <h2>1. Data Fiduciary Information</h2>
        <p>This website is operated by <strong>B.M.V. Spices & Dry Fruits</strong> (trading as &ldquo;Spicy Nuts&rdquo;), a Proprietorship registered under the laws of India.</p>
        <ul>
          <li><strong>GSTIN:</strong> 29FCBPM9871D1Z6</li>
          <li><strong>Registered Address:</strong> Shop No 1/206/1, Bhaskar Nagar Chitguppa, Chitguppa Sub Post Office, Chitgoppa, Bidar, Karnataka &ndash; 585412</li>
          <li><strong>Email:</strong> spicynuts1973@gmail.com</li>
        </ul>

        <h2>2. Information We Collect</h2>
        <p>We collect information you provide directly when you:</p>
        <ul>
          <li><strong>Create an account:</strong> Name, email address, and password (hashed).</li>
          <li><strong>Place an order:</strong> Shipping address, phone number, billing address, and payment information.</li>
          <li><strong>Contact us:</strong> Name, email, and the contents of your message.</li>
          <li><strong>Subscribe to newsletter:</strong> Email address.</li>
        </ul>
        <p>We also automatically collect:</p>
        <ul>
          <li><strong>Device information:</strong> Browser type, operating system, and screen size.</li>
          <li><strong>Usage data:</strong> Pages visited, time spent, and referral source.</li>
          <li><strong>Cookies:</strong> Session cookies for authentication and preferences.</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li><strong>Order Fulfillment:</strong> Processing your payment, arranging shipping, sending order confirmations and updates.</li>
          <li><strong>Account Management:</strong> Maintaining your account, loyalty points, and order history.</li>
          <li><strong>Customer Support:</strong> Responding to your inquiries and resolving issues.</li>
          <li><strong>Marketing:</strong> Sending promotional emails (only with your consent; you can unsubscribe at any time).</li>
          <li><strong>Legal Compliance:</strong> Meeting GST, tax, and regulatory requirements.</li>
        </ul>

        <h2>4. Data Sharing & Third-Party Services</h2>
        <p>We do not sell your personal data. We share data only with the following service providers who help us operate our business:</p>
        <ul>
          <li><strong>Razorpay</strong> &ndash; Payment processing (PCI DSS compliant)</li>
          <li><strong>Resend</strong> &ndash; Transactional email delivery</li>
          <li><strong>Cloudinary</strong> &ndash; Product image hosting</li>
          <li><strong>Vercel</strong> &ndash; Website hosting</li>
          <li><strong>Neon (PostgreSQL)</strong> &ndash; Database hosting</li>
        </ul>

        <h2>5. Data Retention</h2>
        <ul>
          <li><strong>Account data:</strong> Retained as long as your account is active. You may request deletion at any time.</li>
          <li><strong>Order records:</strong> Retained for 8 years as required by Indian tax and GST regulations.</li>
          <li><strong>Contact messages:</strong> Retained for 1 year, then automatically deleted.</li>
          <li><strong>Cookies:</strong> Session cookies expire when you close your browser. Analytics cookies expire after 30 days.</li>
        </ul>

        <h2>6. Your Rights Under DPDP Act, 2023</h2>
        <p>Under the Digital Personal Data Protection Act, 2023, you have the right to:</p>
        <ul>
          <li><strong>Access:</strong> Request a summary of your personal data we hold.</li>
          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
          <li><strong>Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
          <li><strong>Withdraw Consent:</strong> Withdraw your consent for data processing at any time.</li>
          <li><strong>Grievance Redressal:</strong> File a complaint about data handling practices.</li>
          <li><strong>Nominate:</strong> Nominate a person to exercise your data rights in case of death or incapacity.</li>
        </ul>

        <h2>7. Grievance Officer</h2>
        <p>For any data protection concerns, grievances, or to exercise your rights, contact our Grievance Officer:</p>
        <ul>
          <li><strong>Name:</strong> Mahesh</li>
          <li><strong>Email:</strong> spicynuts1973@gmail.com</li>
          <li><strong>Address:</strong> Shop No 1/206/1, Bhaskar Nagar Chitguppa, Chitgoppa, Bidar, Karnataka &ndash; 585412</li>
        </ul>
        <p>We will acknowledge your request within 48 hours and resolve it within 30 days.</p>

        <h2>8. Data Security</h2>
        <p>We implement industry-standard security measures including:</p>
        <ul>
          <li>HTTPS/TLS encryption for all data in transit</li>
          <li>Bcrypt hashing for passwords (we never store plain text passwords)</li>
          <li>PCI DSS compliant payment processing via Razorpay</li>
          <li>Regular security audits and access controls</li>
        </ul>

        <h2>9. Cookies</h2>
        <p>We use essential cookies for:</p>
        <ul>
          <li><strong>Authentication:</strong> Keeping you logged in during your session.</li>
          <li><strong>Cart:</strong> Remembering items in your shopping cart.</li>
          <li><strong>Preferences:</strong> Storing your theme and accessibility settings.</li>
        </ul>
        <p>We use optional analytics cookies (Google Analytics) only if configured, to understand how visitors use our site. You can disable cookies in your browser settings.</p>

        <h2>10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. When we make material changes, we will notify registered users via email and update the &ldquo;Last updated&rdquo; date above.</p>

      </div>
    </div>
  );
}
