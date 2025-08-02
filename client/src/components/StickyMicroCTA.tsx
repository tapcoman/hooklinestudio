import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import { analytics } from '../lib/analytics';

export function StickyMicroCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section (approximately 600px)
      const scrolled = window.scrollY > 600;
      setIsVisible(scrolled && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-navy text-white rounded-full px-6 py-3 shadow-lg border border-navy/20 flex items-center gap-3">
        <span className="text-sm font-medium">Try 10 hooks on your idea</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-auto p-0 text-white hover:text-brass"
          onClick={() => {
            analytics.trackStickyCta();
            setLocation('/onboarding');
          }}
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-auto p-1 text-white/70 hover:text-white"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}