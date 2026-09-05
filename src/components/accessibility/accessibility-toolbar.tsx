'use client';
import { useState, useEffect } from 'react';
import { Accessibility, Type, Contrast, MonitorOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (largeText) document.documentElement.classList.add('text-lg');
    else document.documentElement.classList.remove('text-lg');

    if (highContrast) document.documentElement.classList.add('high-contrast');
    else document.documentElement.classList.remove('high-contrast');

    if (reducedMotion) document.documentElement.classList.add('reduced-motion');
    else document.documentElement.classList.remove('reduced-motion');
  }, [largeText, highContrast, reducedMotion]);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-4">
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full w-12 h-12 shadow-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800"
      >
        <Accessibility size={24} />
      </Button>

      {isOpen && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
          <h4 className="font-semibold text-sm mb-1">Accessibility</h4>
          
          <Button 
            variant={largeText ? "default" : "outline"} 
            className="w-full justify-start gap-2"
            onClick={() => setLargeText(!largeText)}
          >
            <Type size={16} /> Large Text
          </Button>
          
          <Button 
            variant={highContrast ? "default" : "outline"} 
            className="w-full justify-start gap-2"
            onClick={() => setHighContrast(!highContrast)}
          >
            <Contrast size={16} /> High Contrast
          </Button>

          <Button 
            variant={reducedMotion ? "default" : "outline"} 
            className="w-full justify-start gap-2"
            onClick={() => setReducedMotion(!reducedMotion)}
          >
            <MonitorOff size={16} /> Reduced Motion
          </Button>
        </div>
      )}
    </div>
  );
}
