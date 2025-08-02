import { memo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Flame, 
  Timer,
  Zap,
  Users,
  Target,
  Sparkles
} from 'lucide-react';

interface UrgencyIndicatorProps {
  variant?: 'subtle' | 'prominent' | 'banner';
  className?: string;
}

// Limited Time Offer Banner
export const LimitedTimeBanner = memo(({ className = '' }: { className?: string }) => (
  <div className={`bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 text-center ${className}`}>
    <div className="flex items-center justify-center gap-2 text-sm">
      <TrendingUp className="w-4 h-4" />
      <span className="font-semibold">Limited Beta Access:</span>
      <span>Only 500 spots remaining</span>
      <Badge className="bg-white/20 text-white border-white/30 ml-2">
        Act Fast
      </Badge>
    </div>
  </div>
));

// Countdown Timer Component
export const CountdownTimer = memo(({ className = '' }: { className?: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 47,
    seconds: 32
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset to maintain urgency
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`inline-flex items-center gap-3 bg-red-50 rounded-lg px-4 py-3 border border-red-200 ${className}`}>
      <Timer className="w-5 h-5 text-red-600" />
      <div className="text-sm">
        <div className="font-semibold text-red-800">Free trial ends in:</div>
        <div className="flex items-center gap-1 font-mono text-red-700">
          <span className="bg-red-100 px-2 py-1 rounded text-xs font-bold">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span>:</span>
          <span className="bg-red-100 px-2 py-1 rounded text-xs font-bold">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span>:</span>
          <span className="bg-red-100 px-2 py-1 rounded text-xs font-bold">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
});

// Live Activity Urgency
export const LiveActivityUrgency = memo(({ className = '' }: { className?: string }) => {
  const [currentActivity, setCurrentActivity] = useState(0);
  
  const activities = [
    "Sarah just upgraded to Pro",
    "3 people viewing this page",
    "Mike signed up 2 minutes ago",
    "Emma just generated 10 hooks",
    "2 spots left in beta",
    "Alex just started free trial"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 bg-orange-50 rounded-full px-3 py-1.5 border border-orange-200 animate-pulse ${className}`}>
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
      <span className="text-sm font-medium text-orange-800">
        {activities[currentActivity]}
      </span>
    </div>
  );
});

// High Demand Indicator
export const HighDemandIndicator = memo(({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 bg-yellow-50 rounded-full px-4 py-2 border border-yellow-200 ${className}`}>
    <Flame className="w-4 h-4 text-yellow-600" />
    <span className="text-sm font-semibold text-yellow-800">High Demand</span>
    <Badge className="bg-yellow-200 text-yellow-800 text-xs">
      Trending
    </Badge>
  </div>
));

// Spots Remaining Counter
export const SpotsRemaining = memo(({ className = '' }: { className?: string }) => {
  const [spotsLeft, setSpotsLeft] = useState(127);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance every 30 seconds
        setSpotsLeft(prev => Math.max(1, prev - 1));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 bg-red-50 rounded-lg px-4 py-2 border border-red-200 ${className}`}>
      <Target className="w-4 h-4 text-red-600" />
      <div className="text-sm">
        <div className="font-semibold text-red-800">
          Only {spotsLeft} spots left
        </div>
        <div className="text-red-600 text-xs">
          In limited beta access
        </div>
      </div>
    </div>
  );
});

// Recently Joined Indicator
export const RecentlyJoined = memo(({ className = '' }: { className?: string }) => {
  const [recentCount, setRecentCount] = useState(247);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.4) { // 40% chance every 15 seconds
        setRecentCount(prev => prev + 1);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 bg-green-50 rounded-full px-4 py-2 border border-green-200 ${className}`}>
      <Users className="w-4 h-4 text-green-600" />
      <span className="text-sm font-semibold text-green-800">
        {recentCount} creators joined this week
      </span>
    </div>
  );
});

// Flash Sale Badge
export const FlashSaleBadge = memo(({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-4 py-2 animate-bounce ${className}`}>
    <Sparkles className="w-4 h-4" />
    <span className="text-sm font-bold">
      Flash Sale: 50% Off Pro
    </span>
  </div>
));

// Action Required Alert
export const ActionRequiredAlert = memo(({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2 border border-blue-200 border-l-4 border-l-blue-500 ${className}`}>
    <AlertCircle className="w-4 h-4 text-blue-600" />
    <div className="text-sm">
      <div className="font-semibold text-blue-800">
        Complete signup to secure your spot
      </div>
      <div className="text-blue-600 text-xs">
        Your reservation expires in 15 minutes
      </div>
    </div>
  </div>
));

// Popular Choice Badge
export const PopularChoiceBadge = memo(({ className = '' }: { className?: string }) => (
  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 z-10 ${className}`}>
    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 font-semibold shadow-lg animate-pulse">
      Most Popular
    </Badge>
  </div>
));

// Social Velocity Indicator
export const SocialVelocityIndicator = memo(({ className = '' }: { className?: string }) => {
  const [velocity, setVelocity] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setVelocity(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(1, Math.min(20, prev + change));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 bg-indigo-50 rounded-full px-3 py-1.5 border border-indigo-200 ${className}`}>
      <TrendingUp className="w-4 h-4 text-indigo-600" />
      <span className="text-sm font-medium text-indigo-800">
        {velocity} signups in last hour
      </span>
    </div>
  );
});

// Low Stock Warning
export const LowStockWarning = memo(({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 bg-amber-50 rounded-lg px-4 py-2 border border-amber-200 ${className}`}>
    <AlertCircle className="w-4 h-4 text-amber-600" />
    <div className="text-sm">
      <div className="font-semibold text-amber-800">
        Limited availability
      </div>
      <div className="text-amber-600 text-xs">
        Beta access filling up fast
      </div>
    </div>
  </div>
));

// Composite Urgency Groups
export const UrgencyGroup = memo(({ variant = 'subtle', className = '' }: UrgencyIndicatorProps) => {
  if (variant === 'prominent') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SpotsRemaining />
          <CountdownTimer />
        </div>
        <div className="flex justify-center">
          <LiveActivityUrgency />
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={className}>
        <LimitedTimeBanner />
      </div>
    );
  }

  // Subtle variant (default)
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <RecentlyJoined />
      <HighDemandIndicator />
    </div>
  );
});

LimitedTimeBanner.displayName = 'LimitedTimeBanner';
CountdownTimer.displayName = 'CountdownTimer';
LiveActivityUrgency.displayName = 'LiveActivityUrgency';
HighDemandIndicator.displayName = 'HighDemandIndicator';
SpotsRemaining.displayName = 'SpotsRemaining';
RecentlyJoined.displayName = 'RecentlyJoined';
FlashSaleBadge.displayName = 'FlashSaleBadge';
ActionRequiredAlert.displayName = 'ActionRequiredAlert';
PopularChoiceBadge.displayName = 'PopularChoiceBadge';
SocialVelocityIndicator.displayName = 'SocialVelocityIndicator';
LowStockWarning.displayName = 'LowStockWarning';
UrgencyGroup.displayName = 'UrgencyGroup';