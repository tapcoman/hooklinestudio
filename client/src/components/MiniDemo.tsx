import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HookCard } from './HookCard';
import { analytics } from '../lib/analytics';
import { Shuffle, Users, Clock, ArrowRight } from 'lucide-react';

// Sample topics that rotate automatically
const SAMPLE_TOPICS = [
  "Morning routine tips",
  "Productivity hacks", 
  "Fitness motivation",
  "Cooking shortcuts",
  "Study techniques",
  "Self-care ideas",
  "Budget-friendly recipes",
  "Quick workout routines"
];

// Cache for demo results to improve performance
const demoCache = new Map<string, any>();

export function MiniDemo() {
  const [demoTopic, setDemoTopic] = useState("");
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [demoPlatform, setDemoPlatform] = useState("tiktok");
  const [demoHooks, setDemoHooks] = useState<{ hook: string; framework: string; rationale: string; score: number }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCompletedDemo, setHasCompletedDemo] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Auto-rotate sample topics for placeholder
  useEffect(() => {
    if (demoTopic === "" && showSuggestions) {
      const interval = setInterval(() => {
        setCurrentSampleIndex((prev) => (prev + 1) % SAMPLE_TOPICS.length);
      }, 2000); // Rotate every 2 seconds
      return () => clearInterval(interval);
    }
  }, [demoTopic, showSuggestions]);

  // Set initial placeholder
  useEffect(() => {
    if (demoTopic === "") {
      setCurrentSampleIndex(0);
    }
  }, []);

  const getCurrentPlaceholder = () => {
    return `e.g., ${SAMPLE_TOPICS[currentSampleIndex]}`;
  };

  const selectSampleTopic = useCallback((topic: string) => {
    setDemoTopic(topic);
    setShowSuggestions(false);
    analytics.track('demo_sample_topic_selected', { topic, source: 'suggestion_chips' });
  }, []);

  const tryAnotherTopic = useCallback(() => {
    const randomTopic = SAMPLE_TOPICS[Math.floor(Math.random() * SAMPLE_TOPICS.length)];
    setDemoTopic(randomTopic);
    setDemoHooks([]);
    setHasCompletedDemo(false);
    analytics.track('demo_try_another_topic', { topic: randomTopic });
  }, []);

  const getPlatformSpecificHooks = (topic: string, platform: string) => {
    // Platform-specific hook variations for better relevance
    const baseHooks = {
      tiktok: [
        {
          hook: `POV: You tried ${topic.toLowerCase()} for 7 days straight`,
          framework: "POV Format",
          rationale: "TikTok's popular POV format creates immediate relatability",
          score: 4.3
        },
        {
          hook: `${topic} hack that went viral (for good reason)`,
          framework: "Social Proof",
          rationale: "Appeals to TikTok's viral culture and trend-following behavior",
          score: 4.1
        },
        {
          hook: `This ${topic.toLowerCase()} tip changed everything in 30 seconds`,
          framework: "Quick Value",
          rationale: "Emphasizes speed and transformation, perfect for short-form content",
          score: 3.9
        }
      ],
      instagram: [
        {
          hook: `The ${topic.toLowerCase()} guide nobody talks about`,
          framework: "Exclusive Knowledge",
          rationale: "Instagram users value exclusive, curated content",
          score: 4.2
        },
        {
          hook: `5 ${topic.toLowerCase()} mistakes I wish I knew earlier`,
          framework: "Learning Journey",
          rationale: "Personal storytelling resonates well on Instagram",
          score: 4.0
        },
        {
          hook: `${topic}: Before vs. After (shocking results)`,
          framework: "Transformation",
          rationale: "Visual platform perfect for before/after content",
          score: 3.8
        }
      ],
      youtube: [
        {
          hook: `I tested ${topic.toLowerCase()} for 30 days - here's what happened`,
          framework: "Experiment Documentation",
          rationale: "YouTube audiences love detailed experiment videos",
          score: 4.4
        },
        {
          hook: `The ${topic.toLowerCase()} method that actually works (with proof)`,
          framework: "Evidence-Based",
          rationale: "YouTube values educational content with supporting evidence",
          score: 4.1
        },
        {
          hook: `Why everyone's doing ${topic.toLowerCase()} wrong (and how to fix it)`,
          framework: "Contrarian Truth",
          rationale: "Educational angle appeals to YouTube's learning-focused audience",
          score: 3.9
        }
      ]
    };

    return baseHooks[platform as keyof typeof baseHooks] || baseHooks.tiktok;
  };

  const announceToScreenReader = (message: string) => {
    setAnnouncement(message);
    // Clear announcement after screen reader has time to read it
    setTimeout(() => setAnnouncement(''), 1000);
  };

  const generateDemoHooks = async () => {
    if (!demoTopic.trim()) {
      announceToScreenReader('Please enter a video topic before generating hooks.');
      return;
    }
    
    analytics.trackHeroTrySample();
    setIsGenerating(true);
    setShowSuggestions(false);
    announceToScreenReader('Generating sample hooks. Please wait.');
    
    try {
      // Check cache first for better performance
      const cacheKey = `${demoTopic.toLowerCase()}-${demoPlatform}`;
      if (demoCache.has(cacheKey)) {
        const cachedHooks = demoCache.get(cacheKey);
        setDemoHooks(cachedHooks);
        setHasCompletedDemo(true);
        analytics.track('demo_cache_hit', { topic: demoTopic, platform: demoPlatform });
        setIsGenerating(false);
        return;
      }

      // Generate platform-specific hooks
      const platformHooks = getPlatformSpecificHooks(demoTopic, demoPlatform);
      
      // Reduced loading time from 1.5s to 0.8s
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Cache the results
      demoCache.set(cacheKey, platformHooks);
      setDemoHooks(platformHooks);
      setHasCompletedDemo(true);
      announceToScreenReader(`Generated ${platformHooks.length} sample hooks successfully.`);
      
      // Focus results for screen readers
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.focus();
        }
      }, 100);
      
      // Track generation with sample data
      platformHooks.forEach(hook => {
        analytics.trackSampleGenerated(demoPlatform, hook.hook.split(' ').length, hook.score);
      });

      analytics.track('demo_completed', { 
        topic: demoTopic, 
        platform: demoPlatform,
        hooks_generated: platformHooks.length 
      });
    } catch (error) {
      console.error("Demo generation failed:", error);
      announceToScreenReader('Hook generation failed. Please try again.');
      analytics.track('demo_error', { topic: demoTopic, platform: demoPlatform, error: String(error) });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Screen reader announcements */}
      <div 
        ref={announcementRef}
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement}
      </div>
      
      <Card className="shadow-editorial border-2 border-line bg-card rounded-card" role="region" aria-labelledby="demo-heading">
        <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header className="text-center">
          <div className="relative">
            <Badge className="bg-brass text-navy border-brass mb-4 relative z-10" role="note">
              <span aria-label="Sparkles icon" role="img">✨</span> Try before you sign up
            </Badge>
          </div>
          <h3 id="demo-heading" className="text-xl sm:text-2xl lg:text-h3 font-heading font-semibold text-navy mb-2">
            Test it on your next video idea
          </h3>
          <p className="text-slate text-sm sm:text-base" aria-describedby="demo-description">
            <span id="demo-description">See how scroll-stopping hooks are made. No signup required.</span>
          </p>
          
          {/* Social proof */}
          <div className="flex items-center justify-center space-x-4 mt-3 text-xs text-slate-600" aria-label="Usage statistics">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              <span aria-label="Number of creators who tested this week">2,847 creators tested this week</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span aria-label="Average generation time">Average: 0.8s</span>
            </div>
          </div>
        </header>

        {/* Demo Interface */}
        <div className="space-y-4" data-demo-section role="main" aria-label="Hook generation demo">
          {/* Sample topic suggestions */}
          {showSuggestions && demoTopic === "" && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-600 mb-2">Quick start with popular topics:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TOPICS.slice(0, 4).map((topic, index) => (
                  <button
                    key={topic}
                    onClick={() => selectSampleTopic(topic)}
                    className="px-3 py-1.5 text-xs bg-brass/10 hover:bg-brass/20 text-navy rounded-full border border-brass/30 transition-colors duration-200 min-h-[44px] sm:min-h-[36px] focus:outline-none focus:ring-2 focus:ring-brass/60"
                    aria-label={`Try sample topic: ${topic}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label 
              htmlFor="demo-topic-input"
              className="block text-small font-medium text-navy mb-2"
            >
              Your video topic or idea
            </label>
            <Input
              id="demo-topic-input"
              placeholder={getCurrentPlaceholder()}
              value={demoTopic}
              onChange={(e) => {
                setDemoTopic(e.target.value);
                if (e.target.value && showSuggestions) {
                  setShowSuggestions(false);
                }
              }}
              className="text-base border-line focus:border-brass rounded-button min-h-[44px] text-base"
              autoFocus
              aria-describedby="demo-privacy-note"
              inputMode="text"
              autoComplete="off"
            />
            <p id="demo-privacy-note" className="text-xs text-slate-500 mt-1">
              We don't store topics you test here.
            </p>
          </div>
          
          {/* Mobile-optimized controls */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <label htmlFor="platform-select" className="block text-xs font-medium text-slate-600 mb-1 sm:hidden">
                Platform
              </label>
              <Select value={demoPlatform} onValueChange={setDemoPlatform}>
                <SelectTrigger 
                  id="platform-select"
                  className="w-full sm:w-32 border-line rounded-button min-h-[44px]"
                  aria-label="Select platform"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={generateDemoHooks}
              disabled={!demoTopic.trim() || isGenerating}
              className="w-full sm:w-auto bg-navy hover:bg-navy/90 text-white rounded-button min-h-[44px] px-6 font-medium focus-visible:outline-2 focus-visible:ring-2 focus-visible:ring-brass/60 disabled:opacity-50"
              aria-label={isGenerating ? "Generating hooks, please wait" : "Generate sample hooks"}
            >
              {isGenerating ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </span>
              ) : (
                "Generate sample hooks"
              )}
            </Button>
          </div>
          
          {/* Enhanced Loading Skeleton */}
          {isGenerating && (
            <div className="space-y-3 mt-6" role="status" aria-label="Generating hooks">
              <div className="text-center text-sm text-slate-600 mb-4">
                Creating platform-optimized hooks for {demoPlatform}...
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="p-4 bg-line/30 rounded-button">
                    <div className="h-4 bg-line rounded mb-2"></div>
                    <div className="h-3 bg-line rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-line rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Results with enhanced conversion CTAs */}
          {demoHooks.length > 0 && !isGenerating && (
            <div className="mt-6 space-y-4" role="region" aria-label="Generated hooks">
              <div className="space-y-3">
                {demoHooks.map((hook, index) => (
                  <HookCard
                    key={index}
                    hook={hook.hook}
                    framework={hook.framework}
                    rationale={hook.rationale}
                    score={hook.score}
                    isDemo={true}
                  />
                ))}
              </div>

              {/* Enhanced conversion section */}
              <div className="bg-brass/10 border border-brass/30 rounded-button p-4 sm:p-6 text-center space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-navy">
                    🎯 Like what you see?
                  </h4>
                  <p className="text-sm text-slate-600">
                    Get <span className="font-semibold text-navy">10 hooks like this</span> for every topic you try.
                    <br />
                    <span className="text-xs">Plus frameworks, analytics, and optimization tips.</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      analytics.track('demo_cta_clicked', { 
                        source: 'post_demo_results',
                        topic: demoTopic,
                        platform: demoPlatform 
                      });
                      window.location.href = "/api/login";
                    }}
                    className="bg-navy hover:bg-navy/90 text-white rounded-button min-h-[44px] px-6 font-medium flex items-center justify-center space-x-2"
                  >
                    <span>Get 10 hooks per topic</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={tryAnotherTopic}
                    className="border-navy text-navy hover:bg-navy hover:text-white rounded-button min-h-[44px] px-4 flex items-center space-x-2"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Try another topic</span>
                  </Button>
                </div>

                {/* Urgency element */}
                <p className="text-xs text-slate-500">
                  Join 12,000+ creators already using HookLine Studio
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}