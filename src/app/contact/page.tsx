"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitContact } from '@/app/actions/contact';
import { toast } from 'sonner';

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
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-3">Get in Touch</h1>
          <p className="text-sm text-zinc-500 mb-5">Have a question about our products or your order? We'd love to hear from you.</p>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-1">Visit Us</h3>
              <p className="text-zinc-600 dark:text-zinc-400">123 Spice Market Road<br />Bangalore, KA 560001</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Email</h3>
              <p className="text-zinc-600 dark:text-zinc-400">hello@nuttyworld.com</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Phone</h3>
              <p className="text-zinc-600 dark:text-zinc-400">+91 98765 43210</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea 
                required
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full min-h-[120px] p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent"
                placeholder="How can we help?"
              />
            </div>
            <Button disabled={loading} type="submit" className="w-full bg-[#C85B43] hover:bg-[#8B4513] text-white">
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
