import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Heart, Copy, Check, Eye, MessageSquare, Video, Star, TrendingUp, Shield, Zap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { HookGeneration } from "@shared/schema";

interface TriModalHookResultsProps {
  generation: HookGeneration;
  userId: string;
}

// Enhanced Hook Type for Tri-Modal Display
interface TriModalHook {
  verbalHook: string;
  visualHook?: string;
  textualHook?: string;
  framework: string;
  psychologicalDriver: string;
  hookCategory: string;
  riskFactor: "low" | "medium" | "high";
  score: number;
  wordCount: number;
  scoreBreakdown: string;
  rationale: string;
  platformNotes: string;
  contentTypeStrategy: "curiosity_gap" | "value_hit";
  platformSpecific?: {
    tiktokColdOpen?: string;
    instagramOverlay?: string;
    youtubeProofCue?: string;
  };
  promiseContentMatch: boolean;
  specificityScore: number;
  freshnessScore: number;
}

export default function TriModalHookResults({ generation, userId }: TriModalHookResultsProps) {
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Convert hooks to tri-modal format (backward compatibility)
  const triModalHooks = useMemo<TriModalHook[]>(() => {
    return (generation.hooks || []).map((hook: Record<string, unknown>, index) => {
      // Handle both old and new hook formats
      return {
        verbalHook: hook.verbalHook || hook.hook || hook.text || "",
        visualHook: hook.visualHook || hook.platformSpecific?.tiktokColdOpen || 
                   hook.platformSpecific?.instagramOverlay || hook.platformSpecific?.youtubeProofCue || "",
        textualHook: hook.textualHook || hook.platformSpecific?.instagramOverlay || 
                    hook.platformSpecific?.youtubeProofCue || "",
        framework: hook.framework || "Direct",
        psychologicalDriver: hook.psychologicalDriver || "Value",
        hookCategory: hook.hookCategory || "Statement-Based",
        riskFactor: hook.riskFactor || "low",
        score: Math.round((hook.score || 3.5) * 10) / 10,
        wordCount: hook.wordCount || hook.word_count || hook.verbalHook?.split(' ').length || 0,
        scoreBreakdown: hook.scoreBreakdown || `Score: ${hook.score || 3.5}/5`,
        rationale: hook.rationale || "Effective hook for target audience",
        platformNotes: hook.platformNotes || "",
        contentTypeStrategy: hook.contentTypeStrategy || "value_hit",
        platformSpecific: hook.platformSpecific,
        promiseContentMatch: hook.promiseContentMatch !== false,
        specificityScore: hook.specificityScore || 0.8,
        freshnessScore: hook.freshnessScore || 0.7,
      };
    });
  }, [generation.hooks]);

  // Find best hook based on composite scoring
  const bestHook = triModalHooks.length 
    ? triModalHooks.reduce((a, b) => (b.score > a.score ? b : a))
    : null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHook(text);
      toast({ title: "Copied to clipboard!", variant: "default" });
      setTimeout(() => setCopiedHook(null), 2000);
    } catch (error) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const saveFavoriteMutation = useMutation({
    mutationFn: async ({ hook, hookData, framework, platformNotes }: { 
      hook: string; 
      hookData?: Record<string, unknown>;
      framework: string; 
      platformNotes: string; 
    }) => {
      const response = await apiRequest("POST", "/api/favorites", {
        userId,
        hook,
        hookData,
        framework,
        platformNotes,
        topic: generation.topic,
        platform: generation.platform,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      setFavorites(prev => new Set([...prev, variables.hook]));
      toast({ title: "Saved to favorites!", variant: "default" });
    },
    onError: () => {
      toast({ title: "Failed to save favorite", variant: "destructive" });
    },
  });

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower === 'tiktok') return '🎵';
    if (platformLower === 'instagram') return '📸';
    if (platformLower === 'youtube') return '▶️';
    return '📱';
  };

  const getFrameworkColor = (framework: string) => {
    const colorMap: Record<string, string> = {
      "Open Loop": "bg-purple-100 text-purple-800",
      "PPP": "bg-green-100 text-green-800",
      "Problem-Promise-Proof": "bg-green-100 text-green-800",
      "4U": "bg-blue-100 text-blue-800",
      "AIDA": "bg-orange-100 text-orange-800",
      "PAS": "bg-red-100 text-red-800",
      "Direct": "bg-gray-100 text-gray-800"
    };
    return colorMap[framework] || "bg-slate-100 text-slate-800";
  };

  const getRiskColor = (risk: string) => {
    const colorMap: Record<string, string> = {
      "low": "bg-green-100 text-green-800",
      "medium": "bg-yellow-100 text-yellow-800",
      "high": "bg-red-100 text-red-800"
    };
    return colorMap[risk] || "bg-gray-100 text-gray-800";
  };

  if (!triModalHooks || triModalHooks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600">No hooks generated yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strategic Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Tri-Modal Hook Generation Results
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                {getPlatformIcon(generation.platform)} {generation.platform.charAt(0).toUpperCase() + generation.platform.slice(1)}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                {generation.objective.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-4">
            <p className="text-sm font-medium text-blue-900 mb-1">Original Topic:</p>
            <p className="text-blue-800">{generation.topic}</p>
          </div>
          
          {bestHook && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  Best Hook (Score: {bestHook.score}/5)
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(bestHook.verbalHook)}
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                  >
                    {copiedHook === bestHook.verbalHook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    Copy Best
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveFavoriteMutation.mutate({
                      hook: bestHook.verbalHook,
                      hookData: {
                        verbalHook: bestHook.verbalHook,
                        visualHook: bestHook.visualHook,
                        textualHook: bestHook.textualHook,
                        framework: bestHook.framework,
                        psychologicalDriver: bestHook.psychologicalDriver,
                        hookCategory: bestHook.hookCategory,
                        score: bestHook.score,
                        scoreBreakdown: bestHook.scoreBreakdown,
                        rationale: bestHook.rationale,
                        platformNotes: bestHook.platformNotes,
                        platformSpecific: bestHook.platformSpecific
                      },
                      framework: bestHook.framework,
                      platformNotes: bestHook.platformNotes
                    })}
                    disabled={favorites.has(bestHook.verbalHook)}
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(bestHook.verbalHook) ? 'fill-current' : ''}`} />
                    Save Best
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveFavoriteMutation.mutate({
                      hook: bestHook.verbalHook,
                      framework: bestHook.framework,
                      platformNotes: bestHook.platformNotes
                    })}
                    disabled={favorites.has(bestHook.verbalHook)}
                    className="text-pink-700 border-pink-300 hover:bg-pink-100"
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(bestHook.verbalHook) ? 'fill-current' : ''}`} />
                    Save
                  </Button>
                </div>
              </div>
              
              {/* Tri-Modal Display for Best Hook */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Verbal Hook</span>
                  </div>
                  <p className="text-sm text-slate-900 font-medium">"{bestHook.verbalHook}"</p>
                </div>
                
                {bestHook.visualHook && (
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center mb-2">
                      <Video className="w-4 h-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Visual Direction</span>
                    </div>
                    <p className="text-sm text-slate-700">{bestHook.visualHook}</p>
                  </div>
                )}
                
                {bestHook.textualHook && (
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center mb-2">
                      <Eye className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Text Overlay</span>
                    </div>
                    <p className="text-sm text-slate-700">"{bestHook.textualHook}"</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className={getFrameworkColor(bestHook.framework)}>
                  {bestHook.framework}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {bestHook.psychologicalDriver}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {bestHook.hookCategory}
                </Badge>
                <Badge className={getRiskColor(bestHook.riskFactor)}>
                  {bestHook.riskFactor} risk
                </Badge>
              </div>
              
              <p className="text-sm text-slate-600 mb-2">{bestHook.rationale}</p>
              <p className="text-xs text-slate-500">{bestHook.scoreBreakdown}</p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* All Hooks Display */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">All Generated Hooks</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            <AnimatePresence>
              {triModalHooks.map((hook, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Hook Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
                      <Badge className={getFrameworkColor(hook.framework)}>
                        {hook.framework}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Score: {hook.score}/5
                      </Badge>
                      <Badge className={getRiskColor(hook.riskFactor)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {hook.riskFactor}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(hook.verbalHook)}
                      >
                        {copiedHook === hook.verbalHook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveFavoriteMutation.mutate({
                          hook: hook.verbalHook,
                          hookData: {
                            verbalHook: hook.verbalHook,
                            visualHook: hook.visualHook,
                            textualHook: hook.textualHook,
                            framework: hook.framework,
                            psychologicalDriver: hook.psychologicalDriver,
                            hookCategory: hook.hookCategory,
                            score: hook.score,
                            scoreBreakdown: hook.scoreBreakdown,
                            rationale: hook.rationale,
                            platformNotes: hook.platformNotes,
                            platformSpecific: hook.platformSpecific
                          },
                          framework: hook.framework,
                          platformNotes: hook.platformNotes
                        })}
                        disabled={favorites.has(hook.verbalHook)}
                      >
                        <Heart className={`w-4 h-4 ${favorites.has(hook.verbalHook) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Tri-Modal Content */}
                  <Tabs defaultValue="verbal" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="verbal" className="text-xs">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Verbal
                      </TabsTrigger>
                      <TabsTrigger value="visual" className="text-xs" disabled={!hook.visualHook}>
                        <Video className="w-4 h-4 mr-1" />
                        Visual
                      </TabsTrigger>
                      <TabsTrigger value="textual" className="text-xs" disabled={!hook.textualHook}>
                        <Eye className="w-4 h-4 mr-1" />
                        Text
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="verbal" className="mt-3">
                      <div className="bg-slate-50 rounded p-3">
                        <p className="text-slate-900 font-medium">"{hook.verbalHook}"</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <span>{hook.wordCount} words</span>
                          <span>Strategy: {hook.contentTypeStrategy.replace('_', ' ')}</span>
                          <span>Psychology: {hook.psychologicalDriver}</span>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {hook.visualHook && (
                      <TabsContent value="visual" className="mt-3">
                        <div className="bg-purple-50 rounded p-3">
                          <p className="text-slate-900">{hook.visualHook}</p>
                          <p className="text-xs text-purple-600 mt-1">First 1-3 seconds visual direction</p>
                        </div>
                      </TabsContent>
                    )}
                    
                    {hook.textualHook && (
                      <TabsContent value="textual" className="mt-3">
                        <div className="bg-green-50 rounded p-3">
                          <p className="text-slate-900 font-medium">"{hook.textualHook}"</p>
                          <p className="text-xs text-green-600 mt-1">On-screen text overlay for silent viewing</p>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>

                  {/* Hook Analysis */}
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700">{hook.rationale}</p>
                    {hook.platformNotes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                        Platform note: {hook.platformNotes}
                      </p>
                    )}
                    
                    {/* Quality Metrics */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <div className="flex items-center text-xs text-slate-500">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Specificity: {Math.round(hook.specificityScore * 100)}%
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <Zap className="w-3 h-3 mr-1" />
                        Freshness: {Math.round(hook.freshnessScore * 100)}%
                      </div>
                      {hook.promiseContentMatch && (
                        <div className="flex items-center text-xs text-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Promise-Content Match
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}