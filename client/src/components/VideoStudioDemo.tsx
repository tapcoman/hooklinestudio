import { memo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { Play, Pause, Volume2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Animation configuration constants
const ANIMATION_CONFIG = {
  BEAT_DURATION: 2000,
  PLATFORM_SWITCH_DELAY: 200,
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
  beats: Array<{ time: number; visual: string; icon: string }>;
}> = {
  tiktok: {
    verbal: "I quit sugar for 7 days—day 3 was brutal.",
    visual: "Close-up hand pushing sugar packets away dramatically",
    textual: "DAY 3: THE BREAKING POINT",
    framework: "Open Loop",
    score: 4.6,
    beats: [
      { time: 0, visual: "Hand reaches for sugar packets", icon: "🍬" },
      { time: 1, visual: "Dramatic push away motion", icon: "✋" },
      { time: 2, visual: "Text overlay punches in", icon: "📝" },
    ],
  },
  instagram: {
    verbal: "Seven sugar-free days—here's the honest truth.",
    visual: "Split screen: before/after coffee ritual",
    textual: "SUGAR-FREE: WEEK 1",
    framework: "Problem-Promise-Proof",
    score: 4.4,
    beats: [
      { time: 0, visual: "Normal coffee routine", icon: "☕" },
      { time: 1, visual: "Split screen reveals change", icon: "↔️" },
      { time: 2, visual: "Results text appears", icon: "✨" },
    ],
  },
  youtube: {
    verbal: "Sugar-free for 7 days: -2.3kg proven results.",
    visual: "Scale close-up with clear before/after numbers",
    textual: "-2.3KG • 7 DAYS",
    framework: "Direct Proof",
    score: 4.5,
    beats: [
      { time: 0, visual: "Scale shows starting weight", icon: "⚖️" },
      { time: 1, visual: "Quick montage of week", icon: "📅" },
      { time: 2, visual: "Final weight reveal", icon: "📊" },
    ],
  },
};

const VideoStudioDemoComponent = ({
  onTryIdea,
}: {
  onTryIdea?: (platform: Platform) => void;
}) => {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const example = useMemo(() => examples[platform], [platform]);

  // Optimized auto-play through beats with proper cleanup
  useEffect(() => {
    if (!isPlaying || shouldReduceMotion) return;
    
    const nextBeat = () => {
      setCurrentBeat((prev) => (prev + 1) % 3);
    };
    
    intervalRef.current = window.setInterval(nextBeat, ANIMATION_CONFIG.BEAT_DURATION);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, shouldReduceMotion]);

  const handlePlatformChange = useCallback((newPlatform: Platform) => {
    if (newPlatform === platform || isTransitioning) return;
    
    setIsTransitioning(true);
    const delay = shouldReduceMotion ? 0 : ANIMATION_CONFIG.PLATFORM_SWITCH_DELAY;
    
    timeoutRef.current = window.setTimeout(() => {
      setPlatform(newPlatform);
      setCurrentBeat(0);
      setIsTransitioning(false);
    }, delay);
  }, [platform, isTransitioning, shouldReduceMotion]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleBeatSelect = useCallback((beat: number) => {
    setCurrentBeat(beat);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Animation variants with reduced motion support
  const cardVariants = useMemo(() => ({
    initial: { 
      opacity: 0, 
      x: shouldReduceMotion ? 0 : 20 
    },
    animate: { 
      opacity: 1, 
      x: 0 
    },
    exit: { 
      opacity: 0, 
      x: shouldReduceMotion ? 0 : -20 
    }
  }), [shouldReduceMotion]);

  const phoneContentVariants = useMemo(() => ({
    initial: { 
      opacity: 0, 
      scale: shouldReduceMotion ? 1 : 0.9, 
      rotateY: shouldReduceMotion ? 0 : -15 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      rotateY: 0 
    },
    exit: { 
      opacity: 0, 
      scale: shouldReduceMotion ? 1 : 0.9, 
      rotateY: shouldReduceMotion ? 0 : 15 
    }
  }), [shouldReduceMotion]);

  const animationDuration = shouldReduceMotion ? 0.1 : ANIMATION_CONFIG.CARD_ANIMATION_DURATION;

  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-navy to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-32 left-20 w-96 h-96 bg-gradient-to-br from-brass/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
            <Play className="w-5 h-5 text-brass" />
            <span className="text-sm font-semibold text-white">Live Demo</span>
          </div>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
            Like a professional video editor—
            <br />
            <span className="bg-gradient-to-r from-brass to-orange-500 bg-clip-text text-transparent">
              but for hooks
            </span>
          </h3>
          <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
            Watch how all three components work together in perfect timing to create scroll-stopping content
          </p>
        </div>

        {/* Platform Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
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
                disabled={isTransitioning}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50",
                  platform === p
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                aria-pressed={platform === p}
                aria-label={`Switch to ${p.charAt(0).toUpperCase() + p.slice(1)} platform demo`}
                role="radio"
                tabIndex={platform === p ? 0 : -1}
              >
                {p === "tiktok" && <SiTiktok className="w-5 h-5" aria-hidden="true" />}
                {p === "instagram" && <SiInstagram className="w-5 h-5" aria-hidden="true" />}
                {p === "youtube" && <SiYoutube className="w-5 h-5" aria-hidden="true" />}
                <span className="text-base">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                {platform === p && !shouldReduceMotion && (
                  <div className="absolute inset-0 bg-gradient-to-r from-brass/20 to-orange-500/20 rounded-xl animate-pulse" aria-hidden="true"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Video Studio Interface */}
        <div className="grid lg:grid-cols-5 gap-8 mb-16">
          {/* Main Video Preview */}
          <div className="lg:col-span-3">
            <div className="relative aspect-[9/16] max-w-sm mx-auto bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              {/* Phone Frame */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                {/* Status Bar */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-black flex items-center justify-between px-6 text-white text-xs">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-2 bg-white rounded-sm"></div>
                    <div className="w-6 h-3 border border-white rounded-sm">
                      <div className="w-4 h-full bg-white rounded-sm"></div>
                    </div>
                  </div>
                </div>
                
                {/* Video Content Area */}
                <div className="absolute top-8 left-0 right-0 bottom-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-orange-900/30">
                  {/* Main Content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${platform}-${currentBeat}-${isTransitioning}`}
                        variants={phoneContentVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: animationDuration * 1.5, ease: "easeInOut" }}
                        className="text-center px-6"
                      >
                        {/* Visual Beat Icon */}
                        <div 
                          className={`text-6xl mb-4 ${!shouldReduceMotion ? 'animate-bounce' : ''}`} 
                          style={{ animationDuration: shouldReduceMotion ? '0s' : '2s' }}
                        >
                          {example.beats[currentBeat].icon}
                        </div>
                        
                        {/* Visual Description */}
                        <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                          <p className="text-white text-sm font-medium leading-relaxed">
                            {example.beats[currentBeat].visual}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Text Overlay */}
                  <AnimatePresence>
                    {currentBeat === 2 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="absolute top-16 left-1/2 transform -translate-x-1/2"
                      >
                        <div className="bg-black text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg border border-white/30">
                          {example.textual}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Verbal Hook Display */}
                  <div className="absolute bottom-20 left-4 right-4">
                    <div className="bg-black/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                      <p className="text-white text-sm font-medium text-center leading-relaxed">
                        "{example.verbal}"
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-16 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-brass to-orange-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((currentBeat + 1) / 3) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>

                  {/* Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    {/* Beat Indicators */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((beat) => (
                        <button
                          key={beat}
                          onClick={() => handleBeatSelect(beat)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleBeatSelect(beat);
                            }
                          }}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-slate-900",
                            currentBeat === beat 
                              ? "bg-brass scale-150 shadow-lg" 
                              : "bg-white/40 hover:bg-white/60"
                          )}
                          aria-label={`Go to beat ${beat + 1}`}
                          aria-pressed={currentBeat === beat}
                        />
                      ))}
                    </div>
                    
                    {/* Play/Pause */}
                    <button
                      onClick={handlePlayPause}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePlayPause();
                        }
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
                      aria-label={isPlaying ? 'Pause demo' : 'Play demo'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Component Analysis Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h4 className="text-2xl font-heading font-bold text-white mb-2">
                Component Breakdown
              </h4>
              <p className="text-white/70">
                See how each element works together for maximum impact
              </p>
            </div>

            {/* Component Cards */}
            <div className="space-y-4">
              {/* Verbal Component */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`verbal-${platform}`}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: animationDuration }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Volume2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-heading font-bold text-white">Verbal Hook</h5>
                        <Badge className="bg-blue-500/20 text-blue-200 border-0">
                          {example.framework}
                        </Badge>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 mb-3 border border-white/10">
                        <p className="text-white/90 font-medium italic">
                          "{example.verbal}"
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span>{example.verbal.split(' ').length} words</span>
                        <span>•</span>
                        <span>AI Score: {example.score}/5</span>
                        <span>•</span>
                        <span>Attention-grabbing</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Visual Component */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`visual-${platform}`}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: animationDuration, delay: ANIMATION_CONFIG.STAGGER_DELAY }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-heading font-bold text-white">Visual Direction</h5>
                        <Badge className="bg-orange-500/20 text-orange-200 border-0">
                          Cold-open
                        </Badge>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 mb-3 border border-white/10">
                        <p className="text-white/90 font-medium">
                          {example.visual}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {example.beats.map((beat, i) => (
                          <div
                            key={i}
                            className={cn(
                              "text-center p-2 rounded-lg border transition-all duration-300",
                              currentBeat === i 
                                ? "bg-orange-500/20 border-orange-500/40 scale-105" 
                                : "bg-white/5 border-white/10"
                            )}
                          >
                            <div className="text-lg mb-1">{beat.icon}</div>
                            <div className="text-xs text-white/60">{beat.time}s</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Text Component */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`textual-${platform}`}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: animationDuration, delay: ANIMATION_CONFIG.STAGGER_DELAY * 2 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-heading font-bold text-white">Text Overlay</h5>
                        <Badge className="bg-purple-500/20 text-purple-200 border-0">
                          {platform === "instagram" ? "≤24 chars" : 
                           platform === "youtube" ? "Proof format" : "Timeline"}
                        </Badge>
                      </div>
                      <div className="bg-black rounded-xl p-4 mb-3 text-center border border-white/20">
                        <p className="text-white font-bold">
                          {example.textual}
                        </p>
                      </div>
                      <div className="text-sm text-white/60 space-y-1">
                        <div>• {example.textual.length} characters</div>
                        <div>• Platform-optimized placement</div>
                        <div>• High contrast for readability</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/20 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 right-4 w-24 h-24 bg-brass rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 left-4 w-20 h-20 bg-blue-500 rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-brass/20 rounded-full px-6 py-2 mb-6">
                <Play className="w-5 h-5 text-brass" />
                <span className="text-sm font-semibold text-white">Ready to Start?</span>
              </div>
              
              <h4 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
                Experience the tri-modal difference
              </h4>
              <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                Get 10 complete hook strategies—verbal + visual + textual—optimized for your chosen platform in just 30 seconds.
              </p>
              
              <Button
                onClick={() => onTryIdea?.(platform)}
                size="lg"
                className="h-16 px-12 bg-gradient-to-r from-brass to-orange-500 hover:from-brass/90 hover:to-orange-500/90 text-white font-bold text-lg rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Try creating your first hook idea"
              >
                <span className="flex items-center gap-3">
                  Try Your First Idea
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white ml-0.5" aria-hidden="true" />
                  </div>
                </span>
              </Button>
              
              <p className="text-white/60 text-sm mt-4">
                No signup required • See results in 30 seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Export memoized component for performance
export const VideoStudioDemo = memo(VideoStudioDemoComponent);