'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeToPriceDrop } from '@/app/actions/price-alerts';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

export function PriceAlertButton({ productId }: { productId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await subscribeToPriceDrop(productId, email);
    setLoading(false);
    
    if (res.success) {
      toast.success("You'll be notified when the price drops!");
      setIsOpen(false);
      setEmail('');
    } else {
      toast.error("Failed to subscribe.");
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" className="w-full flex items-center justify-center gap-2 mt-4" onClick={() => setIsOpen(true)}>
        <Bell size={16} /> Notify me of Price Drop
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2 w-full animate-in fade-in zoom-in-95">
      <Input 
        type="email" 
        placeholder="Your email..." 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required 
        className="flex-1"
      />
      <Button type="submit" disabled={loading} className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
        Subscribe
      </Button>
    </form>
  );
}
