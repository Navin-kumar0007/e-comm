import { Metadata } from 'next';
import { Suspense } from 'react';
import { SpiceMixer } from '@/components/storefront/spice-mixer';
import { PageHero } from "@/components/storefront/royal/page-hero";

export const metadata: Metadata = {
  title: 'Custom Spice Blend Creator | Spicy Nuts',
  description: 'Mix your own custom organic spice blend.',
};

export default function BlendCreatorPage() {
  return (
    <div className="min-h-screen pb-20 bg-background overflow-hidden relative">
      <PageHero eyebrow={"Spice Atelier"} title={"Create Your Signature Blend"} subtitle={"Choose your base, adjust the heat, and add aromatics. We'll hand-mix your custom organic spice blend and ship it straight to your door."} crumbs={[{ label: "Home", href: "/" }, { label: "Custom blend" }]} />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />
      
      <div className="container mx-auto px-4 max-w-6xl">
        

        <Suspense fallback={
          <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-card rounded-3xl border border-border/40 shadow-xl p-8">
            <div className="w-12 h-12 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
            <span className="text-sm font-bold text-primary animate-pulse">Initializing blender sensory matrix...</span>
          </div>
        }>
          <SpiceMixer />
        </Suspense>
      </div>
    </div>
  );
}
