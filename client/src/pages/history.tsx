import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Search, Filter, Download, Calendar, Eye, Heart, Copy, MoreVertical, Trash2 } from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { HookGeneration } from "@shared/schema";
import HookResults from "../components/hook-results";

export default function History() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedGeneration, setSelectedGeneration] = useState<HookGeneration | null>(null);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: () => apiRequest("GET", "/api/users/me").then(res => res.json()),
  });

  const { data: generations, isLoading } = useQuery({
    queryKey: ["/api/generations"],
    queryFn: () => apiRequest("GET", "/api/generations").then(res => res.json()),
  }) as { data: HookGeneration[] | undefined; isLoading: boolean };

  const saveFavoriteMutation = useMutation({
    mutationFn: async ({ generationId, hookIndex }: { generationId: string; hookIndex: number }) => {
      const response = await apiRequest("POST", "/api/favorites", {
        userId: user?.id,
        generationId,
        hookIndex
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hook saved to favorites!",
        description: "You can view it in your favorites page."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", user?.id] });
    },
    onError: () => {
      toast({
        title: "Error saving hook",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteGenerationMutation = useMutation({
    mutationFn: async (generationId: string) => {
      const response = await apiRequest("DELETE", `/api/generations/${generationId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Generation deleted",
        description: "The hook generation has been removed from your history."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
    },
    onError: () => {
      toast({
        title: "Error deleting generation",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: "Hook text has been copied."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying manually.",
        variant: "destructive"
      });
    }
  };

  const exportCsvMutation = useMutation({
    mutationFn: async (generationId: string) => {
      const response = await apiRequest("POST", "/api/export-csv", { generationId });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `hooks-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "CSV exported!",
        description: "Your hooks have been downloaded."
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Unknown date';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return <SiTiktok className="w-4 h-4" />;
      case 'instagram':
        return <SiInstagram className="w-4 h-4 text-pink-500" />;
      case 'youtube':
        return <SiYoutube className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const filteredGenerations = generations?.filter(gen => {
    const matchesSearch = searchTerm === "" || 
      gen.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gen.hooks?.some(hook => hook.hook.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlatform = selectedPlatform === "all" || gen.platform === selectedPlatform;
    
    return matchesSearch && matchesPlatform;
  }) || [];

  if (selectedGeneration) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedGeneration(null)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-navy mb-2">Hook Generation Details</h1>
                <div className="flex items-center gap-3 text-sm text-slate">
                  <div className="flex items-center gap-1">
                    {getPlatformIcon(selectedGeneration.platform)}
                    <span className="capitalize">{selectedGeneration.platform}</span>
                  </div>
                  <span>•</span>
                  <span>{formatDate(selectedGeneration.createdAt)}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedGeneration.objective?.replace('_', ' ')}</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => exportCsvMutation.mutate(selectedGeneration.id)}
                disabled={exportCsvMutation.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Topic */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Video Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate leading-relaxed">{selectedGeneration.topic}</p>
            </CardContent>
          </Card>

          {/* Hook Results */}
          <div className="space-y-4">
            {selectedGeneration.hooks.map((hook, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-xs">
                    {hook.framework}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(hook.hook)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveFavoriteMutation.mutate({
                        generationId: selectedGeneration.id,
                        hookIndex: index
                      })}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-navy font-medium mb-2">"{hook.hook}"</p>
                <p className="text-sm text-slate mb-2">{hook.rationale}</p>
                {hook.platformNotes && (
                  <p className="text-xs text-slate bg-slate-50 p-2 rounded">
                    Platform note: {hook.platformNotes}
                  </p>
                )}
                <div className="flex justify-between items-center mt-2 text-xs text-slate">
                  <span>Score: {hook.score}/5</span>
                  <span>{hook.wordCount} words</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/app")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Studio
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-navy mb-2">Generation History</h1>
              <p className="text-slate">
                {filteredGenerations.length} generation{filteredGenerations.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate w-4 h-4" />
                <Input
                  placeholder="Search hooks or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    {selectedPlatform === "all" ? "All Platforms" : selectedPlatform}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedPlatform("all")}>
                    All Platforms
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPlatform("tiktok")}>
                    <SiTiktok className="w-4 h-4 mr-2" />
                    TikTok
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPlatform("instagram")}>
                    <SiInstagram className="w-4 h-4 mr-2 text-pink-500" />
                    Instagram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPlatform("youtube")}>
                    <SiYoutube className="w-4 h-4 mr-2 text-red-600" />
                    YouTube
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Generation List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
                  <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredGenerations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-slate mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-navy mb-2">
                {searchTerm || selectedPlatform !== "all" ? "No results found" : "No generation history yet"}
              </h3>
              <p className="text-slate mb-6">
                {searchTerm || selectedPlatform !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Start generating hooks to see your history here"
                }
              </p>
              {!searchTerm && selectedPlatform === "all" && (
                <Button onClick={() => setLocation("/app")}>
                  Create Your First Hooks
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGenerations.map((generation) => (
              <Card key={generation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(generation.platform)}
                          <Badge variant="secondary" className="capitalize">
                            {generation.platform}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {generation.objective?.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-slate">
                          {formatDate(generation.createdAt)}
                        </span>
                      </div>

                      {/* Topic */}
                      <h3 className="text-lg font-semibold text-navy mb-2 line-clamp-2">
                        {generation.topic}
                      </h3>

                      {/* Preview of hooks */}
                      <div className="text-sm text-slate mb-3">
                        {generation.hooks?.length} hooks generated
                      </div>

                      {/* Top hook preview */}
                      {generation.hooks && generation.hooks.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-slate font-medium mb-1">Top hook:</p>
                          <p className="text-sm text-navy line-clamp-2">
                            "{generation.hooks[0].hook}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGeneration(generation)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportCsvMutation.mutate(generation.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteGenerationMutation.mutate(generation.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}