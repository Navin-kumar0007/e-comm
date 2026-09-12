import { Search, HelpCircle, FileText, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function HelpSupportPage() {
  const faqs = [
    {
      q: "Where do you source your ingredients?",
      a: "We source our ingredients directly from organic farmers across India. Our spices come from Kerala and Karnataka, ensuring the highest quality and freshness."
    },
    {
      q: "How long does shipping take?",
      a: "Standard shipping takes 3-5 business days within India. Express shipping is available for major cities and takes 1-2 business days."
    },
    {
      q: "Are your products 100% organic?",
      a: "Yes! All our products are certified organic, free from pesticides, artificial colors, and preservatives."
    },
    {
      q: "How can I track my order?",
      a: "Once your order is shipped, you will receive a tracking link via email and SMS. You can also track your order in your account dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 md:pt-32 pb-20">
      {/* Hero Section */}
      <div className="bg-[#C85B43] text-white py-10 md:py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">How can we help you?</h1>
          <p className="text-sm text-white/80 max-w-2xl mx-auto">
            Search our knowledge base or get in touch with our support team.
          </p>
          <div className="relative max-w-2xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
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
            <div className="w-12 h-12 bg-orange-100 text-[#C85B43] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Shipping Policy</h3>
            <p className="text-muted-foreground text-sm">Learn about our delivery times and shipping costs.</p>
          </Link>
          <Link href="/returns" className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-orange-100 text-[#C85B43] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Returns & Refunds</h3>
            <p className="text-muted-foreground text-sm">Our 7-day easy return policy explained.</p>
          </Link>
          <Link href="/contact" className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-orange-100 text-[#C85B43] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
        <div className="mt-20 bg-orange-50 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl font-heading font-bold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-8">Our customer support team is available Monday to Saturday, 9 AM to 6 PM.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-full bg-[#C85B43] px-8 text-sm font-medium text-white hover:bg-[#8B4513]"><Mail className="w-4 h-4 mr-2" /> Email Support</Link>
            <Link href="mailto:contact@spicynuts.com" className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-8 text-sm font-medium hover:bg-zinc-100 text-zinc-900"><Phone className="w-4 h-4 mr-2" /> Email Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
