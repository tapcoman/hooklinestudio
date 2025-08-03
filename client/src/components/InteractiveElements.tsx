import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Play, 
  Pause, 
  Sparkles, 
  Zap, 
  Star,
  TrendingUp,
  Eye,
  MousePointer2,
  Heart,
  Share2,
  Download,
  Copy,
  CheckCircle
} from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from 'react-icons/si';

interface InteractiveElementProps {
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

// Enhanced CTA Button with Micro-Interactions
export const EnhancedCTAButton = memo(({ 
  className = '', 
  onClick, 
  disabled = false, 
  children = 'Start Free Trial'
}: InteractiveElementProps & { children?: React.ReactNode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <Button
      className={`
        relative overflow-hidden group
        bg-gradient-to-r from-navy to-navy/90 
        hover:from-navy/90 hover:to-navy 
        text-white rounded-2xl font-semibold 
        px-8 py-4 text-lg
        shadow-lg hover:shadow-2xl 
        transform transition-all duration-300 ease-out
        ${isHovered ? 'scale-105 shadow-navy/25' : 'scale-100'}
        ${isPressed ? 'scale-95' : ''}
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {/* Background Animation */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-r from-brass to-orange-500 
          transform transition-transform duration-300 origin-left
          ${isHovered ? 'scale-x-100' : 'scale-x-0'}
        `} 
        aria-hidden="true" 
      />
      
      {/* Shimmer Effect */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
          transform -skew-x-12 transition-transform duration-700
          ${isHovered ? 'translate-x-full' : '-translate-x-full'}
        `}
        aria-hidden="true"
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-3">
        {children}
        <ArrowRight 
          className={`
            w-5 h-5 transition-transform duration-300
            ${isHovered ? 'translate-x-1' : 'translate-x-0'}
          `} 
          aria-hidden="true" 
        />
      </span>
      
      {/* Pulse Ring on Hover */}
      {isHovered && (
        <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-ping" aria-hidden="true" />
      )}
    </Button>
  );
});

// Interactive Platform Card
export const InteractivePlatformCard = memo(({ 
  platform, 
  icon: Icon, 
  color, 
  onClick,
  className = ''
}: {
  platform: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick?: () => void;
  className?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  return (
    <Card
      className={`
        group cursor-pointer transition-all duration-300 ease-out
        border-2 hover:border-brass/50 
        transform hover:scale-105 hover:-rotate-1
        hover:shadow-xl hover:shadow-brass/10
        ${isActive ? 'ring-2 ring-brass ring-offset-2' : ''}
        ${className}
      `}
      onClick={() => {
        setIsActive(!isActive);
        onClick?.();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6 text-center relative overflow-hidden">
        {/* Background Gradient Animation */}
        <div 
          className={`
            absolute inset-0 bg-gradient-to-br from-white to-slate-50
            transform transition-transform duration-500
            ${isHovered ? 'scale-110' : 'scale-100'}
          `}
          aria-hidden="true"
        />
        
        {/* Icon Container */}
        <div className="relative z-10 space-y-4">
          <div 
            className={`
              w-16 h-16 mx-auto rounded-2xl flex items-center justify-center
              transition-all duration-300 transform
              ${isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}
              bg-gradient-to-br from-slate-100 to-slate-200
              group-hover:from-brass/10 group-hover:to-navy/10
            `}
          >
            <Icon 
              className={`
                w-8 h-8 transition-all duration-300
                ${isHovered ? 'scale-110' : 'scale-100'}
                ${color}
              `} 
            />
          </div>
          
          <div>
            <h3 className={`
              font-semibold text-navy transition-colors duration-300
              ${isHovered ? 'text-brass' : ''}
            `}>
              {platform}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Short-form optimized
            </p>
          </div>
        </div>
        
        {/* Hover Effect Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-navy/5 rounded-lg" aria-hidden="true" />
        )}
        
        {/* Selection Indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 z-20">
            <CheckCircle className="w-6 h-6 text-brass fill-current" />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Animated Statistics Counter
export const AnimatedCounter = memo(({ 
  value, 
  suffix = '', 
  label, 
  icon: Icon,
  className = ''
}: {
  value: number;
  suffix?: string;
  label: string;
  icon?: React.ComponentType<any>;
  className?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (!isVisible) return;
    
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [isVisible, value]);
  
  return (
    <div 
      ref={ref}
      className={`text-center space-y-2 group cursor-default ${className}`}
    >
      {Icon && (
        <div className="flex justify-center">
          <Icon className="w-8 h-8 text-brass group-hover:scale-110 transition-transform duration-300" />
        </div>
      )}
      <div className="text-3xl font-bold text-navy group-hover:text-brass transition-colors duration-300">
        {displayValue.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
});

// Interactive Hook Card with Actions
export const InteractiveHookCard = memo(({ 
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
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
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
    <Card
      className={`
        group transition-all duration-300 ease-out
        hover:shadow-lg hover:shadow-slate-200
        transform hover:scale-102
        border-l-4 border-l-brass/30 hover:border-l-brass
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformIcon className={`w-5 h-5 ${platformColors[platform]}`} />
            <Badge variant="secondary" className="text-xs">
              {framework}
            </Badge>
          </div>
          
          {/* Action Buttons */}
          <div className={`
            flex items-center gap-2 transition-all duration-300
            ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
          `}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart 
                className={`w-4 h-4 transition-colors duration-200 ${
                  isFavorited ? 'fill-red-500 text-red-500' : ''
                }`} 
              />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
              onClick={handleCopy}
            >
              {isCopied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Hook Content */}
        <div className="space-y-2">
          <p className="text-navy font-medium leading-relaxed">
            "{hook}"
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span>4.2</span>
          </div>
          
          <div className={`
            flex items-center gap-2 text-sm text-slate-600
            transition-all duration-300
            ${isHovered ? 'opacity-100' : 'opacity-70'}
          `}>
            <Eye className="w-4 h-4" />
            <span>High engagement potential</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Loading State with Micro-Animations
export const LoadingWithAnimation = memo(({ 
  message = 'Generating hooks...', 
  className = ''
}: {
  message?: string;
  className?: string;
}) => {
  const [currentDot, setCurrentDot] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDot((prev) => (prev + 1) % 3);
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="relative">
        {/* Spinning Ring */}
        <div className="w-12 h-12 mx-auto border-4 border-slate-200 border-t-brass rounded-full animate-spin"></div>
        
        {/* Inner Sparkle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-brass animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-slate-600 font-medium">{message}</p>
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${currentDot === index ? 'bg-brass scale-125' : 'bg-slate-300 scale-100'}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// Floating Action Button
export const FloatingActionButton = memo(({ 
  onClick,
  icon: Icon = Zap,
  className = ''
}: {
  onClick?: () => void;
  icon?: React.ComponentType<any>;
  className?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Button
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-gradient-to-r from-brass to-orange-500
        hover:from-orange-500 hover:to-red-500
        text-white shadow-lg hover:shadow-2xl
        transform transition-all duration-300
        ${isHovered ? 'scale-110' : 'scale-100'}
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon className={`
        w-6 h-6 transition-transform duration-300
        ${isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}
      `} />
      
      {/* Pulse Ring */}
      <div className={`
        absolute inset-0 rounded-full border-2 border-white/50
        transition-all duration-300
        ${isHovered ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
      `} aria-hidden="true" />
    </Button>
  );
});

// Interactive Demo Preview
export const InteractiveDemoPreview = memo(({ 
  className = ''
}: {
  className?: string;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  return (
    <div className={`relative group ${className}`}>
      {/* Video Placeholder */}
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl overflow-hidden relative">
        {/* Progress Bar */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div 
              className="h-full bg-brass transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            className="
              w-16 h-16 rounded-full
              bg-white/90 hover:bg-white
              text-navy hover:text-brass
              shadow-lg hover:shadow-xl
              transform transition-all duration-300
              group-hover:scale-110
            "
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-brass/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Demo Info */}
      <div className="mt-4 text-center">
        <p className="font-semibold text-navy">See Hook Line Studio in Action</p>
        <p className="text-sm text-slate-600">45-second overview</p>
      </div>
    </div>
  );
});

EnhancedCTAButton.displayName = 'EnhancedCTAButton';
InteractivePlatformCard.displayName = 'InteractivePlatformCard';
AnimatedCounter.displayName = 'AnimatedCounter';
InteractiveHookCard.displayName = 'InteractiveHookCard';
LoadingWithAnimation.displayName = 'LoadingWithAnimation';
FloatingActionButton.displayName = 'FloatingActionButton';
InteractiveDemoPreview.displayName = 'InteractiveDemoPreview';