import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Shield,
  Zap,
  Play,
  Heart,
  Share2,
  Copy,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from 'react-icons/si';

// Mobile-First Hero Component
export const MobileHero = memo(() => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="px-4 py-8 space-y-6">
      {/* Trust Signal Banner */}
      <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-green-800">1,200+ creators online</span>
        </div>
      </div>
      
      {/* Main Headline */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-heading font-bold text-navy leading-tight">
          Win the first <span className="text-brass">2 seconds</span>
          <br />of every video
        </h1>
        
        <p className="text-lg text-slate-600 leading-relaxed">
          Generate 10 platform-ready hooks from any idea with AI
        </p>
      </div>
      
      {/* Platform Support */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-slate-200 shadow-sm">
          <SiTiktok className="w-4 h-4" />
          <span className="text-sm font-medium text-slate-700">TikTok</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-slate-200 shadow-sm">
          <SiInstagram className="w-4 h-4 text-pink-600" />
          <span className="text-sm font-medium text-slate-700">Instagram</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-slate-200 shadow-sm">
          <SiYoutube className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-slate-700">YouTube</span>
        </div>
      </div>
      
      {/* Primary CTA */}
      <div className="space-y-4">
        <Button 
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-navy to-navy/90 hover:from-navy/90 hover:to-navy text-white rounded-2xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200"
        >
          <span className="flex items-center justify-center gap-3">
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </span>
        </Button>
        
        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-green-600" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>30s setup</span>
          </div>
        </div>
      </div>
      
      {/* Expandable Details */}
      <div className="text-center">
        <Button
          variant="ghost"
          className="text-sm text-slate-600 hover:text-navy"
          onClick={() => setShowDetails(!showDetails)}
        >
          Learn more about our approach
          <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
        </Button>
        
        {showDetails && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brass rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-navy">Framework-backed hooks</h4>
                <p className="text-sm text-slate-600">Based on proven copywriting frameworks that actually work</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brass rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-navy">Platform-optimized</h4>
                <p className="text-sm text-slate-600">Tailored for TikTok, Instagram, and YouTube algorithms</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brass rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-navy">Tri-modal approach</h4>
                <p className="text-sm text-slate-600">Verbal hooks + visual suggestions + text overlays</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Mobile-Optimized Hook Card
export const MobileHookCard = memo(({ 
  hook, 
  framework, 
  platform,
  className = ''
}: {
  hook: string;
  framework: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  className?: string;
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  const platformIcons = {
    tiktok: SiTiktok,
    instagram: SiInstagram,
    youtube: SiYoutube
  };
  
  const platformColors = {
    tiktok: 'text-black',
    instagram: 'text-pink-600',
    youtube: 'text-red-600'
  };
  
  const PlatformIcon = platformIcons[platform];
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hook);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [hook]);
  
  return (
    <Card className={`border-l-4 border-l-brass/30 ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformIcon className={`w-5 h-5 ${platformColors[platform]}`} />
            <Badge variant="secondary" className="text-xs">
              {framework}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowActions(!showActions)}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showActions ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        
        {/* Hook Content */}
        <div 
          className="space-y-2 cursor-pointer"
          onClick={() => setShowActions(!showActions)}
        >
          <p className="text-navy font-medium leading-relaxed text-base">
            "{hook}"
          </p>
        </div>
        
        {/* Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span>4.2</span>
          </div>
          <span className="text-xs text-slate-500">High engagement potential</span>
        </div>
        
        {/* Expandable Actions */}
        {showActions && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className={`h-12 flex flex-col items-center gap-1 ${
                isFavorited ? 'bg-red-50 border-red-200 text-red-600' : ''
              }`}
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              <span className="text-xs">Save</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className={`h-12 flex flex-col items-center gap-1 ${
                isCopied ? 'bg-green-50 border-green-200 text-green-600' : ''
              }`}
              onClick={handleCopy}
            >
              {isCopied ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="text-xs">{isCopied ? 'Copied' : 'Copy'}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-12 flex flex-col items-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Share</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Mobile Bottom Navigation
export const MobileBottomNav = memo(({ 
  activeTab = 'generate',
  onTabChange
}: {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) => {
  const tabs = [
    { id: 'generate', label: 'Generate', icon: Zap },
    { id: 'favorites', label: 'Saved', icon: Heart },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'profile', label: 'Profile', icon: Users }
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-padding-bottom z-40">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            className={`h-16 flex flex-col items-center gap-1 rounded-none ${
              activeTab === id ? 'text-brass bg-brass/5' : 'text-slate-600'
            }`}
            onClick={() => onTabChange?.(id)}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
            {activeTab === id && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-brass rounded-full" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
});

// Mobile Sticky CTA
export const MobileStickyCTA = memo(({ 
  text = 'Start Free Trial',
  onClick,
  visible = true
}: {
  text?: string;
  onClick?: () => void;
  visible?: boolean;
}) => {
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-20 left-4 right-4 z-30 safe-area-padding-bottom">
      <Button 
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-navy to-navy/90 hover:from-navy/90 hover:to-navy text-white rounded-2xl shadow-xl hover:shadow-2xl transform active:scale-95 transition-all duration-200"
        onClick={onClick}
      >
        <span className="flex items-center justify-center gap-3">
          {text}
          <ArrowRight className="w-5 h-5" />
        </span>
      </Button>
    </div>
  );
});

// Mobile Demo Component
export const MobileDemo = memo(() => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { title: 'Enter your idea', description: 'Type any video topic or concept' },
    { title: 'Pick platform', description: 'Choose TikTok, Instagram, or YouTube' },
    { title: 'Get 10 hooks', description: 'Receive platform-optimized hooks instantly' }
  ];
  
  useEffect(() => {
    if (!isExpanded) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isExpanded]);
  
  return (
    <Card className="mx-4 border-2 border-brass/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-navy">Try it now</h3>
            <p className="text-sm text-slate-600">No signup required</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Demo'}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="space-y-4">
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                    index <= currentStep ? 'bg-brass' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            
            {/* Current Step */}
            <div className="text-center space-y-2">
              <h4 className="font-semibold text-navy">{steps[currentStep].title}</h4>
              <p className="text-sm text-slate-600">{steps[currentStep].description}</p>
            </div>
            
            {/* Demo Video Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
              <Button
                className="w-16 h-16 rounded-full bg-white/90 hover:bg-white text-navy hover:text-brass shadow-lg"
              >
                <Play className="w-6 h-6 ml-1" />
              </Button>
            </div>
            
            <Button 
              className="w-full h-12 bg-brass hover:bg-brass/90 text-navy font-semibold rounded-xl"
            >
              Try the Full Version
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Mobile Trust Signals
export const MobileTrustSignals = memo(() => {
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-navy mb-4">Trusted by creators worldwide</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center space-y-2 p-4 bg-white rounded-xl border border-slate-200">
          <Users className="w-8 h-8 text-blue-600 mx-auto" />
          <div className="text-2xl font-bold text-navy">1,200+</div>
          <div className="text-sm text-slate-600">Active creators</div>
        </div>
        
        <div className="text-center space-y-2 p-4 bg-white rounded-xl border border-slate-200">
          <Star className="w-8 h-8 text-yellow-500 mx-auto" />
          <div className="text-2xl font-bold text-navy">4.8★</div>
          <div className="text-sm text-slate-600">User rating</div>
        </div>
        
        <div className="text-center space-y-2 p-4 bg-white rounded-xl border border-slate-200">
          <Zap className="w-8 h-8 text-purple-600 mx-auto" />
          <div className="text-2xl font-bold text-navy">30s</div>
          <div className="text-sm text-slate-600">Generation time</div>
        </div>
        
        <div className="text-center space-y-2 p-4 bg-white rounded-xl border border-slate-200">
          <Shield className="w-8 h-8 text-green-600 mx-auto" />
          <div className="text-2xl font-bold text-navy">SSL</div>
          <div className="text-sm text-slate-600">Secured</div>
        </div>
      </div>
      
      {/* Live Activity */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center gap-2 text-sm text-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>247 creators joined this week</span>
        </div>
      </div>
    </div>
  );
});

// Mobile Urgency Banner
export const MobileUrgencyBanner = memo(({ 
  onClose 
}: {
  onClose?: () => void;
}) => {
  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 relative">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm mb-1">
          <TrendingUp className="w-4 h-4" />
          <span className="font-semibold">Limited Beta Access</span>
        </div>
        <p className="text-xs opacity-90">Only 127 spots remaining</p>
      </div>
      
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
});

MobileHero.displayName = 'MobileHero';
MobileHookCard.displayName = 'MobileHookCard';
MobileBottomNav.displayName = 'MobileBottomNav';
MobileStickyCTA.displayName = 'MobileStickyCTA';
MobileDemo.displayName = 'MobileDemo';
MobileTrustSignals.displayName = 'MobileTrustSignals';
MobileUrgencyBanner.displayName = 'MobileUrgencyBanner';