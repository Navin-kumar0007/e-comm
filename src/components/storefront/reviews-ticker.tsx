"use client";

import { Star } from "lucide-react";

const REVIEWS = [
  { id: 1, name: "Pooja Verma", location: "Mumbai", product: "Afghan Mamra Almonds", text: "The oil content in these Mamra almonds is incredible! You can immediately taste the rich buttery texture compared to ordinary California almonds.", rating: 5 },
  { id: 2, name: "Dr. Arvind Rao", location: "Bangalore", product: "Tandoori Chai Masala", text: "The aroma of the Tandoori Chai Masala is phenomenal. True clay-pot smokiness with high quality cardamom. Morning tea is now a luxury ritual.", rating: 5 },
  { id: 3, name: "Meera Nair", location: "Kochi", product: "Goan Jumbo Cashews W180", text: "Truly King Size cashews! Super crunchy, naturally sweet, and no chemical polishing. Excellent quality in glass packaging.", rating: 5 },
  { id: 4, name: "Rajesh Malhotra", location: "Delhi", product: "Kashmiri Walnut Kernels", text: "Snow-white walnut halves with zero bitterness. Packed with natural Omega-3 oils. My whole family has them soaked every morning.", rating: 5 },
  { id: 5, name: "Sunita Deshmukh", location: "Pune", product: "Lakadong Turmeric Powder", text: "The golden hue and high curcumin potency is unmistakable. You only need a small pinch for golden milk and daily immunity.", rating: 5 },
];

export function ReviewsTicker() {
  return (
    <section className="py-6 md:py-12 bg-[#1E3A2B] text-white overflow-hidden border-t border-emerald-950">
      <div className="container px-4 md:px-6 mb-5 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono mb-2 block">
          Community Love
        </span>
        <h2 className="text-2xl md:text-3xl font-bold font-heading">
          Loved by 10,000+ Healthy Indian Homes
        </h2>
      </div>
      
      <div className="relative flex overflow-x-hidden group">
        <div className="py-4 animate-marquee whitespace-nowrap flex gap-6 items-center">
          {[...REVIEWS, ...REVIEWS].map((review, i) => (
            <div key={`${review.id}-${i}`} className="w-56 md:w-80 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/15 inline-flex flex-col whitespace-normal shrink-0 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                  {review.product}
                </span>
              </div>
              <p className="text-white/90 text-sm mb-4 leading-relaxed italic">&quot;{review.text}&quot;</p>
              <div className="flex items-center justify-between text-xs text-white/80 border-t border-white/10 pt-3 mt-auto">
                <span className="font-bold text-white">{review.name}</span>
                <span className="text-emerald-300 font-medium">{review.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      

    </section>
  );
}
