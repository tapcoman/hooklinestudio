import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Sparkles, 
  Play, 
  Zap, 
  Target, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle,
  Shield
} from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from 'react-icons/si';
import { useReducedMotionSafe } from '../hooks/useReducedMotionSafe';
import { analytics } from '../lib/analytics';

interface InteractiveCTAProps {
  variant?: 'primary' | 'secondary' | 'platform-specific' | 'urgent' | 'minimal';
  platform?: 'tiktok' | 'instagram' | 'youtube' | 'all';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUrgency?: boolean;
  showSocialProof?: boolean;
  customText?: string;
  onAction?: () => void;
  className?: string;
  context?: string; // for analytics tracking
}

// Platform-specific CTA configurations
const platformConfigs = {
  tiktok: {
    icon: SiTiktok,
    color: 'text-black',
    bgColor: 'bg-black hover:bg-black/90',
    text: 'Create TikTok Hooks',
    description: 'Generate viral TikTok hooks in 30 seconds'
  },
  instagram: {
    icon: SiInstagram,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700',
    text: 'Create Instagram Hooks',
    description: 'Perfect hooks for Reels and Stories'
  },
  youtube: {
    icon: SiYoutube,
    color: 'text-red-600',
    bgColor: 'bg-red-600 hover:bg-red-700',
    text: 'Create YouTube Hooks',
    description: 'Engaging hooks for YouTube Shorts'
  },
  all: {
    icon: Sparkles,
    color: 'text-brass',
    bgColor: 'bg-gradient-to-r from-navy to-navy/90 hover:from-navy/90 hover:to-navy',
    text: 'Create Platform-Ready Hooks',
    description: 'Generate hooks for all platforms'
  }
};

const ButtonStatesComponent = ({ 
  variant = 'primary',
  platform = 'all',
  size = 'lg',
  showUrgency = false,
  showSocialProof = false,
  customText,
  onAction,
  className = '',
  context = 'unknown'
}: InteractiveCTAProps) => {
  const prefersReducedMotion = useReducedMotionSafe();
  const [buttonState, setButtonState] = useState<'idle' | 'hover' | 'loading' | 'success'>('idle');
  const [urgencyCount, setUrgencyCount] = useState(247);

  const platformConfig = platformConfigs[platform];

  // Simulate urgency counter
  useEffect(() => {
    if (showUrgency) {
      const interval = setInterval(() => {
        if (Math.random() < 0.3) {
          setUrgencyCount(prev => prev + 1);
        }
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [showUrgency]);

  const handleClick = useCallback(async () => {
    if (buttonState === 'loading') return;

    setButtonState('loading');
    
    // Track analytics
    analytics.trackCtaStartedFree(`interactive_cta_${context}_${platform}`);
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (onAction) {
      onAction();
    } else {
      // Default action - navigate to onboarding
      window.location.href = '/onboarding';
    }
    
    setButtonState('success');
  }, [buttonState, onAction, context, platform]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-4 py-2 text-sm';
      case 'md': return 'px-6 py-3 text-base';
      case 'lg': return 'px-8 py-4 text-lg';
      case 'xl': return 'px-12 py-6 text-xl';
      default: return 'px-8 py-4 text-lg';
    }
  };

  // Primary CTA Button
  if (variant === 'primary') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Urgency indicator */}
        {showUrgency && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-red-50 rounded-full px-4 py-2 border border-red-200">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-800">
                <strong>{urgencyCount} creators</strong> joined this week
              </span>
            </div>
          </div>
        )}

        <div className="relative">
          <Button
            onClick={handleClick}
            disabled={buttonState === 'loading' || disabled || loading}
            className={`${getSizeClasses()} ${platformConfig.bgColor} text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group font-semibold`}
            data-testid={`${testId}-button`}
            type="button"
            onMouseEnter={() => setButtonState('hover')}
            onMouseLeave={() => setButtonState('idle')}
          >
            <span className="relative z-10 flex items-center gap-3">
              {buttonState === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </>
              ) : buttonState === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Ready!
                </>
              ) : (
                <>
                  {customText || platformConfig.text}
                  <platformConfig.icon className="w-5 h-5" />
                </>
              )}
            </span>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-brass to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </Button>

          {/* Social proof */}
          {showSocialProof && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>1,200+ creators</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>30s setup</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Platform-specific CTA
  if (variant === 'platform-specific') {
    return (
      <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl bg-slate-50 ${platformConfig.color}`}>
            <platformConfig.icon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-semibold text-navy text-lg">{platformConfig.text}</h3>
            <p className="text-slate-600 text-sm">{platformConfig.description}</p>
          </div>
        </div>
        
        <Button
          onClick={handleClick}
          disabled={buttonState === 'loading'}
          className={`w-full ${getSizeClasses()} ${platformConfig.bgColor} text-white rounded-xl font-semibold transition-all duration-300 relative overflow-hidden group`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {buttonState === 'loading' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Start Creating
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </span>
        </Button>
      </div>
    );
  }

  // Urgent CTA
  if (variant === 'urgent') {
    return (
      <div className={`relative ${className}`}>
        {/* Pulsing border for urgency */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-60 animate-pulse" />
        
        <div className="relative bg-white rounded-2xl p-6 border-2 border-red-200">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-red-50 rounded-full px-4 py-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-800">Limited Time</span>
            </div>
            
            <h3 className="text-xl font-bold text-navy">
              {customText || 'Start Your Free Trial Now'}
            </h3>
            
            <Button
              onClick={handleClick}
              disabled={buttonState === 'loading'}
              className={`${getSizeClasses()} bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 w-full`}
            >
              {buttonState === 'loading' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Claim Free Access
                </div>
              )}
            </Button>
            
            <p className="text-xs text-slate-500">
              Join {urgencyCount} creators who started this week
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Minimal CTA
  if (variant === 'minimal') {
    return (
      <Button
        onClick={handleClick}
        disabled={buttonState === 'loading'}
        variant="ghost"
        className={`${getSizeClasses()} text-navy hover:text-brass hover:bg-brass/10 font-semibold transition-all duration-300 group ${className}`}
      >
        <span className="flex items-center gap-2">
          {customText || 'Try Free'}
          {buttonState === 'loading' ? (
            <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          )}
        </span>
      </Button>
    );
  }

  // Secondary CTA (default fallback)
  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        onClick={handleClick}
        disabled={buttonState === 'loading'}
        variant="outline"
        className={`${getSizeClasses()} border-2 border-navy text-navy hover:bg-navy hover:text-white rounded-xl font-semibold transition-all duration-300 group`}
      >
        <span className="flex items-center gap-2">
          {buttonState === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              {customText || 'Get Started'}
              <Play className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            </>
          )}
        </span>
      </Button>
      
      {showSocialProof && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Free • No Credit Card • 30s Setup</span>
        </div>
      )}
    </div>
  );
};

// Multi-platform CTA group
export const PlatformCTAGroup = memo(({ className = '' }: { className?: string }) => {
  return (
    <div className={`grid md:grid-cols-3 gap-4 ${className}`}>
      <ButtonStatesComponent
        variant="platform-specific"
        platform="tiktok"
        size="md"
        context="platform_group"
      />
      <ButtonStatesComponent
        variant="platform-specific"
        platform="instagram"
        size="md"
        context="platform_group"
      />
      <ButtonStatesComponent
        variant="platform-specific"
        platform="youtube"
        size="md"
        context="platform_group"
      />
    </div>
  );
});

// A/B Test CTA variants
export const ABTestCTAGroup = memo(({ className = '' }: { className?: string }) => {
  const [variant] = useState(() => Math.random() > 0.5 ? 'A' : 'B');
  
  return (
    <div className={className}>
      {variant === 'A' ? (
        <ButtonStatesComponent
          variant="primary"
          customText="Start Creating Viral Hooks"
          showSocialProof
          context="ab_test_a"
        />
      ) : (
        <ButtonStatesComponent
          variant="urgent"
          customText="Join 1,200+ Successful Creators"
          showUrgency
          context="ab_test_b"
        />
      )}
    </div>
  );
});

export const InteractiveCTA = memo(ButtonStatesComponent);

// Set display names for debugging
InteractiveCTA.displayName = 'InteractiveCTA';
PlatformCTAGroup.displayName = 'PlatformCTAGroup';
ABTestCTAGroup.displayName = 'ABTestCTAGroup';