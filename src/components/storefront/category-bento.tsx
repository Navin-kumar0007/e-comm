"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Flame, HeartPulse, Leaf, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function CategoryBento() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-8 md:py-14 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800">
      <div className="container px-4 md:px-6 mx-auto">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 font-mono mb-2 block">
              Curated Collections
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-zinc-900 dark:text-zinc-50 tracking-tight">
              Explore Our Royal Pantry
            </h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mt-3 md:mt-0">
            Hand-selected dry fruits, cold-ground masalas, single-origin spices, and guilt-free traditional snacks.
          </p>
        </div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5"
        >
          {/* Main Tile 1: Royal Dry Fruits & Superfoods (Col 7, Row 2) */}
          <motion.div variants={itemVariants} className="md:col-span-7 relative rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 min-h-[200px] md:min-h-[220px]">
            <Link href="/category/dry-fruits" className="block w-full h-full">
              <Image
                src="https://images.unsplash.com/photo-1607349913338-fca9f7fc42d0?q=80&w=800&auto=format&fit=crop"
                alt="Royal Dry Fruits and Superfoods"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />
              <div className="absolute top-3 left-3 md:top-5 md:left-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-black text-xs font-bold shadow-md backdrop-blur-sm">
                  <HeartPulse className="w-3.5 h-3.5" />
                  High-Oil &amp; Nutrient Dense
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex justify-between items-end text-white">
                <div>
                  <h3 className="text-xl md:text-3xl font-bold font-heading mb-1.5">
                    Royal Dry Fruits &amp; Superfoods
                  </h3>
                  <p className="text-white/80 text-xs md:text-sm max-w-md">
                    Afghan Mamra Almonds, Goan W180 Cashews, Kashmiri Walnuts, Turkish Figs &amp; Medjool Dates.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:rotate-45 group-hover:bg-amber-600 dark:group-hover:bg-amber-500 flex-shrink-0 ml-4">
                  <ArrowUpRight className="text-white w-5 h-5" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Main Tile 2: Chai Masalas & Artisanal Blends (Col 5, Row 1) */}
          <motion.div variants={itemVariants} className="md:col-span-5 relative rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 min-h-[200px] md:min-h-[220px]">
            <Link href="/category/masalas" className="block w-full h-full">
              <Image
                src="/jar3.jpg"
                alt="Tandoori Chai Masala and Blends"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />
              <div className="absolute top-3 left-3 md:top-5 md:left-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600 dark:bg-amber-500 text-white text-xs font-bold shadow-md backdrop-blur-sm">
                  <Flame className="w-3.5 h-3.5" />
                  Slow-Roasted Heritage
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex justify-between items-end text-white">
                <div>
                  <h3 className="text-2xl font-bold font-heading mb-1.5">
                    Chai &amp; Artisanal Masalas
                  </h3>
                  <p className="text-white/80 text-xs line-clamp-2">
                    Tandoori Chai Masala, Garam Masala &amp; small-batch blends roasted in iron pans.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:rotate-45 group-hover:bg-amber-600 dark:group-hover:bg-amber-500 flex-shrink-0 ml-3">
                  <ArrowUpRight className="text-white w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Tile 3: Single-Origin Organic Spices (Col 6, Row 2) */}
          <motion.div variants={itemVariants} className="md:col-span-6 relative rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 min-h-[240px]">
            <Link href="/category/masalas" className="block w-full h-full">
              <Image
                src="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800&auto=format&fit=crop"
                alt="Lakadong Turmeric and Spices"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 right-4 md:bottom-5 md:left-5 md:right-5 flex justify-between items-end text-white">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>High Curcumin (8-12%)</span>
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-1">
                    Single-Origin Pure Spices
                  </h3>
                  <p className="text-white/80 text-xs">
                    Meghalaya Lakadong Turmeric, Royal Kashmiri Saffron &amp; Tellicherry Black Pepper.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:rotate-45 group-hover:bg-amber-600 dark:group-hover:bg-amber-500 flex-shrink-0 ml-2">
                  <ArrowUpRight className="text-white w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Tile 4: Traditional Healthy Snacks (Col 6, Row 2) */}
          <motion.div variants={itemVariants} className="md:col-span-6 relative rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 min-h-[240px]">
            <Link href="/category/snacks" className="block w-full h-full">
              <Image
                src="https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=800&auto=format&fit=crop"
                alt="Healthy Snacks and Trail Mix"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 right-4 md:bottom-5 md:left-5 md:right-5 flex justify-between items-end text-white">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                    <Leaf className="w-3.5 h-3.5" />
                    <span>Guilt-Free Snacking</span>
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-1">
                    Heritage Snacks &amp; Trail Mixes
                  </h3>
                  <p className="text-white/80 text-xs">
                    Slow-Roasted Peri Peri Makhana, 7-Seed Trail Mix &amp; Organic Jaggery Chikki.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:rotate-45 group-hover:bg-amber-600 dark:group-hover:bg-amber-500 flex-shrink-0 ml-2">
                  <ArrowUpRight className="text-white w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}
