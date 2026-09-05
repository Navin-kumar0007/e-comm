import Link from 'next/link';
import { Leaf, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-[url('/pattern.png')] bg-repeat bg-blend-soft-light bg-muted/10">
      <div className="mb-8 relative">
        <div className="text-9xl font-heading font-black text-primary/20 select-none">404</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Leaf className="w-16 h-16 text-primary" />
        </div>
      </div>
      
      <h1 className="text-4xl font-heading font-bold mb-4">Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8 text-lg">
        We couldn't find the page you're looking for. It might have been moved, or the link might be broken.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/shop">
          <Button size="lg" className="rounded-full w-full sm:w-auto">
            Browse Shop
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="lg" className="rounded-full w-full sm:w-auto">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
