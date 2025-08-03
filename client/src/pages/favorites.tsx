import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, Trash2, ArrowLeft, Heart, Search, Filter } from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import type { FavoriteHook } from "@shared/schema";

export default function Favorites() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useFirebaseAuth();
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "framework">("newest");
  
  if (!user?.uid) {
    setLocation("/onboarding");
    return null;
  }

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["/api/favorites", "all"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/favorites");
      return response.json() as Promise<FavoriteHook[]>;
    },
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      await apiRequest("DELETE", `/api/favorites/${favoriteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", "all"] });
      toast({
        title: "Favorite removed",
        description: "Hook has been removed from your favorites.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove favorite",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = async (text: string) => {
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
  };

  const getFrameworkColor = (framework: string) => {
    const colorMap: Record<string, string> = {
      "Open Loop": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Problem": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "4U's": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "AIDA": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "PAS": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "Direct": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    };
    return colorMap[framework] || "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "tiktok": return <SiTiktok className="w-4 h-4" />;
      case "instagram": return <SiInstagram className="w-4 h-4" />;
      case "youtube": return <SiYoutube className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colorMap: Record<string, string> = {
      "tiktok": "bg-black text-white",
      "instagram": "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      "youtube": "bg-red-600 text-white"
    };
    return colorMap[platform?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  // Filter and sort favorites
  const filteredFavorites = favorites?.filter(favorite => {
    const matchesSearch = searchTerm === "" || 
      favorite.hook.toLowerCase().includes(searchTerm.toLowerCase()) ||
      favorite.framework.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (favorite.topic && favorite.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (favorite.platformNotes && favorite.platformNotes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFramework = selectedFramework === "all" || favorite.framework === selectedFramework;
    const matchesPlatform = selectedPlatform === "all" || favorite.platform === selectedPlatform;
    
    return matchesSearch && matchesFramework && matchesPlatform;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "oldest":
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case "framework":
        return a.framework.localeCompare(b.framework);
      default:
        return 0;
    }
  }) || [];

  const uniqueFrameworks = Array.from(new Set(favorites?.map(f => f.framework) || []));
  const uniquePlatforms = Array.from(new Set(favorites?.map(f => f.platform).filter(Boolean) || []));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading your favorite hooks...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/app")}
              className="btn-enhanced h-8 sm:h-10 px-2 sm:px-3 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Generator</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Favorite Hooks</h1>
            </div>
          </div>
          <Badge variant="secondary" className="px-3 py-1 self-start sm:self-auto">
            {filteredFavorites.length} of {favorites.length} hooks
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {favorites.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">No hooks yet—try your first idea.</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
              Save your best hooks to easily find and reuse them later. Click the heart icon on any hook to add it to your favorites.
            </p>
            <Button
              onClick={() => setLocation("/app")}
              className="btn-enhanced h-10 sm:h-12 px-4 sm:px-6 rounded-xl"
            >
              Try your first idea
            </Button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search hooks, frameworks, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-12 rounded-xl"
                />
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                {/* Framework Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="btn-enhanced h-10 sm:h-12 px-3 sm:px-4 rounded-xl">
                      <Filter className="w-4 h-4 mr-2" />
                      {selectedFramework === "all" ? "All Frameworks" : selectedFramework}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedFramework("all")}>
                      All Frameworks
                    </DropdownMenuItem>
                    {uniqueFrameworks.map(framework => (
                      <DropdownMenuItem key={framework} onClick={() => setSelectedFramework(framework)}>
                        <Badge className={`${getFrameworkColor(framework)} mr-2 text-xs`}>
                          {framework}
                        </Badge>
                        {framework}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Platform Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="btn-enhanced h-10 sm:h-12 px-3 sm:px-4 rounded-xl">
                      <Filter className="w-4 h-4 mr-2" />
                      {selectedPlatform === "all" ? "All Platforms" : selectedPlatform}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedPlatform("all")}>
                      All Platforms
                    </DropdownMenuItem>
                    {uniquePlatforms.map(platform => (
                      <DropdownMenuItem key={platform} onClick={() => setSelectedPlatform(platform || "")}>
                        <div className="flex items-center gap-2">
                          {platform === 'tiktok' && <SiTiktok className="w-4 h-4" />}
                          {platform === 'instagram' && <SiInstagram className="w-4 h-4 text-pink-500" />}
                          {platform === 'youtube' && <SiYoutube className="w-4 h-4 text-red-600" />}
                          <span className="capitalize">{platform}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort By */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="btn-enhanced h-10 sm:h-12 px-3 sm:px-4 rounded-xl">
                      Sort: {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Framework"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("newest")}>
                      Newest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                      Oldest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("framework")}>
                      By Framework
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Results */}
            {filteredFavorites.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hooks found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedFramework !== "all" || selectedPlatform !== "all"
                    ? "Try adjusting your search or filters." 
                    : "No hooks saved yet."}
                </p>
                {(searchTerm || selectedFramework !== "all" || selectedPlatform !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedFramework("all");
                      setSelectedPlatform("all");
                    }}
                    className="btn-enhanced"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {filteredFavorites.map((favorite) => (
                <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Badge 
                          className={`${getFrameworkColor(favorite.framework)} px-2 sm:px-3 py-1 text-xs font-medium rounded-full`}
                        >
                          {favorite.framework}
                        </Badge>
                        {favorite.platform && (
                          <Badge variant="outline" className="px-2 py-1 text-xs">
                            <div className="flex items-center gap-1">
                              {favorite.platform === 'tiktok' && <SiTiktok className="w-3 h-3" />}
                              {favorite.platform === 'instagram' && <SiInstagram className="w-3 h-3 text-pink-500" />}
                              {favorite.platform === 'youtube' && <SiYoutube className="w-3 h-3 text-red-600" />}
                              <span className="capitalize font-medium">
                                {favorite.platform}
                              </span>
                            </div>
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Saved {favorite.createdAt ? new Date(favorite.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(favorite.hook)}
                          className="btn-enhanced h-8 w-8 p-0 rounded-lg"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFavoriteMutation.mutate(favorite.id)}
                          disabled={deleteFavoriteMutation.isPending}
                          className="btn-enhanced h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {favorite.topic && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary">Original Topic</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                          "{favorite.topic}"
                        </p>
                      </div>
                    )}
                    
                    <div>
                      {favorite.hookData && (favorite.hookData.visualHook || favorite.hookData.textualHook) ? (
                        // Tri-modal hook display
                        <div className="space-y-3">
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Verbal Hook</p>
                            <p className="text-foreground font-medium leading-relaxed">
                              "{favorite.hookData.verbalHook || favorite.hook}"
                            </p>
                          </div>
                          
                          {favorite.hookData.visualHook && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Visual Hook</p>
                              <p className="text-foreground leading-relaxed">
                                {favorite.hookData.visualHook}
                              </p>
                            </div>
                          )}
                          
                          {favorite.hookData.textualHook && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Text Overlay</p>
                              <p className="text-foreground font-medium leading-relaxed">
                                "{favorite.hookData.textualHook}"
                              </p>
                            </div>
                          )}
                          
                          {favorite.hookData.psychologicalDriver && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Badge variant="outline" className="text-xs">
                                {favorite.hookData.psychologicalDriver}
                              </Badge>
                              {favorite.hookData.hookCategory && (
                                <Badge variant="outline" className="text-xs">
                                  {favorite.hookData.hookCategory}
                                </Badge>
                              )}
                              {favorite.hookData.score && (
                                <Badge variant="outline" className="text-xs">
                                  Score: {favorite.hookData.score}/5
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Classic hook display
                        <p className="text-foreground font-medium leading-relaxed">
                          "{favorite.hook}"
                        </p>
                      )}
                    </div>
                    
                    {favorite.platformNotes && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-foreground mb-2">Platform Notes</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {favorite.platformNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-center pt-8 border-t border-border">
              <Button
                onClick={() => setLocation("/app")}
                className="btn-enhanced h-12 px-8 rounded-xl"
              >
                Try 10 more
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}