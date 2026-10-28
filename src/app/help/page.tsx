import { Search, HelpCircle, FileText, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { BRAND_PHONE_DISPLAY, BRAND_PHONE_TEL } from "@/lib/contact";

export default function HelpSupportPage() {
  const faqs = [
    {
      q: "Where do you source your ingredients?",
      a: "Our dry fruits and spices come from trusted growers and traders in India and abroad, and each jar's label names its origin. Everything is graded and packed by us in Bidar, Karnataka."
    },
    {
      q: "How long does shipping take?",
      a: "We pack orders within 1–2 business days. Delivery then takes 2–3 business days in Karnataka, 3–5 in the rest of South India, 5–7 across North, West and East India, and 7–10 for remote and North-East areas. Shipping is free above ₹999."
    },
    {
      q: "Are your products organic?",
      a: "Our products are not certified organic. They are graded by hand and packed in Bidar, and every jar lists its ingredients, batch number and packing date."
    },
    {
      q: "How can I track my order?",
      a: "When your order ships we send the courier name and tracking link on WhatsApp and email. You can also track it any time on the Track Order page with your order ID and email, or under My Orders in your account."
    }
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="jaali pt-header text-white pb-10 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="eyebrow block pt-6 text-brand-gold">Help &amp; support</span>
          <h1 className="font-heading text-[34px] font-bold leading-none md:text-[50px]">How can we help you?</h1>
          <p className="text-sm text-white/80 max-w-2xl mx-auto">
            Search our knowledge base or get in touch with our support team.
          </p>
          <div className="relative max-w-2xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Search for answers..." 
              className="w-full pl-12 h-11 rounded-full bg-white text-black text-lg shadow-lg border-0 focus-visible:ring-2 focus-visible:ring-white/50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Link href="/shipping-policy" className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-muted text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Shipping Policy</h3>
            <p className="text-muted-foreground text-sm">Learn about our delivery times and shipping costs.</p>
          </Link>
          <Link href="/returns" className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-muted text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Returns & Refunds</h3>
            <p className="text-muted-foreground text-sm">Damaged or wrong item? Tell us within 48 hours of delivery.</p>
          </Link>
          <Link href="/contact" className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-muted text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Contact Us</h3>
            <p className="text-muted-foreground text-sm">Get in touch with our friendly support team.</p>
          </Link>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-heading font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
                <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Still need help */}
        <div className="mt-20 bg-muted rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl font-heading font-bold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-8">Our customer support team is available Monday to Saturday, 9 AM to 6 PM.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-white hover:bg-royal-deep"><Mail className="w-4 h-4 mr-2" /> Email Support</Link>
            <a href={`tel:${BRAND_PHONE_TEL}`} className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-8 text-sm font-medium hover:bg-muted text-foreground"><Phone className="w-4 h-4 mr-2" /> Call {BRAND_PHONE_DISPLAY}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
