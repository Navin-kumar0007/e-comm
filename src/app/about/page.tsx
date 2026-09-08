import Image from "next/image";
import { Leaf, Heart, ShieldCheck, Globe, Award, Sprout } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story | Spicy Nuts",
  description: "The story behind Spicy Nuts — our mission to bring pure, organic Indian food to every home.",
};

export default function AboutPage() {
  const values = [
    { icon: Leaf, title: "100% Organic", description: "Every product is certified organic. Zero pesticides, zero chemicals, zero compromises." },
    { icon: ShieldCheck, title: "Lab Tested", description: "Every batch is tested for purity, heavy metals, and contamination. We share results openly." },
    { icon: Heart, title: "Fair Trade", description: "We pay our farmers 20-40% above market rates, ensuring dignified livelihoods." },
    { icon: Globe, title: "Sustainable", description: "From regenerative farming to eco-friendly packaging, sustainability drives every decision." },
    { icon: Award, title: "Premium Quality", description: "We source only the highest grade — Lakadong turmeric, Mogra saffron, wood-pressed oils." },
    { icon: Sprout, title: "Traditional Methods", description: "Stone-ground, sun-dried, carefully roasted — we honour time-tested processing methods." },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Leaf className="w-4 h-4" /> Est. 2023
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-3">Our Story</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm">
            Spicy Nuts was born from a simple belief: the food we eat should be pure, honest, and full of life. What started as a grandmother's kitchen wisdom has grown into a movement to bring authentic, organic Indian food to every home.
          </p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-10 md:py-12 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <Image width={800} height={800} unoptimized={false} src="/mamra-almonds.jpg"
                alt="Kitchen preparation"
                className="w-full h-64 md:h-72 object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold mb-3">From Grandmother's Kitchen to Yours</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>
                  Growing up, our founders watched their families carefully select each raw spice, each batch of nuts, selecting the finest high-oil nuts and roasting wholesome traditional snacks — always choosing what was pure and natural. There were no shortcuts. No artificial colours. No preservatives. Just real food, prepared with love.
                </p>
                <p>
                  Years later, when our team couldn't find that same purity in the supermarket aisles, she decided to source it herself — directly from organic farmers across India. What began as personal sourcing for family and friends soon became Spicy Nuts.
                </p>
                <p>
                  Today, we work with over 50 farming families across 8 states, bringing you ingredients that are as pure as what grandmother used to choose — with the convenience of modern delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-10 md:py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-heading font-bold mb-3">What We Stand For</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Six principles that guide every product we source, every package we ship, and every relationship we build.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed text-sm">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "50+", label: "Farming Families" },
              { number: "8", label: "Indian States" },
              { number: "100%", label: "Organic" },
              { number: "10K+", label: "Happy Customers" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-heading font-bold text-primary">{s.number}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 md:py-12 px-4 text-center">
        <h2 className="text-2xl font-heading font-bold mb-3">Taste the Difference</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Experience pure, organic food the way it was meant to be.</p>
        <Link href="/shop">
          <Button size="lg" className="rounded-full shadow-md px-8">Shop Now</Button>
        </Link>
      </section>
    </div>
  );
}
