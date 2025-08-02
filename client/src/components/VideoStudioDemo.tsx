import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { Play, Pause, Volume2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export function VideoStudioDemo({
  onTryIdea,
}: {
  onTryIdea?: (platform: Platform) => void;
}) {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const example = examples[platform];

  // Auto-play through beats
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentBeat((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h3 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
          Like a professional video editor—but for <span className="text-brass">hooks</span>
        </h3>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          See how all three components work together in perfect timing
        </p>
      </div>

      {/* Platform Tabs */}
      <div className="flex justify-center gap-3 mb-8">
        {(["tiktok", "instagram", "youtube"] as Platform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
              platform === p
                ? "bg-navy text-white border-navy"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            {p === "tiktok" && <SiTiktok className="w-4 h-4" />}
            {p === "instagram" && <SiInstagram className="w-4 h-4" />}
            {p === "youtube" && <SiYoutube className="w-4 h-4" />}
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Video Studio Interface */}
      <div className="max-w-6xl mx-auto">
        {/* Video Preview */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl mb-8">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-orange-900/20"></div>
          
          {/* Main Video Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={`${platform}-${currentBeat}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* Visual Beat Icon */}
              <div className="text-8xl mb-6">
                {example.beats[currentBeat].icon}
              </div>
              
              {/* Visual Description */}
              <div className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 mx-8">
                <p className="text-white text-lg font-medium">
                  {example.beats[currentBeat].visual}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Text Overlay */}
          <AnimatePresence>
            {currentBeat === 2 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-8 left-1/2 transform -translate-x-1/2"
              >
                <div className="bg-black/80 backdrop-blur-sm text-white px-6 py-3 rounded-lg border border-white/20">
                  <span className="font-bold text-lg">{example.textual}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verbal Hook at Bottom */}
          <div className="absolute bottom-8 left-0 right-0 px-8">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
              <p className="text-white text-xl font-medium text-center">
                "{example.verbal}"
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <motion.div
              className="h-1 bg-brass"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentBeat + 1) / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-lg transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          {/* Beat Indicators */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            {[0, 1, 2].map((beat) => (
              <button
                key={beat}
                onClick={() => setCurrentBeat(beat)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  currentBeat === beat ? "bg-brass scale-125" : "bg-white/40"
                )}
              />
            ))}
          </div>
        </div>

        {/* Layer Breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Verbal Layer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-navy/5 to-navy/10 rounded-2xl p-6 border border-navy/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-navy">Verbal Hook</h4>
                <p className="text-sm text-slate-600">The spoken words</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
              <p className="font-semibold text-slate-900">
                "{example.verbal}"
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{example.framework}</Badge>
              <Badge variant="secondary">{example.verbal.split(' ').length} words</Badge>
              <Badge variant="secondary">AI: {example.score}/5</Badge>
            </div>
          </motion.div>

          {/* Visual Layer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-brass/5 to-brass/10 rounded-2xl p-6 border border-brass/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-brass rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-navy">Visual Direction</h4>
                <p className="text-sm text-slate-600">What you film</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
              <p className="font-semibold text-slate-900">
                {example.visual}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {example.beats.map((beat, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-center p-2 rounded-lg border transition-all",
                    currentBeat === i ? "bg-brass/10 border-brass/30" : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="text-lg mb-1">{beat.icon}</div>
                  <div className="text-xs text-slate-600">{beat.time}s</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Textual Layer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-slate-500/5 to-slate-500/10 rounded-2xl p-6 border border-slate-500/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-navy">Text Overlay</h4>
                <p className="text-sm text-slate-600">Screen text</p>
              </div>
            </div>
            
            <div className="bg-black text-white rounded-xl p-4 border border-slate-200 mb-4 text-center">
              <p className="font-bold">
                {example.textual}
              </p>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              {platform === "tiktok" && (
                <>
                  <div>• Timeline format creates urgency</div>
                  <div>• ALL CAPS for impact</div>
                  <div>• Appears at peak emotion (2s)</div>
                </>
              )}
              {platform === "instagram" && (
                <>
                  <div>• Safe zone placement</div>
                  <div>• ≤24 characters for mobile</div>
                  <div>• Utility-focused phrasing</div>
                </>
              )}
              {platform === "youtube" && (
                <>
                  <div>• Proof-driven approach</div>
                  <div>• Specific metrics included</div>
                  <div>• Title-like brevity</div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-navy/5 via-brass/5 to-slate-500/5 rounded-2xl p-8">
            <h4 className="text-2xl font-heading font-bold text-navy mb-4">
              Ready to create your own tri-modal hooks?
            </h4>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Get 10 complete hook strategies—verbal + visual + textual—optimized for your chosen platform in 30 seconds.
            </p>
            <Button
              onClick={() => onTryIdea?.(platform)}
              size="lg"
              className="h-12 px-8 text-lg"
            >
              Try your first idea →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}