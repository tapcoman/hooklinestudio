import { useState } from "react";
import { motion } from "framer-motion";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Volume2, Type } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "tiktok" | "instagram" | "youtube";

const examples: Record<Platform, {
  verbal: string;
  visual: string;
  textual: string;
  framework: string;
  score: number;
}> = {
  tiktok: {
    verbal: "I quit sugar for 7 days—day 3 was brutal.",
    visual: "Close-up of sugar packets being pushed away",
    textual: "DAY 3: BREAKING POINT",
    framework: "Open Loop",
    score: 4.6
  },
  instagram: {
    verbal: "Seven sugar-free days taught me this harsh truth.",
    visual: "Split screen: before/after energy levels",
    textual: "Day 3 reality check",
    framework: "Problem-Promise-Proof",
    score: 4.4
  },
  youtube: {
    verbal: "Sugar-free for 7 days: −2.3kg, here's how.",
    visual: "Scale close-up showing weight change",
    textual: "7-DAY RESULTS",
    framework: "Direct + Proof",
    score: 4.8
  }
};

export function TriModalRail({
  onTryIdea
}: {
  onTryIdea?: (platform: Platform) => void;
}) {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [topic, setTopic] = useState("7-day sugar-free experiment results");

  const example = examples[platform];

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h3 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
          See the tri-modal difference
        </h3>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Instead of just text, get three coordinated components that work together
        </p>
      </div>

      {/* Platform selector */}
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

      {/* Three components showcase */}
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Verbal Hook */}
          <motion.div 
            key={`verbal-${platform}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-navy/5 to-navy/10 rounded-2xl p-6 border-2 border-navy/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-navy">Verbal Hook</h4>
                <p className="text-sm text-slate-600">What you actually say</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
              <p className="font-semibold text-slate-900 text-lg leading-tight">
                "{example.verbal}"
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{example.framework}</Badge>
              <Badge variant="secondary">{example.verbal.split(' ').length} words</Badge>
              <Badge variant="secondary">AI: {example.score}/5</Badge>
            </div>
          </motion.div>

          {/* Visual Direction */}
          <motion.div 
            key={`visual-${platform}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-brass/5 to-brass/10 rounded-2xl p-6 border-2 border-brass/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-brass rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-navy">Visual Direction</h4>
                <p className="text-sm text-slate-600">What you film</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
              <p className="font-semibold text-slate-900 text-center">
                {example.visual}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Cold-open</Badge>
              <Badge variant="secondary">Symbolic</Badge>
              <Badge variant="secondary">Engaging</Badge>
            </div>
          </motion.div>

          {/* Text Overlay */}
          <motion.div 
            key={`textual-${platform}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-moss/5 to-moss/10 rounded-2xl p-6 border-2 border-moss/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-moss rounded-xl flex items-center justify-center">
                <Type className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-navy">Text Overlay</h4>
                <p className="text-sm text-slate-600">What appears on screen</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
              <div className="text-center">
                <div className="bg-slate-900 text-white rounded-lg px-4 py-2 inline-block font-bold text-sm">
                  {example.textual}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {platform === "instagram" ? "≤24 chars" : 
                 platform === "youtube" ? "Proof cue" : "Timeline"}
              </Badge>
              <Badge variant="secondary">{example.textual.length} chars</Badge>
              <Badge variant="secondary">Platform-optimized</Badge>
            </div>
          </motion.div>
        </div>

        {/* Result showcase */}
        <div className="bg-gradient-to-r from-navy/5 via-brass/5 to-moss/5 rounded-2xl p-8 text-center mb-8">
          <h4 className="text-xl font-heading font-bold text-navy mb-4">
            All three work together to create scroll-stopping content
          </h4>
          <p className="text-slate-700 max-w-3xl mx-auto mb-6">
            Instead of just getting random hook text, you receive a complete video strategy with verbal, visual, and textual components designed to work in perfect harmony for maximum engagement.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-navy rounded-full"></div>
              <span className="text-sm">Platform-optimized</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-brass rounded-full"></div>
              <span className="text-sm">Framework-driven</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-moss rounded-full"></div>
              <span className="text-sm">Complete strategy</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Try your topic — e.g., 'Morning routine for better focus'"
            className="h-12"
          />
          <Button
            onClick={() => onTryIdea?.(platform)}
            disabled={!topic.trim()}
            className="h-12 px-8 whitespace-nowrap"
          >
            Try 10 hooks on your idea →
          </Button>
        </div>
      </div>
    </section>
  );
}