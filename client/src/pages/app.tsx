import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Video, History, Heart, User as UserIcon, Wand2, Download, RotateCcw, Copy, Settings, Building2, LogOut, ChevronDown, CreditCard, Plus, Menu } from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import UpgradeModal from "../components/upgrade-modal";
import { MobileHeader } from "../components/MobileHeader";
import { MobileBottomBar } from "../components/MobileBottomBar";
import { MobileSidebar } from "../components/MobileSidebar";
import { MobileHookViewer } from "../components/MobileHookViewer";
import { MobileLoading, MobileHookCardSkeleton } from "../components/MobileLoading";
import { ErrorBoundary } from "../components/error-boundary";

// Lazy load heavy components for better performance
const HookResults = lazy(() => import("../components/hook-results"));
const TriModalHookResults = lazy(() => import("../components/trimodal-hook-results"));
// Define types locally since they're not exported from lib/types
type Platform = "tiktok" | "instagram" | "youtube";
type Objective = "watch_time" | "shares" | "saves" | "ctr";
interface GenerationRequest {
  platform: Platform;
  objective: Objective;
  topic: string;
}
import type { User, HookGeneration } from "@shared/schema";
// Logo from public directory
const logoUrl = "/assets/logo.png";

export default function App() {
  const { toast } = useToast();
  const { logoutMutation, user: authUser, backendUser } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("tiktok");
  const [objective, setObjective] = useState<Objective>("watch_time");
  const [topic, setTopic] = useState("");
  const [currentGeneration, setCurrentGeneration] = useState<HookGeneration | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{ remainingCredits: number; isAtLimit: boolean } | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useTriModalView, setUseTriModalView] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: user } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: () => apiRequest("GET", "/api/users/me").then(res => res.json()),
  }) as { data: User | undefined };

  // Check credits on load - reduced polling to prevent double loading
  const { data: credits } = useQuery({
    queryKey: ["/api/credits/check"],
    queryFn: () => apiRequest("GET", "/api/credits/check").then(res => res.json()),
    refetchInterval: 60000, // Reduced to 60 seconds to prevent excessive polling
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const { data: generations } = useQuery({
    queryKey: ["/api/generations"],
    queryFn: () => apiRequest("GET", "/api/generations").then(res => res.json()),
    staleTime: 5 * 60 * 1000, // Consider generations fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  }) as { data: HookGeneration[] | undefined };

  // Update currentGeneration when generations change, but only if we don't have one set
  useEffect(() => {
    if (generations && generations.length > 0 && !currentGeneration) {
      // Set to the most recent generation (first in the array since they're sorted by date desc)
      setCurrentGeneration(generations[0]);
    }
  }, [generations, currentGeneration]);

  const generateHooksMutation = useMutation({
    mutationFn: async (request: GenerationRequest) => {
      setIsGenerating(true);
      
      try {
        const response = await apiRequest("POST", "/api/generate-hooks", request);
        
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 403 && errorData.error === "Credit limit reached") {
            setCreditInfo({ 
              remainingCredits: errorData.remainingCredits || 0, 
              isAtLimit: true 
            });
            setShowUpgradeModal(true);
            throw new Error("Credit limit reached");
          }
          throw new Error(errorData.message || "Failed to generate hooks");
        }
        
        const result = await response.json();
        setIsGenerating(false);
        return result;
      } catch (error) {
        setIsGenerating(false);
        throw error;
      }
    },
    onSuccess: (generation: HookGeneration) => {
      setCurrentGeneration(generation);
      // Only invalidate generations when we actually generate new hooks
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/check"] });
      toast({
        title: "Hooks generated successfully!",
        description: `Generated ${generation.hooks?.length || 0} hooks for ${selectedPlatform}`,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Something went wrong";
      if (message !== "Credit limit reached") {
        toast({
          title: "Error generating hooks",
          description: message,
          variant: "destructive"
        });
      }
    }
  });

  const exportCsvMutation = useMutation({
    mutationFn: async (generationId: string) => {
      const response = await apiRequest("POST", "/api/export-csv", { generationId });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hooks-${selectedPlatform}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "CSV exported successfully!",
        description: "Your hooks have been downloaded as a CSV file.",
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Export failed",
        description: message,
        variant: "destructive"
      });
    }
  });

  const handleGenerate = useCallback(() => {
    if (!backendUser?.id) {
      toast({
        title: "No user profile found",
        description: "Please complete onboarding first.",
        variant: "destructive"
      });
      return;
    }

    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please describe your video idea.",
        variant: "destructive"
      });
      return;
    }

    generateHooksMutation.mutate({
      platform: selectedPlatform,
      objective,
      topic: topic.trim()
    });
  }, [backendUser?.id, topic, selectedPlatform, objective, generateHooksMutation, toast]);

  const handleExportCsv = () => {
    if (currentGeneration?.id) {
      exportCsvMutation.mutate(currentGeneration.id);
    }
  };

  const handleTryMore = () => {
    handleGenerate();
  };

  const platforms = useMemo(() => [
    { 
      value: "tiktok" as Platform, 
      label: "TikTok", 
      icon: "TikTok",
      color: "bg-black",
      textColor: "text-white"
    },
    { 
      value: "instagram" as Platform, 
      label: "Reels", 
      icon: "Instagram",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      textColor: "text-white"
    },
    { 
      value: "youtube" as Platform, 
      label: "Shorts", 
      icon: "YouTube",
      color: "bg-red-600",
      textColor: "text-white"
    }
  ], []);

  const objectives = useMemo(() => [
    { value: "watch_time" as Objective, label: "Watch time" },
    { value: "shares" as Objective, label: "Shares" },
    { value: "saves" as Objective, label: "Saves" },
    { value: "ctr" as Objective, label: "Click-through rate" }
  ], []);

  if (!backendUser?.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="main" aria-label="Profile setup required">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <Video className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Welcome to Hook Line Studio</h1>
            <p className="text-slate-600 mb-6">Please complete your profile setup to start generating hooks.</p>
            <Button 
              onClick={() => setLocation("/onboarding")}
              className="focus-visible"
              aria-label="Complete profile setup to access hook generation"
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Skip links for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#hook-generator" className="skip-link">
          Skip to hook generator
        </a>
        {/* Mobile/Desktop Header */}
        {isMobile ? (
          <MobileHeader 
            user={user}
            credits={credits}
            onNewHook={() => setIsSidebarOpen(true)}
          />
        ) : (
          <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10" role="banner">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <img 
                  src={logoUrl} 
                  alt="Hook Line Studio Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  role="img"
                />
                <span className="font-semibold text-slate-900 text-sm sm:text-base">Hook Line Studio</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-4">
                {/* Current Profile Display */}
                {user?.company && (
                  <div className="hidden lg:flex items-center space-x-2 px-2 py-1 bg-slate-50 rounded border border-slate-200" role="status" aria-label="Current company">
                    <Building2 className="w-3 h-3 text-slate-600" aria-hidden="true" />
                    <span className="text-xs font-medium text-slate-700">{user.company}</span>
                  </div>
                )}
                
                {/* Credits Display */}
                {credits && !user?.isPremium && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-brass/10 rounded border border-brass/20" role="status" aria-label={`${credits.remainingCredits} credits remaining`}>
                    <span className="text-xs font-medium text-navy">{credits.remainingCredits} credits</span>
                  </div>
                )}
                {user?.isPremium && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-navy/10 rounded border border-navy/20" role="status" aria-label="Premium account">
                    <span className="text-xs font-medium text-navy">Premium</span>
                  </div>
                )}
                
                {/* Navigation Buttons */}
                <nav role="navigation" aria-label="Secondary navigation">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation("/favorites")}
                  aria-label="Go to your favorite hooks"
                  className="relative p-2 focus-visible"
                >
                  <Heart className="w-4 h-4" />
                  <span className="ml-1 text-xs">Favorites</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  title="Generation History" 
                  className="p-2"
                  onClick={() => setLocation("/history")}
                >
                  <History className="w-4 h-4" />
                  <span className="ml-1 text-xs">History</span>
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-1 p-2">
                      {user?.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt="Profile" 
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )}
                      <span className="text-xs">{user?.firstName || 'Profile'}</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium">{user?.firstName || user?.email}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => setLocation("/profile")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/profile/companies")}>
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>Manage Companies</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/billing")}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing & Plans</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </nav>
              </div>
            </div>
          </header>
        )}

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          objective={objective}
          setObjective={setObjective}
          topic={topic}
          setTopic={setTopic}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          generations={generations}
          setCurrentGeneration={setCurrentGeneration}
        />

        {/* Main Content Area - Responsive Layout */}
        <main id="main-content" className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-col lg:flex-row'} overflow-hidden`} role="main" aria-label="Hook generation workspace">
          {/* Desktop Input Panel */}
          {!isMobile && (
            <aside id="hook-generator" className="w-full lg:w-1/3 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 sm:p-6 overflow-y-auto" role="complementary" aria-label="Hook generation form">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Create New Hooks</h2>
                  
                  {/* Platform Selection */}
                  <fieldset className="mb-4 sm:mb-6">
                    <legend className="text-sm font-medium text-slate-700 mb-2 sm:mb-3 block">Platform</legend>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select content platform">
                      {platforms.map((platform) => {
                        const isSelected = selectedPlatform === platform.value;
                        const IconComponent = platform.value === "tiktok" ? SiTiktok : 
                                             platform.value === "instagram" ? SiInstagram : SiYoutube;
                        
                        return (
                          <Button
                            key={platform.value}
                            type="button"
                            variant="outline"
                            className={`p-2 sm:p-3 h-auto flex-col space-y-1 text-xs relative overflow-hidden focus-visible ${
                              isSelected 
                                ? `${platform.color} ${platform.textColor} border-transparent` 
                                : "bg-white hover:bg-slate-50 border-slate-200"
                            }`}
                            onClick={() => setSelectedPlatform(platform.value)}
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`Select ${platform.label} platform`}
                          >
                            <IconComponent 
                              className={`text-sm sm:text-lg ${
                                isSelected ? platform.textColor : 
                                platform.value === "tiktok" ? "text-black" :
                                platform.value === "instagram" ? "text-pink-500" :
                                "text-red-600"
                              }`} 
                              aria-hidden="true"
                            />
                            <span className={`text-xs font-medium ${
                              isSelected ? platform.textColor : "text-slate-700"
                            }`}>
                              {platform.label}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Objective Selection */}
                  <div className="mb-4 sm:mb-6">
                    <Label htmlFor="objective" className="text-sm font-medium text-slate-700 mb-2 block">Objective</Label>
                    <Select value={objective} onValueChange={(value: Objective) => setObjective(value)}>
                      <SelectTrigger id="objective" className="h-10 sm:h-11 focus-visible" aria-label="Select content objective">
                        <SelectValue placeholder="Choose your goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectives.map((obj) => (
                          <SelectItem key={obj.value} value={obj.value}>
                            {obj.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Topic Input */}
                  <div className="mb-4 sm:mb-6">
                    <Label htmlFor="topic" className="text-sm font-medium text-slate-700 mb-2 block">Video Topic</Label>
                    <Textarea
                      id="topic"
                      placeholder="Describe your video idea... e.g., '7-day sugar-free experiment results'"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="h-24 sm:h-32 resize-none text-sm focus-visible"
                      aria-describedby="topic-description"
                      aria-label="Video topic description"
                    />
                    <p id="topic-description" className="text-xs text-slate-500 mt-1">Be specific about what your video will cover</p>
                  </div>

                  {/* Generate Button */}
                  <div className="space-y-3">
                    <Button 
                      className="w-full py-3 sm:py-4 text-sm sm:text-lg font-semibold shadow-lg hover:shadow-xl focus-visible"
                      onClick={handleGenerate}
                      disabled={isGenerating || !topic.trim()}
                      aria-label={isGenerating ? "Generating hooks, please wait" : "Generate 10 hooks from your video topic"}
                      aria-describedby={creditInfo?.isAtLimit ? "credit-limit-warning" : undefined}
                    >
                      <Wand2 className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} aria-hidden="true" />
                      {isGenerating ? "Generating..." : "Generate 10 Hooks"}
                    </Button>
                    {creditInfo?.isAtLimit && (
                      <p id="credit-limit-warning" className="text-xs text-red-600" role="alert">
                        You've reached your credit limit. Please upgrade to continue generating hooks.
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent Topics */}
                {generations && generations.length > 0 && (
                  <>
                    <Separator />
                    <section aria-labelledby="recent-topics-heading">
                      <h3 id="recent-topics-heading" className="text-sm font-medium text-slate-700 mb-3">Recent Topics</h3>
                      <div className="space-y-2" role="list" aria-label="Recent hook generations">
                        {generations.slice(0, 5).map((gen) => (
                          <Button
                            key={gen.id}
                            variant="ghost"
                            className="w-full justify-start h-auto p-3 bg-slate-50 hover:bg-slate-100 focus-visible"
                            onClick={() => setCurrentGeneration(gen)}
                            role="listitem"
                            aria-label={`Load hooks for ${gen.topic} on ${gen.platform}`}
                          >
                            <div className="text-left">
                              <p className="text-sm text-slate-900 font-medium truncate">{gen.topic}</p>
                              <p className="text-xs text-slate-500">
                                {gen.platform} • {gen.createdAt ? new Date(gen.createdAt).toLocaleDateString() : ""}
                              </p>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </aside>
          )}

          {/* Results Panel - Mobile/Desktop responsive */}
          <section className={`flex-1 flex flex-col bg-slate-50 overflow-hidden ${isMobile ? 'pb-20' : ''}`} aria-label="Generated hooks results">
            {currentGeneration ? (
              <>
                {/* Enhanced Header Section - Hidden on mobile */}
                {!isMobile && (
                  <>
                    <div className="flex-shrink-0 bg-white border-b border-slate-200 p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-slate-900">Generated Hooks</h3>
                          
                          {/* Platform & Objective Pills */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm">
                              {currentGeneration.platform === 'tiktok' && (
                                <><SiTiktok className="h-4 w-4 text-black" /> <span className="font-medium">TikTok</span></>
                              )}
                              {currentGeneration.platform === 'instagram' && (
                                <><SiInstagram className="h-4 w-4 text-pink-500" /> <span className="font-medium">Instagram</span></>
                              )}
                              {currentGeneration.platform === 'youtube' && (
                                <><SiYoutube className="h-4 w-4 text-red-500" /> <span className="font-medium">YouTube</span></>
                              )}
                            </div>
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {currentGeneration.objective.replace('_', ' ').charAt(0).toUpperCase() + currentGeneration.objective.replace('_', ' ').slice(1)}
                            </div>
                          </div>

                          {/* Original Topic Highlight */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-2xl">
                            <div className="text-xs font-medium text-blue-700 mb-1">ORIGINAL TOPIC</div>
                            <div className="text-sm text-blue-900 font-medium">
                              "{currentGeneration.topic}"
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-600">
                            {currentGeneration.hooks?.length || 0} hooks generated • Click to copy or save favorites
                          </p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            variant="outline" 
                            onClick={handleExportCsv}
                            disabled={exportCsvMutation.isPending}
                            className="hover:bg-slate-50"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {exportCsvMutation.isPending ? "Exporting..." : "Export CSV"}
                          </Button>
                          <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            onClick={handleTryMore}
                            disabled={isGenerating}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Try 10 More
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* View Toggle - Desktop Only */}
                    <div className="px-6 py-3 border-b bg-slate-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-700">Hook Display Mode</h3>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant={!useTriModalView ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUseTriModalView(false)}
                            className="text-xs"
                          >
                            Classic View
                          </Button>
                          <Button
                            variant={useTriModalView ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUseTriModalView(true)}
                            className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            ✨ Tri-Modal View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Mobile Header */}
                {isMobile && (
                  <div className="bg-white border-b border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">Hooks Generated</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-xs"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        New
                      </Button>
                    </div>
                    
                    {/* Platform & Topic info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {currentGeneration.platform === 'tiktok' && (
                          <><SiTiktok className="h-4 w-4 text-black" /> <span className="text-sm font-medium">TikTok</span></>
                        )}
                        {currentGeneration.platform === 'instagram' && (
                          <><SiInstagram className="h-4 w-4 text-pink-500" /> <span className="text-sm font-medium">Instagram</span></>
                        )}
                        {currentGeneration.platform === 'youtube' && (
                          <><SiYoutube className="h-4 w-4 text-red-500" /> <span className="text-sm font-medium">YouTube</span></>
                        )}
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-600">
                          {currentGeneration.objective.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        "{currentGeneration.topic}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Scrollable Results Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                  <Suspense fallback={
                    isMobile ? (
                      <MobileHookCardSkeleton />
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-slate-600">Loading results...</p>
                        </div>
                      </div>
                    )
                  }>
                    {isMobile ? (
                      <MobileHookViewer 
                        generation={currentGeneration} 
                        userId={backendUser?.id || ""}
                        useTriModalView={useTriModalView}
                      />
                    ) : (
                      useTriModalView ? (
                        <TriModalHookResults generation={currentGeneration} userId={backendUser?.id || ""} />
                      ) : (
                        <HookResults generation={currentGeneration} userId={backendUser?.id || ""} />
                      )
                    )}
                  </Suspense>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
                  <Wand2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-slate-900 mb-3`}>
                  Ready to create engaging hooks?
                </h3>
                <p className="text-slate-600 mb-6 max-w-md leading-relaxed text-sm">
                  {isMobile 
                    ? "Tap the button below to start generating hooks for your content."
                    : "Choose your platform, describe your video idea, and get 10 platform-optimized hooks in 30 seconds."
                  }
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={isMobile ? () => setIsSidebarOpen(true) : handleGenerate} 
                    disabled={!isMobile && (isGenerating || !topic.trim())} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isMobile ? (
                      <><Plus className="w-4 h-4 mr-2" />Create Your First Hook</>
                    ) : (
                      isGenerating ? "Generating..." : "Generate Your First Hooks"
                    )}
                  </Button>
                  {!isMobile && (
                    <Button variant="outline">
                      <Video className="w-4 h-4 mr-2" />
                      Watch Tutorial
                    </Button>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Mobile Bottom Bar */}
        {isMobile && (
          <MobileBottomBar
            onExport={handleExportCsv}
            onGenerateMore={handleTryMore}
            onNewHook={() => setIsSidebarOpen(true)}
            onToggleView={() => setUseTriModalView(!useTriModalView)}
            isExporting={exportCsvMutation.isPending}
            isGenerating={isGenerating}
            useTriModalView={useTriModalView}
            hasHooks={!!currentGeneration}
            className="fixed bottom-0 left-0 right-0 z-40"
          />
        )}

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        creditInfo={creditInfo}
      />
      </div>
    </ErrorBoundary>
  );
}