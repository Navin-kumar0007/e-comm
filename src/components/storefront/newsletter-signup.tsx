"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-10 dark:opacity-5" />
      
      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl mx-auto glass rounded-3xl p-8 md:p-12 text-center animate-on-scroll">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">Join the Nutty World Family</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Subscribe to our newsletter for exclusive offers, traditional recipes, and stories from the farm.
          </p>
          
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
            <Input 
              type="email" 
              placeholder="Enter your email address" 
              className="h-12 rounded-full bg-background/80 border-border/50 text-base px-6 focus-visible:ring-brand-green" 
              required
            />
            <Button type="submit" className="h-12 rounded-full bg-brand-green hover:bg-brand-green/90 px-8">
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            We respect your privacy. No spam, ever.
          </p>
        </div>
      </div>
    </section>
  );
}
