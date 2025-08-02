import { memo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, 
  Zap, 
  Star, 
  TrendingUp, 
  Eye, 
  Heart,
  Play,
  Palette,
  Camera,
  Video,
  Mic,
  Edit3,
  Target,
  Award,
  Crown
} from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube, SiTwitter, SiLinkedin } from 'react-icons/si';

// Creator-Focused Color Palette
export const CreatorColors = {
  // Primary Brand Colors
  navy: '#14233B',
  brass: '#B8863A',
  
  // Platform-Specific Colors
  tiktok: '#000000',
  tiktokAccent: '#FF0050',
  instagram: '#E4405F',
  instagramAccent: '#833AB4',
  youtube: '#FF0000',
  youtubeAccent: '#282828',
  
  // Creator Psychology Colors
  creativity: '#8B5CF6', // Purple - stimulates creativity
  energy: '#F59E0B',     // Orange - high energy
  trust: '#3B82F6',      // Blue - builds trust
  success: '#10B981',    // Green - success/growth
  passion: '#EF4444',    // Red - passion/urgency
  premium: '#6366F1',    // Indigo - premium feel
  
  // Emotional States
  excitement: '#EC4899', // Pink - excitement
  focus: '#06B6D4',      // Cyan - focus/clarity
  inspiration: '#8B5CF6', // Purple - inspiration
  confidence: '#F59E0B'   // Amber - confidence
};

// Platform-Specific Brand Elements
export const PlatformBrand = memo(({ 
  platform, 
  variant = 'default',
  className = ''
}: {
  platform: 'tiktok' | 'instagram' | 'youtube';
  variant?: 'default' | 'minimal' | 'prominent';
  className?: string;
}) => {
  const platformConfig = {
    tiktok: {
      icon: SiTiktok,
      name: 'TikTok',
      color: CreatorColors.tiktok,
      accentColor: CreatorColors.tiktokAccent,
      gradient: 'from-black to-red-600',
      description: 'Viral short-form content',
      keywords: ['viral', 'trending', 'fyp', 'short-form']
    },
    instagram: {
      icon: SiInstagram,
      name: 'Instagram',
      color: CreatorColors.instagram,
      accentColor: CreatorColors.instagramAccent,
      gradient: 'from-pink-500 to-purple-600',
      description: 'Visual storytelling',
      keywords: ['aesthetic', 'reels', 'stories', 'visual']
    },
    youtube: {
      icon: SiYoutube,
      name: 'YouTube',
      color: CreatorColors.youtube,
      accentColor: CreatorColors.youtubeAccent,
      gradient: 'from-red-600 to-gray-800',
      description: 'Long-form & Shorts',
      keywords: ['educational', 'entertainment', 'tutorials', 'vlogs']
    }
  };
  
  const config = platformConfig[platform];
  const Icon = config.icon;
  
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon className="w-4 h-4" style={{ color: config.color }} />
        <span className="text-sm font-medium text-slate-700">{config.name}</span>
      </div>
    );
  }
  
  if (variant === 'prominent') {
    return (
      <Card className={`border-2 hover:shadow-lg transition-all duration-300 ${className}`}>
        <CardContent className="p-6 text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-navy">{config.name}</h3>
            <p className="text-sm text-slate-600">{config.description}</p>
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {config.keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="font-semibold text-navy">{config.name}</div>
        <div className="text-sm text-slate-600">{config.description}</div>
      </div>
    </div>
  );
});

// Creator Persona Indicators
export const CreatorPersona = memo(({ 
  type,
  className = ''
}: {
  type: 'lifestyle' | 'educational' | 'entertainment' | 'business' | 'fitness' | 'food';
  className?: string;
}) => {
  const personaConfig = {
    lifestyle: {
      icon: Heart,
      color: CreatorColors.passion,
      gradient: 'from-pink-500 to-rose-500',
      label: 'Lifestyle',
      description: 'Daily life, fashion, travel'
    },
    educational: {
      icon: Target,
      color: CreatorColors.trust,
      gradient: 'from-blue-500 to-indigo-500',
      label: 'Educational',
      description: 'Tutorials, how-tos, learning'
    },
    entertainment: {
      icon: Play,
      color: CreatorColors.excitement,
      gradient: 'from-purple-500 to-pink-500',
      label: 'Entertainment',
      description: 'Comedy, skits, reactions'
    },
    business: {
      icon: TrendingUp,
      color: CreatorColors.premium,
      gradient: 'from-gray-700 to-blue-600',
      label: 'Business',
      description: 'Entrepreneurship, finance'
    },
    fitness: {
      icon: Zap,
      color: CreatorColors.energy,
      gradient: 'from-orange-500 to-red-500',
      label: 'Fitness',
      description: 'Workouts, health, wellness'
    },
    food: {
      icon: Sparkles,
      color: CreatorColors.success,
      gradient: 'from-green-500 to-yellow-500',
      label: 'Food',
      description: 'Recipes, reviews, cooking'
    }
  };
  
  const config = personaConfig[type];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.gradient} text-white rounded-full px-4 py-2 ${className}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{config.label}</span>
    </div>
  );
});

// Creative Energy Indicators
export const CreativeEnergyBar = memo(({ 
  level = 85,
  label = 'Creative Energy',
  className = ''
}: {
  level?: number;
  label?: string;
  className?: string;
}) => {
  const [animatedLevel, setAnimatedLevel] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedLevel(level);
    }, 300);
    return () => clearTimeout(timer);
  }, [level]);
  
  const getEnergyColor = (level: number) => {
    if (level >= 80) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (level >= 60) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (level >= 40) return 'bg-gradient-to-r from-orange-500 to-red-500';
    return 'bg-gradient-to-r from-red-500 to-pink-500';
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-navy">{level}%</span>
      </div>
      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getEnergyColor(level)} transition-all duration-1000 ease-out relative`}
          style={{ width: `${animatedLevel}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
});

// Brand Mood Selector
export const BrandMood = memo(({ 
  mood,
  onMoodChange,
  className = ''
}: {
  mood: 'energetic' | 'professional' | 'casual' | 'artistic' | 'bold';
  onMoodChange?: (mood: string) => void;
  className?: string;
}) => {
  const moods = [
    { 
      id: 'energetic', 
      label: 'Energetic', 
      icon: Zap, 
      color: CreatorColors.energy,
      gradient: 'from-orange-400 to-red-500'
    },
    { 
      id: 'professional', 
      label: 'Professional', 
      icon: Award, 
      color: CreatorColors.trust,
      gradient: 'from-blue-500 to-indigo-600'
    },
    { 
      id: 'casual', 
      label: 'Casual', 
      icon: Heart, 
      color: CreatorColors.excitement,
      gradient: 'from-pink-400 to-purple-500'
    },
    { 
      id: 'artistic', 
      label: 'Artistic', 
      icon: Palette, 
      color: CreatorColors.creativity,
      gradient: 'from-purple-500 to-indigo-500'
    },
    { 
      id: 'bold', 
      label: 'Bold', 
      icon: Crown, 
      color: CreatorColors.premium,
      gradient: 'from-gray-700 to-purple-600'
    }
  ];
  
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="font-semibold text-navy">Brand Mood</h4>
      <div className="flex flex-wrap gap-2">
        {moods.map((moodOption) => {
          const Icon = moodOption.icon;
          const isSelected = mood === moodOption.id;
          
          return (
            <button
              key={moodOption.id}
              onClick={() => onMoodChange?.(moodOption.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
                ${isSelected 
                  ? `bg-gradient-to-r ${moodOption.gradient} text-white shadow-lg scale-105` 
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{moodOption.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

// Content Type Indicator
export const ContentTypeIndicator = memo(({ 
  type,
  className = ''
}: {
  type: 'video' | 'audio' | 'image' | 'text';
  className?: string;
}) => {
  const typeConfig = {
    video: { icon: Video, color: CreatorColors.youtube, label: 'Video' },
    audio: { icon: Mic, color: CreatorColors.creativity, label: 'Audio' },
    image: { icon: Camera, color: CreatorColors.instagram, label: 'Image' },
    text: { icon: Edit3, color: CreatorColors.navy, label: 'Text' }
  };
  
  const config = typeConfig[type];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200 ${className}`}>
      <Icon className="w-4 h-4" style={{ color: config.color }} />
      <span className="text-sm font-medium text-slate-700">{config.label}</span>
    </div>
  );
});

// Viral Potential Meter
export const ViralPotentialMeter = memo(({ 
  score = 72,
  className = ''
}: {
  score?: number;
  className?: string;
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 500);
    return () => clearTimeout(timer);
  }, [score]);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return { color: CreatorColors.success, label: 'High' };
    if (score >= 60) return { color: CreatorColors.energy, label: 'Good' };
    if (score >= 40) return { color: CreatorColors.passion, label: 'Fair' };
    return { color: CreatorColors.navy, label: 'Low' };
  };
  
  const scoreData = getScoreColor(score);
  
  return (
    <div className={`text-center space-y-3 ${className}`}>
      <div className="relative w-20 h-20 mx-auto">
        {/* Background Circle */}
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke={scoreData.color}
            strokeWidth="3"
            strokeDasharray={`${(animatedScore / 100) * 100}, 100`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-navy">{score}</span>
        </div>
      </div>
      <div>
        <div className="font-semibold text-navy">Viral Potential</div>
        <div className="text-sm" style={{ color: scoreData.color }}>
          {scoreData.label}
        </div>
      </div>
    </div>
  );
});

// Creator Tier Badge
export const CreatorTierBadge = memo(({ 
  tier,
  className = ''
}: {
  tier: 'starter' | 'rising' | 'established' | 'viral';
  className?: string;
}) => {
  const tierConfig = {
    starter: {
      icon: Sparkles,
      label: 'Starter Creator',
      color: CreatorColors.trust,
      gradient: 'from-blue-400 to-blue-600'
    },
    rising: {
      icon: TrendingUp,
      label: 'Rising Creator',
      color: CreatorColors.energy,
      gradient: 'from-orange-400 to-yellow-500'
    },
    established: {
      icon: Award,
      label: 'Established Creator',
      color: CreatorColors.success,
      gradient: 'from-green-400 to-emerald-500'
    },
    viral: {
      icon: Crown,
      label: 'Viral Creator',
      color: CreatorColors.premium,
      gradient: 'from-purple-500 to-pink-500'
    }
  };
  
  const config = tierConfig[tier];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.gradient} text-white rounded-full px-4 py-2 shadow-lg ${className}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{config.label}</span>
    </div>
  );
});

// Brand Consistency Score
export const BrandConsistencyScore = memo(({ 
  score = 88,
  className = ''
}: {
  score?: number;
  className?: string;
}) => {
  return (
    <Card className={`border-l-4 border-l-brass ${className}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-navy">Brand Consistency</h4>
          <Badge 
            className={`${score >= 80 ? 'bg-green-100 text-green-800' : score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
          >
            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Voice & Tone</span>
            <span className="font-medium text-navy">92%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Visual Style</span>
            <span className="font-medium text-navy">85%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Platform Adaptation</span>
            <span className="font-medium text-navy">87%</span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-slate-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-navy">{score}%</div>
            <div className="text-sm text-slate-600">Overall Score</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PlatformBrand.displayName = 'PlatformBrand';
CreatorPersona.displayName = 'CreatorPersona';
CreativeEnergyBar.displayName = 'CreativeEnergyBar';
BrandMood.displayName = 'BrandMood';
ContentTypeIndicator.displayName = 'ContentTypeIndicator';
ViralPotentialMeter.displayName = 'ViralPotentialMeter';
CreatorTierBadge.displayName = 'CreatorTierBadge';
BrandConsistencyScore.displayName = 'BrandConsistencyScore';