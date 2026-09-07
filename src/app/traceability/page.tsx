"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Shield, Leaf, Sun, Package, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TimelineItem {
  date: string;
  title: string;
  description: string;
  icon: string;
}

interface TraceResult {
  productName: string;
  farmOrigin: string;
  certifications: string[];
  timeline: TimelineItem[];
}

export default function TraceabilityPage() {
  const [batchNo, setBatchNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TraceResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNo.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/traceability/' + batchNo);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'leaf': return <Leaf className="w-5 h-5 text-green-500" />;
      case 'shield': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'sun': return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'package': return <Package className="w-5 h-5 text-amber-700" />;
      default: return <MapPin className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />
      
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">Secure Food Ledger</Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-3">Trace Your Food's Journey</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Enter the batch number found on your product packaging to view the farm source, quality checks, and real-time processing map.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-16 relative">
          <Input 
            value={batchNo}
            onChange={e => setBatchNo(e.target.value)}
            placeholder="e.g. BATCH-2026-X7"
            className="w-full h-14 pl-6 pr-32 text-lg rounded-full shadow-lg border-border focus-visible:ring-primary/20 bg-background/50 backdrop-blur-md"
          />
          <Button 
            type="submit" 
            disabled={loading}
            className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full px-6 bg-primary hover:bg-primary/90"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Timeline and Search Result Column */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card border border-border/40 rounded-3xl p-6 md:p-8 shadow-xl"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/40 pb-6 mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-heading font-bold">{result.productName}</h2>
                      <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" /> Origin: {result.farmOrigin}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.certifications.map((c) => (
                        <Badge key={c} variant="outline" className="bg-background text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border/40" />
                    
                    <div className="space-y-8">
                      {result.timeline.map((item, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -25 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative pl-14"
                        >
                          <div className="absolute left-2.5 top-1 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-md">
                            {getIcon(item.icon)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.date}</span>
                            <h3 className="text-lg font-bold mt-2">{item.title}</h3>
                            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{item.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-card/50 border border-dashed border-border/60 rounded-3xl p-12 text-center text-muted-foreground">
                  Trace details will appear here. Try searching for "BATCH-2026-X7" to test the system.
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* High performance Flat Route Map Graphic (5 cols) */}
          <div className="lg:col-span-5 bg-card border border-border/40 rounded-3xl p-6 shadow-xl h-[450px] flex flex-col justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg">Route Ledger Map</h3>
              <p className="text-xs text-muted-foreground mt-1">Ethical transit verification mapping farm source to shipping hub.</p>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center p-4">
              <svg width="240" height="240" viewBox="0 0 200 200" className="drop-shadow-md">
                <defs>
                  <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>

                {/* Grid Dot Earth representation */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 6" opacity="0.25" />
                <circle cx="100" cy="100" r="50" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2 4" opacity="0.15" />

                {/* Route Path Arc */}
                <path 
                  d="M 50 140 Q 100 40 150 70" 
                  fill="none" 
                  stroke="url(#route-grad)" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeDasharray="6 4"
                  className={result ? "animate-[dash_2s_linear_infinite]" : ""}
                  style={{
                    strokeDasharray: '6, 4',
                    animation: result ? 'dash 1.5s linear infinite' : 'none'
                  }}
                />

                {/* Location Node 1: Kerala Farm */}
                <circle cx="50" cy="140" r="6" fill="#eab308" />
                <circle cx="50" cy="140" r="12" fill="none" stroke="#eab308" strokeWidth="1.5" className="animate-ping" style={{ animationDuration: '3s' }} />
                <text x="50" y="160" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78716c">Kerala Farm</text>

                {/* Location Node 2: Bangalore Hub */}
                <circle cx="150" cy="70" r="6" fill="#16a34a" />
                <circle cx="150" cy="70" r="12" fill="none" stroke="#16a34a" strokeWidth="1.5" className="animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <text x="150" y="55" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78716c">Spicy Nuts Hub</text>
              </svg>
            </div>
            
            <style jsx>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -20;
                }
              }
            `}</style>
          </div>
        </div>

      </div>
    </div>
  );
}
