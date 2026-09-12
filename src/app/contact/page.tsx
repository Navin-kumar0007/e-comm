"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitContact } from '@/app/actions/contact';
import { toast } from 'sonner';
import { MapPin, Mail, Clock, Phone } from 'lucide-react';



export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await submitContact(formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Message sent! We will get back to you shortly.");
      setFormData({ name: '', email: '', message: '' });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-12">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-3">Get in Touch</h1>
          <p className="text-sm text-muted-foreground mb-6">Have a question about our products or your order? We&apos;d love to hear from you.</p>
          
          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Visit Our Store</h3>
                <p className="text-sm text-muted-foreground">B.M.V. Spices & Dry Fruits<br />Shop No 1/206/1, Bhaskar Nagar Chitguppa<br />Chitgoppa, Bidar, Karnataka – 585412</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Email Us</h3>
                <p className="text-sm text-muted-foreground">spicynuts1973@gmail.com</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Business Hours</h3>
                <p className="text-sm text-muted-foreground">Mon – Sat: 9:00 AM – 8:00 PM<br />Sunday: 10:00 AM – 6:00 PM</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/50">
            <p className="text-xs text-muted-foreground">GSTIN: 29FCBPM9871D1Z6 · Proprietorship</p>
          </div>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your Name" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="you@example.com" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea 
                required
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full min-h-[120px] p-3 rounded-xl border border-border bg-transparent text-sm"
                placeholder="How can we help?"
              />
            </div>
            <Button disabled={loading} type="submit" className="w-full rounded-full h-11 font-semibold">
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
