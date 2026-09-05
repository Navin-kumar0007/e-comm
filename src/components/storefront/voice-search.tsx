'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function VoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const router = useRouter();
  
  // @ts-ignore
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ (event: any) => {
          const current = event.resultIndex;
          const result = event.results[current][0].transcript;
          setTranscript(result);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast.error(`Voice search error: ${event.error}`);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // When listening stops and we have a transcript, trigger search
  useEffect(() => {
    if (!isListening && transcript.trim() !== '') {
      toast.success(`Searching for "${transcript}"`);
      router.push(`/shop?q=${encodeURIComponent(transcript.trim())}`);
      setTimeout(() => setTranscript(''), 1000); // Clear after a moment
    }
  }, [isListening, transcript, router]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      toast.error('Voice search is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      toast('Listening...', {
        icon: <Mic className="w-4 h-4 text-primary animate-pulse" />
      });
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleListen}
      className={`absolute right-0 top-0 h-9 w-9 rounded-r-full transition-all ${
        isListening ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-transparent text-primary hover:text-primary/80'
      }`}
      title="Voice Search"
    >
      {isListening ? (
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary flex items-center justify-center">
             <Mic className="h-2.5 w-2.5 text-primary-foreground" />
          </span>
        </span>
      ) : (
        <Mic className="h-4 w-4" />
      )}
      <span className="sr-only">Voice Search</span>
    </Button>
  );
}
