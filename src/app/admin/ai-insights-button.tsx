'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles } from 'lucide-react';

export function AIInsightsButton({ stats }: { stats: any }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Generate a 2 sentence business insight based on this data: Revenue: ${stats.totalRevenue}, Orders: ${stats.orderCount}, Customers: ${stats.customerCount}` }] })
      });
      const data = await res.json();
      setInsight(data.content);
    } catch (e) {
      setInsight("Failed to generate insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-100 to-amber-50 dark:from-zinc-900 dark:to-zinc-800 p-6 rounded-2xl border border-orange-200 dark:border-zinc-700 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-lg text-white">
            <Sparkles size={20} />
          </div>
          <h2 className="text-lg font-heading font-semibold text-zinc-900 dark:text-zinc-100">AI Business Insights</h2>
        </div>
        <Button onClick={generate} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">
          {loading ? 'Analyzing...' : <><Bot size={16} className="mr-2" /> Generate Insights</>}
        </Button>
      </div>
      {insight ? (
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl text-zinc-700 dark:text-zinc-300 text-sm border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
          {insight}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Click generate to let Gemini analyze your current performance.</p>
      )}
    </div>
  );
}
