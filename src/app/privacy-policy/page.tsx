import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Spicy Nuts",
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-4xl py-16 px-4">
      <h1 className="text-3xl font-heading font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-sm sm:prose-base prose-amber dark:prose-invert">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
        <p>This Privacy Policy applies to the services offered by B.M.V. SPICES & DRY FRUITS ("Spicy Nuts"). We comply with the Digital Personal Data Protection (DPDP) Act, 2023.</p>
        
        <h3>1. Data Collection & Consent</h3>
        <p>We collect personal data (Name, Email, Phone, Address) strictly for the purpose of fulfilling your orders and improving your experience. By registering or checking out, you explicitly consent to this data processing.</p>

        <h3>2. Data Usage</h3>
        <p>Your data is used solely for order processing, delivery logistics, and communication regarding your transactions. We do not sell your personal data to third parties.</p>

        <h3>3. Data Fiduciary Responsibilities</h3>
        <p>As a Data Fiduciary, we have implemented reasonable security safeguards to prevent data breaches and unauthorized access to your information.</p>

        <h3>4. Your Rights (Data Principal)</h3>
        <ul>
          <li>Right to access information about your personal data processing.</li>
          <li>Right to correction and erasure of your personal data.</li>
          <li>Right to grievance redressal.</li>
        </ul>
        <p>To exercise these rights, please contact our Data Protection Officer at spicynuts1973@gmail.com.</p>
      </div>
    </div>
  );
}
