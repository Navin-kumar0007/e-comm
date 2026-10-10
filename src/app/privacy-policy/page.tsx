import { getSiteContent } from "@/lib/site-content";
import { SimpleMarkdown } from "@/components/storefront/simple-markdown";
import { Metadata } from "next";
import { PageHero } from "@/components/storefront/royal/page-hero";

export const metadata: Metadata = {
  title: "Privacy Policy | Spicy Nuts",
};

function BuiltInPage() {
  return (
    <>
      <PageHero eyebrow={"Policy"} title={"Privacy Policy"} crumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-10">
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

        <h3>5. WhatsApp Messages</h3>
        <p>If you give us your phone number, we send order updates (confirmation, shipping, delivery) on WhatsApp from +91 85500 07073 using the WhatsApp Business Platform by Meta. Offers are sent only if you opted in. Reply STOP at any time to stop offers. Messages you send us are used only to answer you and handle your order.</p>

        <h3 id="data-deletion">6. Deleting Your Data</h3>
        <p>You can ask us to delete your account and personal data at any time:</p>
        <ol>
          <li>Email <a href="mailto:spicynuts1973@gmail.com?subject=Delete%20my%20data">spicynuts1973@gmail.com</a> with the subject &quot;Delete my data&quot;, from the email address on your account, or message us on WhatsApp at +91 85500 07073.</li>
          <li>Tell us your name and the phone number or email you used to order.</li>
          <li>We delete your account, saved addresses, WhatsApp subscription and marketing data within 30 days and confirm by email.</li>
        </ol>
        <p>We keep invoice and order records only as long as tax law requires (GST records are kept for at least 6 years); these are not used for marketing.</p>
      </div>
    </div>
    </>
  );
}

/** Text written in Admin → Website editor → Policy pages replaces the built-in page; empty keeps it. */
export default async function PrivacyPolicy() {
  const custom = (await getSiteContent("policies")).privacy;
  if (!custom?.trim()) return <BuiltInPage />;
  return (
    <>
      <PageHero eyebrow={"Policy"} title={"Privacy Policy"} crumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-10">
        <div className="prose prose-sm sm:prose-base prose-amber dark:prose-invert max-w-none">
          <SimpleMarkdown text={custom} />
        </div>
      </div>
    </>
  );
}
