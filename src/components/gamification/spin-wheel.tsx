'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { Gift } from 'lucide-react';

const SECTORS = [
  { label: '10 Pts', color: '#C85B43' },
  { label: '50 Pts', color: '#DDA77B' },
  { label: 'Oops!', color: '#4A5D23' },
  { label: '100 Pts', color: '#8B4513' },
  { label: '10 Pts', color: '#C85B43' },
  { label: '25 Pts', color: '#DDA77B' },
];

export function SpinWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState('');

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setWon('');
    
    const newRotation = rotation + 1440 + Math.random() * 360;
    setRotation(newRotation);
    
    setTimeout(() => {
      setSpinning(false);
      const degree = newRotation % 360;
      const sectorIndex = Math.floor((360 - degree) / (360 / SECTORS.length)) % SECTORS.length;
      const prize = SECTORS[sectorIndex].label;
      setWon(prize);
      
      if (prize !== 'Oops!') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <Gift className="text-orange-600" />
        <h3 className="font-heading font-semibold text-xl">Daily Spin</h3>
      </div>
      
      <div className="relative w-64 h-64 mb-8">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-orange-600 z-10" />
        
        <motion.div 
          className="w-full h-full rounded-full border-4 border-zinc-900 dark:border-zinc-700 shadow-xl overflow-hidden relative"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, type: 'tween', ease: 'circOut' }}
        >
          {SECTORS.map((sector, i) => {
            const angle = 360 / SECTORS.length;
            const rotate = angle * i;
            return (
              <div 
                key={i}
                className="absolute w-full h-full"
                style={{
                  clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)',
                  transform: `rotate(${rotate - angle/2}deg)`,
                  backgroundColor: sector.color,
                }}
              >
                <div 
                  className="absolute top-1/2 left-3/4 -translate-y-1/2 -translate-x-1/2 text-white font-bold text-sm"
                  style={{ transform: 'rotate(90deg)' }}
                >
                  {sector.label}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {won ? (
        <div className="text-center animate-in zoom-in">
          <p className="text-lg font-bold text-orange-600">{won === 'Oops!' ? 'Better luck tomorrow!' : `You won ${won}!`}</p>
          <Button className="mt-4" variant="outline" onClick={() => setWon('')}>Try Again</Button>
        </div>
      ) : (
        <Button onClick={spin} disabled={spinning} className="bg-orange-600 hover:bg-orange-700 text-white px-8 rounded-full shadow-md">
          {spinning ? 'Spinning...' : 'Spin Now'}
        </Button>
      )}
    </div>
  );
}
