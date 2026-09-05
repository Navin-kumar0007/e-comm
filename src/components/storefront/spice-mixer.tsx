'use client';

import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShoppingCart, Leaf, Flame, Sparkles, Scale, Info, Wand2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/store/cart-store';

const BASES = [
  { id: 'turmeric', name: 'Golden Turmeric', hex: '#EAB308', rate: 2.5 },
  { id: 'coriander', name: 'Roasted Coriander', hex: '#B45309', rate: 2.0 },
  { id: 'cumin', name: 'Earthy Cumin', hex: '#57534E', rate: 3.0 },
  { id: 'fennel', name: 'Fennel Seed', hex: '#A3E635', rate: 2.8 },
  { id: 'mustard', name: 'Black Mustard', hex: '#3F3F46', rate: 3.2 },
];

const HEATS = [
  { id: 'mild', name: 'Mild Paprika', hex: '#F87171', rate: 3.0 },
  { id: 'medium', name: 'Kashmiri Chili', hex: '#DC2626', rate: 3.5 },
  { id: 'hot', name: 'Guntur Chili', hex: '#991B1B', rate: 4.0 },
  { id: 'ghost', name: 'Ghost Pepper', hex: '#EA580C', rate: 5.5 },
  { id: 'pepper', name: 'Black Pepper', hex: '#18181B', rate: 3.8 },
];

const AROMATICS = [
  { id: 'cardamom', name: 'Green Cardamom', hex: '#86EFAC', rate: 5.0 },
  { id: 'clove', name: 'Rich Clove', hex: '#292524', rate: 6.0 },
  { id: 'cinnamon', name: 'Sweet Cinnamon', hex: '#9A3412', rate: 4.5 },
  { id: 'anise', name: 'Star Anise', hex: '#78350F', rate: 5.8 },
  { id: 'nutmeg', name: 'Royal Nutmeg', hex: '#7C2D12', rate: 6.2 },
];

const FLAVOR_COEFFS: Record<string, { earthy: number; spicy: number; sweet: number; herbal: number; pungent: number }> = {
  turmeric: { earthy: 0.9, spicy: 0.2, sweet: 0.1, herbal: 0.3, pungent: 0.8 },
  coriander: { earthy: 0.7, spicy: 0.1, sweet: 0.6, herbal: 0.5, pungent: 0.3 },
  cumin: { earthy: 0.8, spicy: 0.3, sweet: 0.2, herbal: 0.1, pungent: 0.6 },
  fennel: { earthy: 0.4, spicy: 0.1, sweet: 0.8, herbal: 0.7, pungent: 0.4 },
  mustard: { earthy: 0.6, spicy: 0.4, sweet: 0.1, herbal: 0.2, pungent: 0.9 },
  mild: { earthy: 0.3, spicy: 0.3, sweet: 0.6, herbal: 0.2, pungent: 0.2 },
  medium: { earthy: 0.4, spicy: 0.7, sweet: 0.3, herbal: 0.1, pungent: 0.5 },
  hot: { earthy: 0.5, spicy: 1.0, sweet: 0.1, herbal: 0.1, pungent: 0.8 },
  ghost: { earthy: 0.4, spicy: 1.2, sweet: 0.0, herbal: 0.0, pungent: 1.0 },
  pepper: { earthy: 0.6, spicy: 0.8, sweet: 0.1, herbal: 0.2, pungent: 0.8 },
  cardamom: { earthy: 0.3, spicy: 0.2, sweet: 0.9, herbal: 0.8, pungent: 0.4 },
  clove: { earthy: 0.7, spicy: 0.4, sweet: 0.2, herbal: 0.1, pungent: 1.0 },
  cinnamon: { earthy: 0.6, spicy: 0.3, sweet: 0.9, herbal: 0.2, pungent: 0.5 },
  anise: { earthy: 0.3, spicy: 0.3, sweet: 1.0, herbal: 0.6, pungent: 0.7 },
  nutmeg: { earthy: 0.5, spicy: 0.4, sweet: 0.8, herbal: 0.4, pungent: 0.8 },
};

export function SpiceMixer() {
  const searchParams = useSearchParams();
  
  const paramBaseVal = searchParams.get('baseVal');
  const paramHeatVal = searchParams.get('heatVal');
  const paramAromaticVal = searchParams.get('aromaticVal');
  const paramBase = searchParams.get('base');
  const paramHeat = searchParams.get('heat');
  const paramAromatic = searchParams.get('aromatic');
  const paramName = searchParams.get('name');

  const [baseVal, setBaseVal] = useState(paramBaseVal ? parseInt(paramBaseVal) : 50);
  const [heatVal, setHeatVal] = useState(paramHeatVal ? parseInt(paramHeatVal) : 30);
  const [aromaticVal, setAromaticVal] = useState(paramAromaticVal ? parseInt(paramAromaticVal) : 20);

  const [base, setBase] = useState(() => {
    return BASES.find(b => b.id === paramBase) || BASES[0];
  });
  const [heat, setHeat] = useState(() => {
    return HEATS.find(h => h.id === paramHeat) || HEATS[0];
  });
  const [aromatic, setAromatic] = useState(() => {
    return AROMATICS.find(a => a.id === paramAromatic) || AROMATICS[0];
  });
  
  const [blendName, setBlendName] = useState(paramName || '');
  const [blendDescription, setBlendDescription] = useState('An artisanal organic formulation tailored to your kitchen.');
  
  // Sommelier AI state
  const [activeTab, setActiveTab] = useState<'manual' | 'sommelier'>('manual');
  const [sommelierPrompt, setSommelierPrompt] = useState('');
  const [isFormulating, setIsFormulating] = useState(false);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addItem = useCartStore(s => s.addItem);

  // Smooth interpolation helper
  const animateToRatios = (targetBase: number, targetHeat: number, targetAromatic: number) => {
    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    
    let frames = 0;
    const maxFrames = 30;
    const startBase = baseVal;
    const startHeat = heatVal;
    const startAromatic = aromaticVal;

    animationIntervalRef.current = setInterval(() => {
      frames++;
      const progress = frames / maxFrames;
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      setBaseVal(Math.round(startBase + (targetBase - startBase) * ease));
      setHeatVal(Math.round(startHeat + (targetHeat - startHeat) * ease));
      setAromaticVal(Math.round(startAromatic + (targetAromatic - startAromatic) * ease));

      if (frames >= maxFrames) {
        if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
        setBaseVal(targetBase);
        setHeatVal(targetHeat);
        setAromaticVal(targetAromatic);
      }
    }, 16);
  };

  const handleAskSommelier = async () => {
    if (!sommelierPrompt.trim()) {
      toast.error('Please describe what you want to cook or the flavor notes you want!');
      return;
    }

    setIsFormulating(true);
    try {
      const res = await fetch('/api/blend-sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sommelierPrompt })
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error);

      // Match chosen spice objects
      const matchedBase = BASES.find(b => b.id === data.baseSpice) || BASES[0];
      const matchedHeat = HEATS.find(h => h.id === data.heatSpice) || HEATS[0];
      const matchedAromatic = AROMATICS.find(a => a.id === data.aromaticSpice) || AROMATICS[0];

      setBase(matchedBase);
      setHeat(matchedHeat);
      setAromatic(matchedAromatic);

      // Smoothly animate the visual layers
      animateToRatios(data.baseRatio, data.heatRatio, data.aromaticRatio);

      setBlendName(data.name);
      setBlendDescription(data.description);
      
      toast.success('Your custom AI Blend is formulated! Watch the jar fill.');
      setActiveTab('manual'); // Return to manual tab so they can review their selection
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'AI Sommelier failed. Please try again.');
    } finally {
      setIsFormulating(false);
    }
  };

  // Normalized shares summing to 100
  const { basePct, heatPct, aromaticPct } = useMemo(() => {
    const total = baseVal + heatVal + aromaticVal;
    if (total === 0) {
      return { basePct: 33, heatPct: 33, aromaticPct: 34 };
    }
    return {
      basePct: Math.round((baseVal / total) * 100),
      heatPct: Math.round((heatVal / total) * 100),
      aromaticPct: 100 - Math.round((baseVal / total) * 100) - Math.round((heatVal / total) * 100),
    };
  }, [baseVal, heatVal, aromaticVal]);

  // Compute live flavor profile coefficients
  const flavorProfile = useMemo(() => {
    const bCoeff = FLAVOR_COEFFS[base.id] || FLAVOR_COEFFS.turmeric;
    const hCoeff = FLAVOR_COEFFS[heat.id] || FLAVOR_COEFFS.mild;
    const aCoeff = FLAVOR_COEFFS[aromatic.id] || FLAVOR_COEFFS.cardamom;

    const rB = basePct / 100;
    const rH = heatPct / 100;
    const rA = aromaticPct / 100;

    return {
      earthy: Math.min(100, Math.round(((bCoeff.earthy * rB) + (hCoeff.earthy * rH) + (aCoeff.earthy * rA)) * 100)),
      spicy: Math.min(100, Math.round(((bCoeff.spicy * rB) + (hCoeff.spicy * rH) + (aCoeff.spicy * rA)) * 100)),
      sweet: Math.min(100, Math.round(((bCoeff.sweet * rB) + (hCoeff.sweet * rH) + (aCoeff.sweet * rA)) * 100)),
      herbal: Math.min(100, Math.round(((bCoeff.herbal * rB) + (hCoeff.herbal * rH) + (aCoeff.herbal * rA)) * 100)),
      pungent: Math.min(100, Math.round(((bCoeff.pungent * rB) + (hCoeff.pungent * rH) + (aCoeff.pungent * rA)) * 100)),
    };
  }, [base, heat, aromatic, basePct, heatPct, aromaticPct]);

  // Compute Dynamic Price based on spice premium weights & ratio shares
  const calculatedPrice = useMemo(() => {
    const baseCost = basePct * base.rate;
    const heatCost = heatPct * heat.rate;
    const aromaticCost = aromaticPct * aromatic.rate;
    const rawPrice = Math.round(baseCost + heatCost + aromaticCost);
    return Math.max(249, rawPrice); // packaging baseline floor is 249
  }, [basePct, heatPct, aromaticPct, base, heat, aromatic]);

  const handleAddToCart = () => {
    if (!blendName.trim()) {
      toast.error('Please name your custom blend!');
      return;
    }
    
    addItem({
      productId: 'custom-' + Date.now(),
      slug: 'custom-' + Date.now(),
      name: 'Custom Blend: ' + blendName + ' (' + basePct + '% ' + base.name + ' / ' + heatPct + '% ' + heat.name + ' / ' + aromaticPct + '% ' + aromatic.name + ')',
      price: calculatedPrice,
      weight: '150g',
      image: 'https://placehold.co/600x400.png?text=Custom+Spice+Blend'
    });
    
    toast.success(blendName + ' added to cart!');
    setBlendName('');
    setSommelierPrompt('');
  };

  const radarPoints = useMemo(() => {
    const center = 100;
    const maxVal = 100;
    const radius = 65;

    const attributes = [
      flavorProfile.earthy,
      flavorProfile.spicy,
      flavorProfile.sweet,
      flavorProfile.herbal,
      flavorProfile.pungent
    ];

    return attributes.map((val, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const length = (val / maxVal) * radius;
      return {
        x: center + length * Math.cos(angle),
        y: center + length * Math.sin(angle)
      };
    });
  }, [flavorProfile]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column: SVG Jar Preview */}
      <div className="lg:col-span-5 relative h-[520px] w-full rounded-3xl bg-secondary/5 overflow-hidden border border-border/40 shadow-inner flex flex-col justify-center items-center p-4">
        
        {/* Beautiful High-fidelity SVG Glass Jar with CSS transitions */}
        <svg width="220" height="360" viewBox="0 0 220 360" className="drop-shadow-2xl">
          <defs>
            <clipPath id="jar-clip">
              <rect x="30" y="70" width="160" height="260" rx="20" />
            </clipPath>
          </defs>

          {/* Spice Layers (Clipped to Jar Shape) */}
          <g clipPath="url(#jar-clip)">
            {/* Base Layer */}
            <rect 
              x="30" 
              y={330 - basePct * 2.6} 
              width="160" 
              height={basePct * 2.6} 
              fill={base.hex} 
              className="transition-all duration-700 ease-out" 
            />
            {/* Heat Layer */}
            <rect 
              x="30" 
              y={330 - (basePct + heatPct) * 2.6} 
              width="160" 
              height={heatPct * 2.6} 
              fill={heat.hex} 
              className="transition-all duration-700 ease-out" 
            />
            {/* Aromatic Layer */}
            <rect 
              x="30" 
              y={330 - (basePct + heatPct + aromaticPct) * 2.6} 
              width="160" 
              height={aromaticPct * 2.6} 
              fill={aromatic.hex} 
              className="transition-all duration-700 ease-out" 
            />
          </g>

          {/* Glass Bottle highlight/borders */}
          <rect x="30" y="70" width="160" height="260" rx="20" fill="none" stroke="#decbb0" strokeWidth="4" opacity="0.4" />
          <rect x="40" y="80" width="10" height="240" rx="5" fill="#ffffff" opacity="0.25" />

          {/* Lid & Neck */}
          <rect x="60" y="50" width="100" height="20" rx="5" fill="#e5e5e0" stroke="#c59b27" strokeWidth="1" opacity="0.7" />
          <rect x="50" y="25" width="120" height="25" rx="8" fill="#052c1e" />

          {/* Paper Label */}
          <rect x="50" y="160" width="120" height="70" rx="10" fill="#fcfbf7" stroke="#decbb0" strokeWidth="1.5" />
          <text 
            x="110" 
            y="195" 
            textAnchor="middle" 
            fontFamily="var(--font-playfair)" 
            fontSize="11" 
            fontWeight="bold" 
            fill="#052c1e"
          >
            {blendName ? (blendName.length > 15 ? blendName.substring(0, 13) + '..' : blendName) : 'Signature'}
          </text>
          <text 
            x="110" 
            y="212" 
            textAnchor="middle" 
            fontFamily="sans-serif" 
            fontSize="8" 
            fill="#55675e"
          >
            Custom Spice Mix
          </text>
        </svg>

        {isFormulating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-secondary animate-spin" />
            <span className="text-sm font-bold text-primary animate-pulse">Blending aroma coordinates...</span>
          </div>
        )}
      </div>

      {/* Right Column: Control Board & Radar Chart */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Toggle Switcher */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl border border-border/40 max-w-md">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'manual' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Manual Formulation
          </button>
          <button
            onClick={() => setActiveTab('sommelier')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'sommelier' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Wand2 className="w-3.5 h-3.5" /> AI Spice Sommelier
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-card p-6 md:p-8 rounded-3xl border border-border/40 shadow-xl">
          
          {/* Controls Panel */}
          <div className="md:col-span-7 space-y-6">
            
            {activeTab === 'manual' ? (
              <>
                {/* Base Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Leaf className="w-4 h-4 text-primary" />
                      1. Base Selection (rate ₹/%)
                    </span>
                    <span className="text-sm font-bold text-primary">{basePct}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                    {BASES.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setBase(b)}
                        className={'py-2 px-1 rounded-lg border text-[9px] font-bold transition-all leading-tight ' + (base.id === b.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 hover:border-primary/30')}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={baseVal}
                    onChange={(e) => setBaseVal(parseInt(e.target.value))}
                    className="w-full accent-primary h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Heat Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Flame className="w-4 h-4 text-red-500" />
                      2. Heat Level (rate ₹/%)
                    </span>
                    <span className="text-sm font-bold text-red-500">{heatPct}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                    {HEATS.map(h => (
                      <button
                        key={h.id}
                        onClick={() => setHeat(h)}
                        className={'py-2 px-1 rounded-lg border text-[9px] font-bold transition-all leading-tight ' + (heat.id === h.id ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-border/30 hover:border-red-500/30')}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={heatVal}
                    onChange={(e) => setHeatVal(parseInt(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Aromatic Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Sparkles className="w-4 h-4 text-secondary" />
                      3. Aromatic Notes (rate ₹/%)
                    </span>
                    <span className="text-sm font-bold text-secondary">{aromaticPct}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                    {AROMATICS.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setAromatic(a)}
                        className={'py-2 px-1 rounded-lg border text-[9px] font-bold transition-all leading-tight ' + (aromatic.id === a.id ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border/30 hover:border-secondary/30')}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={aromaticVal}
                    onChange={(e) => setAromaticVal(parseInt(e.target.value))}
                    className="w-full accent-secondary h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Wand2 className="w-4 h-4 text-secondary" />
                    AI Sensory Blender
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Describe your recipe or desired flavors in natural language, and Gemini will calibrate the exact spice ratios.
                  </p>
                </div>
                <textarea
                  value={sommelierPrompt}
                  onChange={(e) => setSommelierPrompt(e.target.value)}
                  placeholder="e.g. A rich, smokey mutton curry that is fiery hot with sweet fennel and cardamon highlights"
                  className="w-full h-32 p-3 text-sm bg-background border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/50 placeholder:text-muted-foreground/60"
                />
                <Button
                  onClick={handleAskSommelier}
                  disabled={isFormulating}
                  className="w-full h-11 bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 flex items-center justify-center gap-2 rounded-xl"
                >
                  <Sparkles className="w-4 h-4" /> Formulate Recipe with AI
                </Button>
              </div>
            )}

          </div>

          {/* Flavor Radar Graphic */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-muted/20 rounded-2xl border border-border/30">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" /> Flavor Radar
            </span>
            
            <svg width="190" height="190" className="drop-shadow-sm">
              {[20, 40, 60, 80].map((r, i) => {
                const points = Array.from({ length: 5 }).map((_, j) => {
                  const angle = (j * 2 * Math.PI) / 5 - Math.PI / 2;
                  return (95 + r * Math.cos(angle)) + ',' + (95 + r * Math.sin(angle));
                }).join(' ');
                return (
                  <polygon
                    key={i}
                    points={points}
                    fill="none"
                    stroke="#decbb0"
                    strokeWidth="0.8"
                    opacity="0.3"
                  />
                );
              })}
              
              {Array.from({ length: 5 }).map((_, i) => {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1="95"
                    y1="95"
                    x2={95 + 80 * Math.cos(angle)}
                    y2={95 + 80 * Math.sin(angle)}
                    stroke="#decbb0"
                    strokeWidth="1"
                    opacity="0.25"
                  />
                );
              })}

              {['Earthy', 'Spicy', 'Sweet', 'Herbal', 'Pungent'].map((label, i) => {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const textDist = 84;
                const valMap = [
                  flavorProfile.earthy,
                  flavorProfile.spicy,
                  flavorProfile.sweet,
                  flavorProfile.herbal,
                  flavorProfile.pungent
                ];
                return (
                  <text
                    key={label}
                    x={95 + textDist * Math.cos(angle)}
                    y={95 + textDist * Math.sin(angle)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill="#55675e"
                  >
                    {label + ' (' + valMap[i] + '%)'}
                  </text>
                );
              })}

              {/* Polygon representing the flavor bounds */}
              {radarPoints.length === 5 && (
                <polygon
                  points={radarPoints.map(p => (p.x - 5) + ',' + (p.y - 5)).join(' ')}
                  fill="rgba(197, 155, 39, 0.2)"
                  stroke="rgba(197, 155, 39, 0.85)"
                  strokeWidth="2.5"
                  className="transition-all duration-300"
                />
              )}

              {/* Glowing Interactive Vertices with Hover Tooltips */}
              {radarPoints.map((p, i) => {
                const valMap = [
                  flavorProfile.earthy,
                  flavorProfile.spicy,
                  flavorProfile.sweet,
                  flavorProfile.herbal,
                  flavorProfile.pungent
                ];
                const labels = ['Earthy', 'Spicy', 'Sweet', 'Herbal', 'Pungent'];
                return (
                  <g key={i} className="group/dot cursor-pointer">
                    <circle
                      cx={p.x - 5}
                      cy={p.y - 5}
                      r="4.5"
                      fill="#c59b27"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all duration-200 hover:scale-150 hover:fill-primary"
                    />
                    <title>{labels[i] + ': ' + valMap[i] + '%'}</title>
                  </g>
                );
              })}
            </svg>
            
            <div className="mt-3 flex items-center gap-1 text-[9px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/30">
              <Info className="w-3 h-3 text-secondary animate-pulse" /> Hover dots for details
            </div>
          </div>

        </div>

        {/* Name, Info & Add to Cart panel */}
        <div className="bg-card p-6 rounded-3xl border border-border/40 shadow-xl space-y-4">
          {blendDescription && (
            <div className="text-xs text-muted-foreground italic bg-secondary/5 p-3 rounded-xl border border-secondary/10">
              <span className="font-bold text-primary not-italic block mb-0.5">Blend Profile:</span>
              "{blendDescription}"
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-bold text-foreground mb-2">Give it a Signature Name</label>
              <Input 
                placeholder="e.g. Grandma's Sunday Secret Curry" 
                value={blendName}
                onChange={(e) => setBlendName(e.target.value)}
                className="bg-background h-12 rounded-xl text-base"
              />
            </div>
            <Button 
              onClick={handleAddToCart} 
              className="w-full sm:w-auto h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Add Blend - ₹{calculatedPrice}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            * Custom mixes contain roughly 150g of spice. Packed in certified aroma-lock biodegradable glass jars.
          </p>
        </div>

      </div>
    </div>
  );
}
