import { memo, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, X, Sparkles, Zap, Users, Clock, Play } from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from 'react-icons/si';
import { analytics } from '../lib/analytics';
import { useMobile } from '../hooks/use-mobile';

interface StickyMicroCTAProps {
  variant?: 'minimal' | 'expanded' | 'platform-aware' | 'progressive';
}

const StickyMicroCTAComponent = ({ variant = 'progressive' }: StickyMicroCTAProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentVariant, setCurrentVariant] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [, setLocation] = useLocation();
  const isMobile = useMobile();

  // CTA variants for progressive disclosure
  const ctaVariants = [
    { text: "Try 10 hooks on your idea", icon: Sparkles, action: "basic" },
    { text: "Generate viral hooks in 30s", icon: Zap, action: "speed" },
    { text: "Join 1,200+ creators", icon: Users, action: "social" },
    { text: "Watch 45s demo", icon: Play, action: "demo" }
  ];

  const platformIcons = [SiTiktok, SiInstagram, SiYoutube];

  // Calculate scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrolled / maxScroll, 1);
      setScrollProgress(progress);
      
      // Show after scrolling past hero section (approximately 600px)
      const shouldShow = scrolled > 600;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  // Progressive disclosure - change variant based on scroll progress
  useEffect(() => {
    if (variant === 'progressive') {
      const variantIndex = Math.floor(scrollProgress * ctaVariants.length);
      setCurrentVariant(Math.min(variantIndex, ctaVariants.length - 1));
    }
  }, [scrollProgress, variant]);

  const handleCtaClick = useCallback((actionType: string) => {
    analytics.trackStickyCta(actionType);
    
    if (actionType === 'demo') {
      // Could open a demo modal instead
      analytics.track('sticky_cta_demo_clicked');
    }
    
    setLocation('/onboarding');
  }, [setLocation]);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    analytics.track('sticky_cta_expanded');
  }, []);

  if (!isVisible) return null;

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-navy text-white rounded-full px-4 py-2 shadow-lg border border-navy/20 flex items-center gap-2">
          <span className="text-sm font-medium">Try Free</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-auto p-1 text-white hover:text-brass"
            onClick={() => handleCtaClick('minimal')}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-auto p-1 text-white/70 hover:text-white"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Platform-aware variant
  if (variant === 'platform-aware') {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white/95 backdrop-blur-md text-navy rounded-2xl px-6 py-4 shadow-xl border border-slate-200 max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {platformIcons.map((Icon, index) => (
                  <Icon key={index} className="w-4 h-4 text-slate-600" />
                ))}
              </div>
              <span className="text-sm font-semibold">Create for all platforms</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-navy text-white hover:bg-navy/90 rounded-xl px-4 py-2"
                onClick={() => handleCtaClick('platform_aware')}
              >
                Start
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="p-1 text-slate-400 hover:text-slate-600"
                onClick={() => setIsDismissed(true)}
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expanded variant
  if (variant === 'expanded' || isExpanded) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gradient-to-r from-navy to-navy/90 text-white rounded-2xl p-4 shadow-xl border border-navy/20 max-w-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brass" />
                <span className="font-semibold">Hook Line Studio</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="p-1 text-white/70 hover:text-white"
                onClick={() => setIsDismissed(true)}
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-white/90">
              Generate 10 platform-ready hooks from any idea in 30 seconds
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-white text-navy hover:bg-white/90 rounded-xl font-semibold"
                onClick={() => handleCtaClick('expanded_primary')}
              >
                Try Free
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="px-3 text-white hover:text-brass border border-white/20 rounded-xl"
                onClick={() => handleCtaClick('expanded_demo')}
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-xs text-white/70">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>30s setup</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>1,200+ users</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Progressive variant (default)
  const currentCTA = ctaVariants[currentVariant];
  const CurrentIcon = currentCTA.icon;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-navy text-white rounded-full px-6 py-3 shadow-lg border border-navy/20 flex items-center gap-3 transition-all duration-500">
        <CurrentIcon className="w-4 h-4 text-brass" />
        <span className="text-sm font-medium">{currentCTA.text}</span>
        
        <div className="flex items-center gap-2">
          {!isExpanded && scrollProgress > 0.5 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-auto p-1 text-white/70 hover:text-white"
              onClick={handleExpand}
              aria-label="Show more options"
            >
              <Sparkles className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="h-auto p-0 text-white hover:text-brass transition-colors duration-200"
            onClick={() => handleCtaClick(currentCTA.action)}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-auto p-1 text-white/70 hover:text-white"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Progress indicator */}
        {variant === 'progressive' && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-brass rounded-full transition-all duration-300" 
               style={{ width: `${scrollProgress * 100}%` }} />
        )}
      </div>
    </div>
  );
};

export const StickyMicroCTA = memo(StickyMicroCTAComponent);
StickyMicroCTA.displayName = 'StickyMicroCTA';