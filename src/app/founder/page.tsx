import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Leaf, Award, Heart } from 'lucide-react';

export const metadata = {
  title: "Meet the Founder — Mahesh, Proprietor of B.M.V. Spices & Dry Fruits",
  description: "Meet Mahesh, the founder and proprietor of B.M.V. Spices & Dry Fruits. His passion for pure, unprocessed food drives Spicy Nuts' mission to deliver farm-fresh quality.",
};

export default function FounderPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="bg-[#FAF7F2] py-10 md:py-12 px-4 border-b border-border/40">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-[#2C3E2D]">Meet The Founder</h1>
          <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto">
            The story behind Spicy Nuts and our mission to bring pure, organic Indian flavors to your home.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10 md:mt-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          {/* Image */}
          <div className="relative aspect-[4/3.8] rounded-2xl overflow-hidden shadow-lg border border-border/40">
            <Image src="https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon" alt="Spicy Nuts - Pure Origin Harvest" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">Founding Vision</span>
              <p className="font-heading font-bold text-xl">Spicy Nuts</p>
              <p className="text-xs text-white/80">Founder &amp; Chief Curator</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-heading font-bold mb-3 text-[#2C3E2D]">A Passion for Purity</h2>
              <p className="text-zinc-600 leading-relaxed text-sm mb-3">
                "I started Spicy Nuts with a simple realization: the flavors of my childhood were slowly disappearing from modern kitchens, replaced by heavily processed, artificially flavored alternatives."
              </p>
              <p className="text-zinc-600 leading-relaxed text-sm">
                Growing up in a household where every spice was ground fresh and every nut was hand-graded with care, I knew that authentic taste comes from pure ingredients. That's why we partner directly with organic farmers across India to bring you the finest, unadulterated spices and dry fruits.
              </p>
            </div>

            <div className="space-y-6 pt-6 border-t border-border">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Leaf className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">100% Organic Commitment</h3>
                  <p className="text-zinc-500">Every product we sell is certified organic, ensuring no harmful chemicals touch your food.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-[#C85B43]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Authentic Traditional Recipes</h3>
                  <p className="text-zinc-500">Our masalas and royal dry fruits are curated using generation-old recipes, stone-ground to perfection.</p>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <p className="font-heading text-2xl font-bold mb-2">Mahesh</p>
              <p className="text-zinc-500 italic">Proprietor, B.M.V. Spices & Dry Fruits</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center bg-[#2C3E2D] text-white rounded-[3rem] p-16">
          <h2 className="text-4xl font-heading font-bold mb-6">Taste the Difference</h2>
          <p className="text-sm text-white/80 max-w-2xl mx-auto mb-10">
            Experience the authentic flavors of India with our premium range of organic spices, handcrafted masalas, and royal dry fruits.
          </p>
          <Link href="/shop" className="inline-flex h-14 items-center justify-center rounded-full bg-[#C85B43] px-8 text-sm font-medium text-white hover:bg-[#8B4513]">Explore Our Collection</Link>
        </div>
      </div>
    </div>
  );
}
