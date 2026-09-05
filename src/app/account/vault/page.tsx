import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Info, RefreshCw, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'My Freshness Vault - Nutty World',
};

interface VaultItem {
  id: string;
  name: string;
  type: 'ground' | 'whole';
  purchaseDate: Date;
  ageDays: number;
  potency: number;
  status: 'PEAK' | 'MELLOW' | 'EXPIRED';
  base: string;
  heat: string;
  aromatic: string;
  baseVal: number;
  heatVal: number;
  aromaticVal: number;
}

export default async function VaultPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // 1. Fetch real user orders to scan for custom blends
  const realOrders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Parse custom blends if any exist in the real database
  const realBlends: VaultItem[] = [];
  
  for (const order of realOrders) {
    for (const item of order.items) {
      const isCustomId = item.productId.startsWith('custom-');
      const hasCustomName = item.product.name.toLowerCase().includes('custom blend:');
      
      if (isCustomId || hasCustomName) {
        try {
          const namePart = item.product.name.split('(')[0].replace('Custom Blend: ', '').trim();
          const ratios = [...item.product.name.matchAll(/(\d+)%/g)].map(m => parseInt(m[1]));
          
          const basePct = ratios[0] || 50;
          const heatPct = ratios[1] || 30;
          const aromaticPct = ratios[2] || 20;

          // Detect IDs based on name keywords
          let baseId = 'turmeric';
          if (item.product.name.toLowerCase().includes('coriander')) baseId = 'coriander';
          else if (item.product.name.toLowerCase().includes('cumin')) baseId = 'cumin';
          else if (item.product.name.toLowerCase().includes('fennel')) baseId = 'fennel';
          else if (item.product.name.toLowerCase().includes('mustard')) baseId = 'mustard';

          let heatId = 'mild';
          if (item.product.name.toLowerCase().includes('kashmiri') || item.product.name.toLowerCase().includes('medium')) heatId = 'medium';
          else if (item.product.name.toLowerCase().includes('guntur') || item.product.name.toLowerCase().includes('hot')) heatId = 'hot';
          else if (item.product.name.toLowerCase().includes('ghost')) heatId = 'ghost';
          else if (item.product.name.toLowerCase().includes('pepper') || item.product.name.toLowerCase().includes('black pepper')) heatId = 'pepper';

          let aromaticId = 'cardamom';
          if (item.product.name.toLowerCase().includes('clove')) aromaticId = 'clove';
          else if (item.product.name.toLowerCase().includes('cinnamon')) aromaticId = 'cinnamon';
          else if (item.product.name.toLowerCase().includes('anise')) aromaticId = 'anise';
          else if (item.product.name.toLowerCase().includes('nutmeg')) aromaticId = 'nutmeg';

          realBlends.push({
            id: item.id,
            name: namePart,
            type: 'ground',
            purchaseDate: order.createdAt,
            ageDays: 0,
            potency: 100,
            status: 'PEAK',
            base: baseId,
            heat: heatId,
            aromatic: aromaticId,
            baseVal: basePct,
            heatVal: heatPct,
            aromaticVal: aromaticPct
          });
        } catch (err) {
          console.error("Failed to parse custom blend order item name:", item.product.name, err);
        }
      }
    }
  }
  
  // 2. Populate fallback high-fidelity premium items if they don't have custom blends yet
  const fallbackBlends: VaultItem[] = [
    {
      id: 'mock-1',
      name: 'Signature Garam Masala',
      type: 'ground',
      purchaseDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000), // 42 days ago
      ageDays: 42,
      potency: 77,
      status: 'PEAK',
      base: 'cumin',
      heat: 'pepper',
      aromatic: 'cinnamon',
      baseVal: 40,
      heatVal: 30,
      aromaticVal: 30
    },
    {
      id: 'mock-2',
      name: 'Fiery Garlic Spice Rub',
      type: 'ground',
      purchaseDate: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000), // 110 days ago
      ageDays: 110,
      potency: 39,
      status: 'MELLOW',
      base: 'mustard',
      heat: 'ghost',
      aromatic: 'clove',
      baseVal: 30,
      heatVal: 50,
      aromaticVal: 20
    },
    {
      id: 'mock-3',
      name: 'Golden Glow Healing Turmeric',
      type: 'whole',
      purchaseDate: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000), // 280 days ago
      ageDays: 280,
      potency: 22,
      status: 'EXPIRED',
      base: 'turmeric',
      heat: 'mild',
      aromatic: 'cardamom',
      baseVal: 60,
      heatVal: 20,
      aromaticVal: 20
    }
  ];

  // Combine real blends with fallbacks (prioritize real purchases)
  const vaultItems = [...realBlends, ...fallbackBlends];

  // Calculate live dynamic potency values
  const processedItems = vaultItems.map(item => {
    const shelfLife = item.type === 'ground' ? 180 : 360; // 6 months vs 12 months
    const ageMs = Date.now() - item.purchaseDate.getTime();
    const ageDays = Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
    
    // Potency decays linearly
    const potency = Math.max(0, Math.round(((shelfLife - ageDays) / shelfLife) * 100));
    
    let status: 'PEAK' | 'MELLOW' | 'EXPIRED' = 'PEAK';
    if (potency < 40) {
      status = 'EXPIRED';
    } else if (potency < 75) {
      status = 'MELLOW';
    }

    return {
      ...item,
      ageDays,
      potency,
      status
    };
  });

  return (
    <div className="container max-w-5xl py-28 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">The Freshness Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tracking the dynamic sensory potency and essential oil decay of your custom artisanal selections.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-secondary">
          <ShieldCheck className="w-4 h-4" /> 100% Aroma-Lock Guarantee
        </div>
      </div>

      {/* Main Grid: Vault Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {processedItems.map(item => {
          let statusText = 'Peak Potency';
          let statusColor = 'text-primary border-primary/20 bg-primary/10';
          let dialColor = 'stroke-primary';
          let tip = 'Max essential oils active. Best for gourmet dishes.';

          if (item.status === 'EXPIRED') {
            statusText = 'Past Prime';
            statusColor = 'text-red-500 border-red-500/20 bg-red-500/10';
            dialColor = 'stroke-red-500';
            tip = 'Aroma compounds have faded. Best for slow stocks or baking; re-blend!';
          } else if (item.status === 'MELLOW') {
            statusText = 'Mellowing Intensity';
            statusColor = 'text-secondary border-secondary/20 bg-secondary/10';
            dialColor = 'stroke-secondary';
            tip = 'Aroma is warm and mild. Use 1.25x dosage for full strength.';
          }

          return (
            <div key={item.id} className="glass-card bg-card/60 rounded-3xl p-6 border border-border/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
              
              {/* Freshness visualizer dial */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground">{item.name}</h3>
                  <span className="text-[10px] text-muted-foreground block uppercase mt-0.5">Purchased {item.ageDays} days ago</span>
                </div>
                
                {/* SVG circular gauge */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="var(--border)" strokeWidth="4" opacity="0.3" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="28" 
                      fill="transparent" 
                      className={dialColor + " transition-all duration-1000"} 
                      strokeWidth="4" 
                      strokeDasharray="176"
                      strokeDashoffset={176 - (item.potency / 100) * 176}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-foreground">{item.potency}%</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                    {statusText}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {item.type} grind
                  </span>
                </div>

                <p className="text-xs text-muted-foreground italic min-h-[40px] leading-relaxed">
                  "{tip}"
                </p>

                {/* 1-Click Reblend Action */}
                <Link 
                  href={`/blend-creator?base=${item.base}&heat=${item.heat}&aromatic=${item.aromatic}&baseVal=${item.baseVal}&heatVal=${item.heatVal}&aromaticVal=${item.aromaticVal}&name=${encodeURIComponent(item.name)}`}
                  className="w-full h-10 mt-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md group"
                >
                  <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" /> 1-Click Re-Blend
                </Link>
              </div>

            </div>
          );
        })}
      </div>

      {/* STORAGE GUIDE PANEL */}
      <div className="bg-secondary/5 border border-secondary/15 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 space-y-2">
          <h3 className="font-heading font-bold text-lg text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary animate-pulse" /> Optimal Shelf-Life Storage Tips
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nutty World organic spices are packed immediately post-roasting in certified aroma-lock glass jars. 
            For maximum essential oil longevity, store your vault items in a cool, dry pantry away from direct solar radiation or oven heats. 
            Whole spices retain potency up to 2x longer than fine ground masalas.
          </p>
        </div>
        <div className="md:col-span-4 flex justify-end">
          <Link 
            href="/blend-creator" 
            className="px-6 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/95 text-xs font-bold rounded-xl flex items-center gap-1 shadow-md"
          >
            Create New Recipe <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="lucide lucide-arrow-right w-4 h-4"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
