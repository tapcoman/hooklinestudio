import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Wand2, Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { useIsMobile } from "@/hooks/use-mobile";
import type { HookGeneration } from "@shared/schema";

type Platform = "tiktok" | "instagram" | "youtube";
type Objective = "watch_time" | "shares" | "saves" | "ctr";

interface CollapsibleSidebarProps {
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;
  objective: Objective;
  setObjective: (objective: Objective) => void;
  topic: string;
  setTopic: (topic: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generations?: HookGeneration[];
  onGenerationSelect: (generation: HookGeneration) => void;
}

const platforms = [
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
];

const objectives = [
  { value: "watch_time" as Objective, label: "Watch time" },
  { value: "shares" as Objective, label: "Shares" },
  { value: "saves" as Objective, label: "Saves" },
  { value: "ctr" as Objective, label: "Click-through rate" }
];

export default function CollapsibleSidebar({
  selectedPlatform,
  setSelectedPlatform,
  objective,
  setObjective,
  topic,
  setTopic,
  onGenerate,
  isGenerating,
  generations,
  onGenerationSelect
}: CollapsibleSidebarProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Auto-collapse on mobile after generation
  useEffect(() => {
    if (isMobile && !isGenerating) {
      setIsExpanded(false);
      setIsSheetOpen(false);
    }
  }, [isMobile, isGenerating]);

  const InputContent = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Platform Selection */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">Platform</Label>
        <div className="grid grid-cols-3 gap-2">
          {platforms.map((platform) => {
            const isSelected = selectedPlatform === platform.value;
            const IconComponent = platform.value === "tiktok" ? SiTiktok : 
                                 platform.value === "instagram" ? SiInstagram : SiYoutube;
            
            return (
              <Button
                key={platform.value}
                type="button"
                variant="outline"
                className={`p-3 h-auto flex-col space-y-1 text-xs relative overflow-hidden min-h-[44px] ${
                  isSelected 
                    ? `${platform.color} ${platform.textColor} border-transparent` 
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
                onClick={() => setSelectedPlatform(platform.value)}
              >
                <IconComponent className={`text-lg ${
                  isSelected ? platform.textColor : 
                  platform.value === "tiktok" ? "text-black" :
                  platform.value === "instagram" ? "text-pink-500" :
                  "text-red-600"
                }`} />
                <span className={`text-xs font-medium ${
                  isSelected ? platform.textColor : "text-slate-700"
                }`}>
                  {platform.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Objective Selection */}
      <div>
        <Label htmlFor="objective" className="text-sm font-medium text-slate-700 mb-2 block">Objective</Label>
        <Select value={objective} onValueChange={(value: Objective) => setObjective(value)}>
          <SelectTrigger className="h-12">
            <SelectValue />
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
      <div>
        <Label htmlFor="topic" className="text-sm font-medium text-slate-700 mb-2 block">Video Topic</Label>
        <Textarea
          id="topic"
          placeholder="Describe your video idea... e.g., '7-day sugar-free experiment results'"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="h-32 resize-none text-sm"
          aria-describedby="topic-description"
          aria-label="Video topic description"
        />
        <p id="topic-description" className="text-xs text-slate-500 mt-1">Be specific about what your video will cover</p>
      </div>

      {/* Generate Button */}
      <Button 
        className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl min-h-[44px]"
        onClick={onGenerate}
        disabled={isGenerating || !topic.trim()}
      >
        <Wand2 className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
        {isGenerating ? "Generating..." : "Generate 10 Hooks"}
      </Button>

      {/* Recent Topics */}
      {generations && generations.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">Recent Topics</h4>
            <div className="space-y-2">
              {generations.slice(0, 5).map((gen) => (
                <Button
                  key={gen.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 bg-slate-50 hover:bg-slate-100 min-h-[44px]"
                  onClick={() => onGenerationSelect(gen)}
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
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile: Collapsible Card */}
        <Card className="mx-4 mb-4">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-2 h-auto min-h-[44px]"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center space-x-2">
                <Wand2 className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-slate-900">New Hook Generation</span>
              </div>
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
            
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <InputContent />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile: Sheet for Advanced Options */}
        <div className="fixed bottom-4 right-4 z-40">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh]">
              <SheetHeader>
                <SheetTitle>Hook Generation</SheetTitle>
              </SheetHeader>
              <div className="mt-6 overflow-y-auto pb-6">
                <InputContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  // Desktop: Original sidebar layout
  return (
    <div className="w-full lg:w-1/3 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Hooks</h3>
          <InputContent />
        </div>
      </div>
    </div>
  );
}