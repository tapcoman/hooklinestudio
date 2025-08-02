import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Heart, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { HookGeneration } from "@shared/schema";

interface HookResultsProps {
  generation: HookGeneration;
  userId: string;
}

// --- Types that cover both current and new JSON schema ---
type Platform = "tiktok" | "instagram" | "youtube";
type Framework = "Open Loop" | "PPP" | "4U" | "AIDA" | "PAS" | "Direct";

type PlatformNotesObj =
  | { visual_cold_open: string; overlay?: never; proof_cue?: never }   // TikTok
  | { overlay: string; visual_cold_open?: never; proof_cue?: never }   // Instagram
  | { proof_cue: string; visual_cold_open?: never; overlay?: never };  // YouTube

type HookOld = {
  hook: string;
  framework: string;
  wordCount?: number;
  platformNotes?: string;           // "Visual: …" | "Overlay: …" | "Proof: …" | free text
  score?: number;                   // 0–5 "AI score"
  rationale?: string;
  scoreBreakdown?: string;
};

type HookNew = {
  text: string;
  framework: Framework;
  word_count: number;
  platform_notes: PlatformNotesObj;
  reason_codes?: string[];
  rationale?: string;
  ai_score?: number;                // if you move to judge pass, this may be absent
};

type CanonicalHook = {
  id: string;
  text: string;
  framework: Framework;
  wordCount: number;
  platformNotes: PlatformNotesObj;  // always an object here
  rationale: string;
  aiScore: number | null;           // 0..5 or null
  scoreBreakdown?: string;
};

// Map loose framework labels to canonical ones
const normalizeFramework = (f: string): Framework => {
  const s = (f || "").toLowerCase();
  if (s.includes("problem-promise-proof") || s === "ppp") return "PPP";
  if (s.includes("4u")) return "4U";
  if (s.includes("direct")) return "Direct";
  if (s.includes("aida")) return "AIDA";
  if (s.includes("pas")) return "PAS";
  if (s.includes("open")) return "Open Loop";
  // fallback
  return "Direct";
};

// Convert legacy string notes → object notes
const parsePlatformNotes = (platform: Platform, notes?: string): PlatformNotesObj => {
  const val = (notes || "").trim();
  if (platform === "tiktok") {
    const v = val.replace(/^visual:\s*/i, "");
    return { visual_cold_open: v || "Quick motion (whip-in), title card snap" };
  }
  if (platform === "instagram") {
    let v = val.replace(/^overlay:\s*/i, "").replace(/"/g, "");
    if (v.length > 24) v = v.slice(0, 24);
    return { overlay: v || "Save this" };
  }
  // youtube
  const v = val.replace(/^proof:\s*/i, "");
  return { proof_cue: v || "Result: +18% watch" };
};

const words = (s: string) => (s || "").trim().split(/\s+/).filter(Boolean).length;

// Stable id for list keys
const hookId = (t: string) => `${t.slice(0, 64)}::${t.length}`;

// Accept either shape and return canonical
const normalizeHook = (raw: HookOld | HookNew, platform: Platform): CanonicalHook => {
  const isNew = (raw as HookNew).text !== undefined;
  if (isNew) {
    const h = raw as HookNew;
    return {
      id: hookId(h.text),
      text: h.text,
      framework: h.framework,
      wordCount: h.word_count ?? words(h.text),
      platformNotes: h.platform_notes,
      rationale: h.rationale || "",
      aiScore: typeof h.ai_score === "number" ? h.ai_score : null,
      scoreBreakdown: undefined,
    };
  } else {
    const h = raw as HookOld;
    const text = h.hook;
    const framework = normalizeFramework(h.framework);
    const wordCount = h.wordCount ?? words(text);
    const platformNotes = parsePlatformNotes(platform, h.platformNotes);
    return {
      id: hookId(text),
      text,
      framework,
      wordCount,
      platformNotes,
      rationale: h.rationale || "",
      aiScore: typeof h.score === "number" ? h.score : null,
      scoreBreakdown: h.scoreBreakdown,
    };
  }
};

// --- Platform length targets (Gaussian) ---
const TARGET = {
  tiktok:    { mu: 11, sigma: 2.5 },
  instagram: { mu: 12, sigma: 2.5 },
  youtube:   { mu:  6, sigma: 1.5 },
} as const;

const gaussian = (wc: number, { mu, sigma }: { mu: number; sigma: number }) =>
  Math.exp(-((wc - mu) ** 2) / (2 * sigma ** 2)); // 0..1

// Small, conservative framework prior (nudge, not a winner)
const FRAMEWORK_PRIOR: Record<Framework, number> = {
  "Open Loop": 0.75,
  "PPP": 0.70,
  "4U": 0.68,
  "AIDA": 0.60,
  "PAS": 0.62,
  "Direct": 0.55,
};

// Light cliché penalty (client-side)
const clichePenalty = (t: string) => {
  const hits = [
    /you won't believe/i,
    /one weird trick/i,
    /blow your mind/i,
    /hack\b/i,
  ].some((r) => r.test(t));
  return hits ? -0.08 : 0; // small nudge
};

// Platform-fit signal (presence + reason-esque heuristics)
const platformFit = (h: CanonicalHook, platform: Platform) => {
  if (platform === "tiktok") {
    const has = !!h.platformNotes.visual_cold_open;
    const timeline = /day\s*\d+|after\s+\d+|in\s+\d+\s*(days?|hours?|mins?)/i.test(h.text);
    return (has ? 0.7 : 0.4) + (timeline ? 0.2 : 0); // cap later
  }
  if (platform === "instagram") {
    const has = !!h.platformNotes.overlay;
    const utility = /\bhow to\b|do this|save this|step\-by\-step|checklist|template/i.test(h.text);
    return (has ? 0.7 : 0.4) + (utility ? 0.2 : 0);
  }
  // youtube
  const has = !!h.platformNotes.proof_cue;
  const proof = /\d+%|\b\d{1,3}(k|m)\b|\b(before|after)\b/i.test(h.text);
  return (has ? 0.7 : 0.4) + (proof ? 0.2 : 0);
};

// Composite → 0..5
const scoreComposite = (h: CanonicalHook, platform: Platform, aiBase: number | null) => {
  const L = gaussian(h.wordCount, TARGET[platform]);    // brevity
  const O = platformFit(h, platform);                   // 0..~0.9
  const F = FRAMEWORK_PRIOR[h.framework] ?? 0.55;       // 0..1
  const C = clichePenalty(h.text);                      // negative or 0
  const Q = aiBase !== null ? Math.max(0, Math.min(1, aiBase / 5)) : 0.7; // fallback if AI score missing

  // weights: quality 0.45, length 0.20, objective/platform 0.25, framework 0.10, penalty small
  const raw = 0.45 * Q + 0.20 * L + 0.25 * Math.min(1, O) + 0.10 * F + C;
  const clipped = Math.max(0, Math.min(1, raw));
  return +(5 * clipped).toFixed(2);
};

// Memoized table row component to prevent unnecessary re-renders
const HookTableRow = memo(({ 
  hook, 
  index, 
  copiedHook, 
  favorites, 
  expandedScores, 
  onCopyToClipboard, 
  onSaveFavorite, 
  onToggleScoreExpansion 
}: {
  hook: CanonicalHook & { compositeScore: number };
  index: number;
  copiedHook: string | null;
  favorites: Set<string>;
  expandedScores: Set<string>;
  onCopyToClipboard: (text: string) => void;
  onSaveFavorite: (hook: CanonicalHook) => void;
  onToggleScoreExpansion: (hookId: string) => void;
}) => {
  const getFrameworkColor = useCallback((framework: string) => {
    const map: Record<string, string> = {
      "Open Loop": "bg-blue-100 text-blue-800",
      "PPP": "bg-emerald-100 text-emerald-800",
      "4U": "bg-violet-100 text-violet-800",
      "AIDA": "bg-orange-100 text-orange-800",
      "PAS": "bg-rose-100 text-rose-800",
      "Direct": "bg-slate-100 text-slate-800",
    };
    return map[framework] || "bg-slate-100 text-slate-800";
  }, []);

  const renderPlatformNotes = useCallback((h: CanonicalHook) => {
    if ("visual_cold_open" in h.platformNotes) {
      return <>📹 {h.platformNotes.visual_cold_open}</>;
    }
    if ("overlay" in h.platformNotes) {
      return <>💬 {h.platformNotes.overlay}</>;
    }
    return <>📊 {h.platformNotes.proof_cue}</>;
  }, []);

  return (
    <motion.tr
      key={hook.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: 0.6 + (index * 0.05),
        type: "spring",
        stiffness: 120
      }}
      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
    >
      <TableCell className="text-center">
        <div className="flex items-center justify-center">
          {index === 0 && (
            <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold mr-1">
              1
            </div>
          )}
          {index !== 0 && (
            <span className="text-slate-500 text-sm">{index + 1}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium text-slate-900 leading-tight">
            "{hook.text}"
          </p>
          {hook.rationale && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {hook.rationale}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="space-y-1">
          <Badge 
            className={`${
              hook.compositeScore >= 4.0 ? 'bg-emerald-100 text-emerald-800' :
              hook.compositeScore >= 3.0 ? 'bg-blue-100 text-blue-800' :
              'bg-slate-100 text-slate-800'
            } font-mono`}
          >
            {hook.compositeScore}
          </Badge>
          {hook.scoreBreakdown && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleScoreExpansion(hook.id)}
                className="h-5 px-1 text-xs text-slate-500 hover:text-slate-700"
                aria-label={expandedScores.has(hook.id) ? "Hide score breakdown" : "Show score breakdown"}
              >
                {expandedScores.has(hook.id) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
              {expandedScores.has(hook.id) && (
                <div className="mt-1 text-xs text-slate-600 bg-slate-50 rounded p-2 border">
                  {hook.scoreBreakdown}
                </div>
              )}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getFrameworkColor(hook.framework)}>
          {hook.framework}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm text-slate-600">{hook.wordCount}</span>
      </TableCell>
      <TableCell>
        <div className="text-xs text-slate-600">
          {renderPlatformNotes(hook)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopyToClipboard(hook.text)}
            className="h-8 w-8 p-0"
            aria-label={copiedHook === hook.text ? "Copied!" : "Copy hook text"}
          >
            {copiedHook === hook.text ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSaveFavorite(hook)}
            className="h-8 w-8 p-0"
            disabled={favorites.has(hook.text)}
            aria-label={favorites.has(hook.text) ? "Already saved" : "Save to favorites"}
          >
            <Heart className={`w-3 h-3 ${favorites.has(hook.text) ? 'fill-current text-red-500' : ''}`} />
          </Button>
        </div>
      </TableCell>
    </motion.tr>
  );
});

HookTableRow.displayName = "HookTableRow";

function HookResults({ generation, userId }: HookResultsProps) {
  const [expandedScores, setExpandedScores] = useState<Set<string>>(new Set());
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const { toast } = useToast();

  // Build canonical hooks, compute scores (useMemo to avoid rework)
  const platform = generation.platform.toLowerCase() as Platform;

  const canonicalHooks = useMemo<CanonicalHook[]>(() => {
    if (!generation?.hooks || !Array.isArray(generation.hooks)) return [];
    return generation.hooks.map((raw: HookOld | HookNew) => normalizeHook(raw, platform));
  }, [generation.hooks, platform]);

  const hooksWithComposite = useMemo(() => {
    return canonicalHooks.map(h => ({
      ...h,
      compositeScore: scoreComposite(h, platform, h.aiScore),
    }));
  }, [canonicalHooks, platform]);

  const bestHook = hooksWithComposite.length
    ? hooksWithComposite.reduce((a, b) => (b.compositeScore > a.compositeScore ? b : a))
    : null;

  const sortedHooks = useMemo(
    () => [...hooksWithComposite].sort((a, b) => b.compositeScore - a.compositeScore),
    [hooksWithComposite]
  );

  // Helper functions for rendering platform notes and favorites
  const renderPlatformNotes = (h: CanonicalHook) => {
    if ("visual_cold_open" in h.platformNotes) {
      return <>📹 {h.platformNotes.visual_cold_open}</>;
    }
    if ("overlay" in h.platformNotes) {
      return <>💬 {h.platformNotes.overlay}</>;
    }
    return <>📊 {h.platformNotes.proof_cue}</>;
  };

  const platformNotesString = (h: CanonicalHook) =>
    "visual_cold_open" in h.platformNotes ? `Visual: ${h.platformNotes.visual_cold_open}` :
    "overlay" in h.platformNotes ? `Overlay: ${h.platformNotes.overlay}` :
    `Proof: ${h.platformNotes.proof_cue}`;

  // Load existing favorites only once when component first mounts - DISABLED
  // The repeated query calls are causing side panel refresh
  const existingFavorites = null; // Disable this query completely
  
  /* DISABLED - Causing side panel refresh issue
  const { data: existingFavorites } = useQuery({
    queryKey: ["/api/favorites", generation.id],
    queryFn: () => apiRequest("GET", `/api/favorites/${generation.id}`).then(res => res.json()),
    enabled: false, // DISABLED to prevent side panel refresh
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  */

  // Update favorites state when data loads
  useEffect(() => {
    if (existingFavorites && !favoritesLoaded) {
      const favoriteHooks = new Set<string>(existingFavorites.map((fav: { hook: string }) => fav.hook));
      setFavorites(favoriteHooks);
      setFavoritesLoaded(true); // Mark as loaded to prevent further queries
    }
  }, [existingFavorites, favoritesLoaded]);

  const saveFavoriteMutation = useMutation({
    mutationFn: async ({ hook, hookData, framework, platformNotes, topic, platform }: { 
      hook: string; 
      hookData?: Record<string, unknown>;
      framework: string; 
      platformNotes: string; 
      topic: string;
      platform: string;
    }) => {
      const response = await apiRequest("POST", "/api/favorites", {
        userId,
        hook,
        hookData,
        framework,
        platformNotes,
        topic,
        platform
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Update local state immediately for instant UI feedback
      const newFavorites = new Set(favorites);
      newFavorites.add(variables.hook);
      setFavorites(newFavorites);
      
      toast({
        title: "Hook saved to favorites!",
        description: "You can find it in your favorites section.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save favorite",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHook(text);
      setTimeout(() => setCopiedHook(null), 2000);
      toast({
        title: "Copied to clipboard!",
        description: "Hook has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleSaveFavorite = useCallback((canonicalHook: CanonicalHook) => {
    if (favorites.has(canonicalHook.text)) {
      toast({
        title: "Already saved!",
        description: "This hook is already in your favorites.",
      });
      return;
    }
    // Find the original hook data with tri-modal elements
    const originalHook = generation.hooks.find(h => 
      h.verbalHook === canonicalHook.text || h.hook === canonicalHook.text
    );
    
    saveFavoriteMutation.mutate({ 
      hook: canonicalHook.text, 
      hookData: originalHook ? {
        verbalHook: originalHook.verbalHook || originalHook.hook || canonicalHook.text,
        visualHook: originalHook.visualHook,
        textualHook: originalHook.textualHook,
        framework: canonicalHook.framework,
        psychologicalDriver: originalHook.psychologicalDriver,
        hookCategory: originalHook.hookCategory,
        score: canonicalHook.aiScore,
        scoreBreakdown: originalHook.scoreBreakdown,
        rationale: originalHook.rationale,
        platformNotes: platformNotesString(canonicalHook),
        platformSpecific: originalHook.platformSpecific
      } : {
        verbalHook: canonicalHook.text,
        framework: canonicalHook.framework,
        platformNotes: platformNotesString(canonicalHook)
      },
      framework: canonicalHook.framework, 
      platformNotes: platformNotesString(canonicalHook),
      topic: generation.topic,
      platform: generation.platform
    });
  }, [favorites, generation.hooks, generation.topic, generation.platform, saveFavoriteMutation, toast, userId]);

  const getFrameworkColor = useCallback((framework: string) => {
    const map: Record<string, string> = {
      "Open Loop": "bg-blue-100 text-blue-800",
      "PPP": "bg-emerald-100 text-emerald-800",
      "4U": "bg-violet-100 text-violet-800",
      "AIDA": "bg-orange-100 text-orange-800",
      "PAS": "bg-rose-100 text-rose-800",
      "Direct": "bg-slate-100 text-slate-800",
    };
    return map[framework] || "bg-slate-100 text-slate-800";
  }, []);

  const getPlatformIcon = useCallback((platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower === 'tiktok') return '🎵';
    if (platformLower === 'instagram') return '📸';
    if (platformLower === 'youtube') return '▶️';
    return '📱';
  }, []);

  const toggleScoreExpansion = useCallback((hookId: string) => {
    setExpandedScores(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hookId)) {
        newSet.delete(hookId);
      } else {
        newSet.add(hookId);
      }
      return newSet;
    });
  }, []);

  if (!generation.hooks || generation.hooks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600">No hooks generated yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" key={generation.id}>
      {/* Enhanced Best Hook Action */}
      <AnimatePresence mode="wait">
        {bestHook && (
          <motion.div
            key={`best-hook-${generation.id}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.2,
              type: "spring",
              stiffness: 100
            }}
          >
            <Card className="border border-blue-300/50 bg-gradient-to-r from-blue-50 to-blue-100/50 relative overflow-hidden">
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-semibold text-blue-700">🏆 HIGHEST SCORING HOOK</h4>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                      >
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-medium">
                          ★ {bestHook.compositeScore}/5.0 Score
                        </Badge>
                      </motion.div>
                    </div>
                    <blockquote className="text-lg font-semibold text-slate-900 border-l-4 border-blue-400 pl-4 bg-white/70 rounded-r-lg py-2">
                      "{bestHook.text}"
                    </blockquote>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700 font-medium">
                        AI: {bestHook.aiScore ? bestHook.aiScore.toFixed(1) : 'N/A'}/5
                      </Badge>
                      <Badge className={getFrameworkColor(bestHook.framework)}>
                        {bestHook.framework}
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {bestHook.wordCount} words
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-slate-600 bg-white/60 rounded-lg p-3">
                      <p className="font-medium text-slate-700 mb-2">Platform Notes:</p>
                      <div className="text-sm">{renderPlatformNotes(bestHook)}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => copyToClipboard(bestHook.text)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {copiedHook === bestHook.text ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Best Line
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleSaveFavorite(bestHook)}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      disabled={favorites.has(bestHook.text)}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${favorites.has(bestHook.text) ? 'fill-current' : ''}`} />
                      {favorites.has(bestHook.text) ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Hooks Table */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`hooks-table-${generation.id}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            delay: 0.4,
            type: "spring",
            stiffness: 80
          }}
        >
          <Card>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      All Generated Hooks
                    </h3>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                      {getPlatformIcon(generation.platform)} {generation.platform.charAt(0).toUpperCase() + generation.platform.slice(1)}
                    </Badge>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      {generation.objective.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">Original Topic:</p>
                  <p className="text-sm text-blue-700 italic">"{generation.topic}"</p>
                </div>
              </div>

              <div className="overflow-hidden">
                <Table role="table" aria-label="Generated hooks results">
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12 text-center" scope="col">Rank</TableHead>
                      <TableHead scope="col">Hook</TableHead>
                      <TableHead className="w-24 text-center" scope="col">Score</TableHead>
                      <TableHead className="w-32" scope="col">Framework</TableHead>
                      <TableHead className="w-20 text-center" scope="col">Words</TableHead>
                      <TableHead className="w-32" scope="col">Platform Notes</TableHead>
                      <TableHead className="w-24 text-center" scope="col">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHooks.map((hook, index) => (
                      <HookTableRow
                        key={hook.id}
                        hook={hook}
                        index={index}
                        copiedHook={copiedHook}
                        favorites={favorites}
                        expandedScores={expandedScores}
                        onCopyToClipboard={copyToClipboard}
                        onSaveFavorite={handleSaveFavorite}
                        onToggleScoreExpansion={toggleScoreExpansion}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default memo(HookResults);