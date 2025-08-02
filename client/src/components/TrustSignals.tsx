import { memo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Star, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Award,
  Zap,
  Lock,
  Globe
} from 'lucide-react';
import { SiProducthunt, SiTrustpilot } from 'react-icons/si';

interface TrustSignalProps {
  variant?: 'default' | 'minimal' | 'prominent';
  showAnimation?: boolean;
  className?: string;
}

// Individual Trust Signal Components
export const SecurityBadge = memo(({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-2 bg-green-50 rounded-full px-3 py-1.5 border border-green-200 ${className}`}>
    <Shield className="w-4 h-4 text-green-600" />
    <span className="text-sm font-semibold text-green-800">SSL Secured</span>
  </div>
));

export const UserCountBadge = memo(({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1.5 border border-blue-200 ${className}`}>
    <Users className="w-4 h-4 text-blue-600" />
    <span className="text-sm font-semibold text-blue-800">1,200+ Creators</span>
  </div>
));

export const RatingBadge = memo(({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-2 bg-yellow-50 rounded-full px-3 py-1.5 border border-yellow-200 ${className}`}>
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <span className="text-sm font-semibold text-yellow-800">4.8/5</span>
  </div>
));

export const SpeedBadge = memo(({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-2 bg-purple-50 rounded-full px-3 py-1.5 border border-purple-200 ${className}`}>
    <Zap className="w-4 h-4 text-purple-600" />
    <span className="text-sm font-semibold text-purple-800">30s Generation</span>
  </div>
));

// Live Activity Indicator
export const LiveActivityIndicator = memo(() => {
  const [currentActivity, setCurrentActivity] = useState(0);
  
  const activities = [
    { icon: Users, text: "Sarah just generated 10 hooks", color: "text-blue-600" },
    { icon: TrendingUp, text: "Mike upgraded to Pro plan", color: "text-green-600" },
    { icon: Star, text: "Emma rated us 5 stars", color: "text-yellow-600" },
    { icon: Zap, text: "Alex created viral TikTok hook", color: "text-purple-600" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const Activity = activities[currentActivity];

  return (
    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-200 shadow-sm animate-fadeIn">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <Activity.icon className={`w-4 h-4 ${Activity.color}`} />
      <span className="text-sm text-slate-700">{Activity.text}</span>
    </div>
  );
});

// Money-Back Guarantee Badge
export const MoneyBackGuarantee = memo(({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 bg-green-50 rounded-full px-4 py-2 border border-green-200 ${className}`}>
    <Shield className="w-5 h-5 text-green-600" />
    <span className="text-sm font-semibold text-green-800">30-Day Money-Back Guarantee</span>
  </div>
));

// Product Hunt Badge
export const ProductHuntBadge = memo(({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 bg-orange-50 rounded-full px-3 py-1.5 border border-orange-200 ${className}`}>
    <SiProducthunt className="w-4 h-4 text-orange-600" />
    <span className="text-sm font-semibold text-orange-800">Featured on Product Hunt</span>
  </div>
));

// No Credit Card Required Badge
export const NoCreditCardBadge = memo(({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1.5 border border-blue-200 ${className}`}>
    <CheckCircle className="w-4 h-4 text-blue-600" />
    <span className="text-sm font-semibold text-blue-800">No Credit Card Required</span>
  </div>
));

// GDPR Compliance Badge
export const GDPRBadge = memo(({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200 ${className}`}>
    <Globe className="w-4 h-4 text-gray-600" />
    <span className="text-sm font-semibold text-gray-800">GDPR Compliant</span>
  </div>
));

// Composite Trust Signal Groups
export const TrustSignalGroup = memo(({ variant = 'default', showAnimation = true, className = '' }: TrustSignalProps) => {
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <SecurityBadge />
        <UserCountBadge />
      </div>
    );
  }

  if (variant === 'prominent') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SecurityBadge />
          <UserCountBadge />
          <RatingBadge />
          <SpeedBadge />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ProductHuntBadge />
          <NoCreditCardBadge />
          <GDPRBadge />
        </div>
        {showAnimation && (
          <div className="flex justify-center">
            <LiveActivityIndicator />
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <SecurityBadge />
      <UserCountBadge />
      <RatingBadge />
      <SpeedBadge />
    </div>
  );
});

// Social Proof Statistics
export const SocialProofStats = memo(({ className = '' }: { className?: string }) => (
  <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
    <div className="text-center space-y-2">
      <div className="text-3xl font-bold text-navy">1,200+</div>
      <div className="text-sm text-slate-600">Active Creators</div>
    </div>
    <div className="text-center space-y-2">
      <div className="text-3xl font-bold text-navy">50K+</div>
      <div className="text-sm text-slate-600">Hooks Generated</div>
    </div>
    <div className="text-center space-y-2">
      <div className="text-3xl font-bold text-navy">30s</div>
      <div className="text-sm text-slate-600">Avg. Generation</div>
    </div>
    <div className="text-center space-y-2">
      <div className="text-3xl font-bold text-navy">4.8★</div>
      <div className="text-sm text-slate-600">User Rating</div>
    </div>
  </div>
));

// Real-time Signup Counter
export const RealtimeSignupCounter = memo(({ className = '' }: { className?: string }) => {
  const [signupCount, setSignupCount] = useState(247);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate realistic signup increments
      if (Math.random() < 0.3) { // 30% chance every 10 seconds
        setSignupCount(prev => prev + 1);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 bg-red-50 rounded-full px-4 py-2 border border-red-200 ${className}`}>
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-sm text-red-800">
        <strong>{signupCount} creators</strong> joined this week
      </span>
    </div>
  );
});

SecurityBadge.displayName = 'SecurityBadge';
UserCountBadge.displayName = 'UserCountBadge';
RatingBadge.displayName = 'RatingBadge';
SpeedBadge.displayName = 'SpeedBadge';
LiveActivityIndicator.displayName = 'LiveActivityIndicator';
MoneyBackGuarantee.displayName = 'MoneyBackGuarantee';
ProductHuntBadge.displayName = 'ProductHuntBadge';
NoCreditCardBadge.displayName = 'NoCreditCardBadge';
GDPRBadge.displayName = 'GDPRBadge';
TrustSignalGroup.displayName = 'TrustSignalGroup';
SocialProofStats.displayName = 'SocialProofStats';
RealtimeSignupCounter.displayName = 'RealtimeSignupCounter';