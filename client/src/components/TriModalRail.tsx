import { useState, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Volume2, Type, Eye, FileText, Sparkles, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Animation configuration constants
const ANIMATION_CONFIG = {
  PLATFORM_SWITCH_DELAY: 150,
  CARD_ANIMATION_DURATION: 0.4,
  STAGGER_DELAY: 0.1,
} as const;

type Platform = "tiktok" | "instagram" | "youtube";

const examples: Record<Platform, {
  verbal: string;
  visual: string;
  textual: string;
  framework: string;
  score: number;
  color: {
    primary: string;
    secondary: string;
    accent: string;
  };
  icon: string;
}> = {
  tiktok: {
    verbal: "I quit sugar for 7 days—day 3 was brutal.",
    visual: "Close-up of sugar packets being pushed away dramatically",
    textual: "DAY 3: BREAKING POINT",
    framework: "Open Loop",
    score: 4.6,
    color: {
      primary: "from-pink-500 to-purple-600",
      secondary: "bg-pink-50 border-pink-200",
      accent: "text-pink-600"
    },
    icon: "🎵"
  },
  instagram: {
    verbal: "Seven sugar-free days taught me this harsh truth.",
    visual: "Split screen: before/after energy levels",
    textual: "Day 3 reality check",
    framework: "Problem-Promise-Proof",
    score: 4.4,
    color: {
      primary: "from-purple-500 to-pink-600",
      secondary: "bg-purple-50 border-purple-200",
      accent: "text-purple-600"
    },
    icon: "📸"
  },
  youtube: {
    verbal: "Sugar-free for 7 days: −2.3kg, here's how.",
    visual: "Scale close-up showing weight change",
    textual: "7-DAY RESULTS",
    framework: "Direct Proof",
    score: 4.8,
    color: {
      primary: "from-red-500 to-orange-600",
      secondary: "bg-red-50 border-red-200",
      accent: "text-red-600"
    },
    icon: "📹"
  }
};

const TriModalRailComponent = ({
  onTryIdea
}: {
  onTryIdea?: (platform: Platform) => void;
}) => {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [topic, setTopic] = useState("7-day sugar-free experiment results");
  const [isAnimating, setIsAnimating] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const example = useMemo(() => examples[platform], [platform]);

  const handlePlatformChange = useCallback((newPlatform: Platform) => {
    if (newPlatform === platform || isAnimating) return;
    
    setIsAnimating(true);
    const delay = shouldReduceMotion ? 0 : ANIMATION_CONFIG.PLATFORM_SWITCH_DELAY;
    
    setTimeout(() => {
      setPlatform(newPlatform);
      setIsAnimating(false);
    }, delay);
  }, [platform, isAnimating, shouldReduceMotion]);

  const handleTopicChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
  }, []);

  const handleTryIdea = useCallback(() => {
    if (topic.trim()) {
      onTryIdea?.(platform);
    }
  }, [topic, platform, onTryIdea]);

  // Animation variants with reduced motion support
  const cardVariants = useMemo(() => ({
    initial: { 
      opacity: 0, 
      scale: shouldReduceMotion ? 1 : 0.95, 
      y: shouldReduceMotion ? 0 : 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0 
    },
    exit: { 
      opacity: 0, 
      scale: shouldReduceMotion ? 1 : 0.95, 
      y: shouldReduceMotion ? 0 : -20 
    }
  }), [shouldReduceMotion]);

  const animationDuration = shouldReduceMotion ? 0.1 : ANIMATION_CONFIG.CARD_ANIMATION_DURATION;

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-brass/10 to-navy/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-navy/10 to-brass/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brass/10 to-navy/10 rounded-full px-6 py-2 mb-6">
            <Sparkles className="w-5 h-5 text-brass" />
            <span className="text-sm font-semibold text-navy">Revolutionary Approach</span>
          </div>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-navy mb-6 leading-tight">
            Beyond simple text hooks—
            <br />
            <span className="bg-gradient-to-r from-brass to-navy bg-clip-text text-transparent">
              complete video strategies
            </span>
          </h3>
          <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            The only platform that delivers verbal hooks, visual direction, and text overlays designed to work in perfect harmony
          </p>
        </div>

        {/* Platform Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 bg-white rounded-2xl p-2 shadow-lg border border-slate-200">
            {(["tiktok", "instagram", "youtube"] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePlatformChange(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePlatformChange(p);
                  }
                }}
                disabled={isAnimating}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-50",
                  platform === p
                    ? `bg-gradient-to-r ${example.color.primary} text-white shadow-lg scale-105`
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
                aria-pressed={platform === p}
                aria-label={`Switch to ${p.charAt(0).toUpperCase() + p.slice(1)} platform`}
                role="radio"
                tabIndex={platform === p ? 0 : -1}
              >
                <span className="text-lg" aria-hidden="true">{examples[p].icon}</span>
                {p === "tiktok" && <SiTiktok className="w-5 h-5" aria-hidden="true" />}
                {p === "instagram" && <SiInstagram className="w-5 h-5" aria-hidden="true" />}
                {p === "youtube" && <SiYoutube className="w-5 h-5" aria-hidden="true" />}
                <span className="text-base">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                {platform === p && !shouldReduceMotion && (
                  <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" aria-hidden="true"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Three Components Showcase */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Verbal Hook Component */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`verbal-${platform}`}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: animationDuration, delay: ANIMATION_CONFIG.STAGGER_DELAY }}
              className="relative bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500"
            >
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-navy to-brass"></div>
              
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-navy to-navy/80 rounded-2xl flex items-center justify-center shadow-lg">
                      <Volume2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-brass rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">1</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-heading font-bold text-navy">Verbal Hook</h4>
                    <p className="text-slate-600">The spoken opening line</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-brass rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-lg font-semibold text-slate-900 leading-relaxed italic">
                      "{example.verbal}"
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`${example.color.secondary} ${example.color.accent} border-0`}>
                      {example.framework}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full mr-1 ${
                              i < Math.floor(example.score) ? 'bg-brass' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{example.score}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {example.verbal.split(' ').length} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-600" />
                      Attention-grabbing
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Visual Direction Component */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`visual-${platform}`}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: animationDuration, delay: ANIMATION_CONFIG.STAGGER_DELAY * 2 }}
              className="relative bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500"
            >
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brass to-orange-500"></div>
              
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-brass to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-navy rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">2</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-heading font-bold text-navy">Visual Direction</h4>
                    <p className="text-slate-600">What you capture on camera</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6 border border-slate-200">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
                      <span className="text-3xl">🎬</span>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 text-center leading-relaxed">
                    {example.visual}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="w-12 h-8 bg-slate-200 rounded-lg mb-1"></div>
                      <span className="text-xs text-slate-500">0-1s</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-8 bg-brass/30 rounded-lg mb-1"></div>
                      <span className="text-xs text-slate-500">1-2s</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-8 bg-brass rounded-lg mb-1"></div>
                      <span className="text-xs text-slate-500">2-3s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      Cold-open style
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-600" />
                      Platform-optimized
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Text Overlay Component */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`textual-${platform}`}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: animationDuration, delay: ANIMATION_CONFIG.STAGGER_DELAY * 3 }}
              className="relative bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500"
            >
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 to-slate-800"></div>
              
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-brass rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">3</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-heading font-bold text-navy">Text Overlay</h4>
                    <p className="text-slate-600">On-screen text elements</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6 border border-slate-200">
                  <div className="text-center">
                    <div className="inline-block bg-black text-white rounded-xl px-6 py-3 font-bold text-lg shadow-lg transform -rotate-1">
                      {example.textual}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-slate-100 text-slate-700 border-0">
                      {platform === "instagram" ? "≤24 chars" : 
                       platform === "youtube" ? "Proof format" : "Timeline style"}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-700">
                      {example.textual.length} chars
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Type className="w-4 h-4" />
                      Readable contrast
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-600" />
                      Mobile-friendly
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* How They Work Together */}
        <div className="relative bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl p-12 border border-slate-200 shadow-xl overflow-hidden mb-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 right-10 w-32 h-32 bg-brass rounded-full"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-navy rounded-full"></div>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-6 py-2 mb-6">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Perfect Harmony</span>
            </div>
            
            <h4 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-6">
              All three components work together for
              <span className="bg-gradient-to-r from-brass to-orange-500 bg-clip-text text-transparent"> maximum impact</span>
            </h4>
            
            <p className="text-xl text-slate-600 max-w-4xl mx-auto mb-8 leading-relaxed">
              No more guessing what visual to shoot or what text to overlay. Get a complete, 
              coordinated strategy that transforms viewers into engaged audiences from second one.
            </p>
            
            {/* Benefits Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-navy to-brass rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <h5 className="font-heading font-bold text-navy mb-2">Instant Direction</h5>
                <p className="text-slate-600 text-sm">Know exactly what to say, show, and display before you even hit record</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-brass to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <h5 className="font-heading font-bold text-navy mb-2">Platform Perfect</h5>
                <p className="text-slate-600 text-sm">Each element optimized for your chosen platform's unique audience and format</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <h5 className="font-heading font-bold text-navy mb-2">Proven Results</h5>
                <p className="text-slate-600 text-sm">Built on frameworks that have generated millions of views and thousands of followers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive CTA Section */}
        <div className="bg-gradient-to-br from-navy via-navy/95 to-navy/90 rounded-3xl p-12 text-center relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-40 h-40 bg-brass rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-white rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
              <Sparkles className="w-5 h-5 text-brass" />
              <span className="text-sm font-semibold text-white">Try It Now</span>
            </div>
            
            <h4 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
              Ready to create your tri-modal masterpiece?
            </h4>
            
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Enter any topic and watch us transform it into 10 complete hook strategies 
              with verbal, visual, and textual components.
            </p>
            
            {/* CTA Form */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    value={topic}
                    onChange={handleTopicChange}
                    placeholder="e.g., 'Morning routine for better focus'"
                    className="h-14 text-lg bg-white/95 backdrop-blur-sm border-white/20 rounded-2xl px-6 placeholder:text-slate-500"
                    aria-label="Enter your video topic or idea"
                    maxLength={100}
                  />
                </div>
                <Button
                  onClick={handleTryIdea}
                  disabled={!topic.trim()}
                  className="h-14 px-8 bg-gradient-to-r from-brass to-orange-500 hover:from-brass/90 hover:to-orange-500/90 text-white font-bold rounded-2xl shadow-xl transition-all duration-300 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  aria-describedby="generate-hooks-description"
                >
                  <span className="flex items-center gap-2">
                    Generate 10 Hooks
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </span>
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Free to try
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Results in 30 seconds
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Export memoized component for performance
export const TriModalRail = memo(TriModalRailComponent);