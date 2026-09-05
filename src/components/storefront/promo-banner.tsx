"use client";

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-primary/20 backdrop-blur-md border-b border-primary/20 relative z-[60]"
        >
          <div className="container mx-auto px-4 py-2 flex items-center justify-center text-sm font-medium text-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            <span>New Arrival! The <span className="font-bold underline decoration-secondary underline-offset-4">Premium Saffron</span> collection is now live. Limited stock available.</span>
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
