import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Wand2, X } from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from 'react-icons/si';
import type { HookGeneration } from '@shared/schema';

type Platform = "tiktok" | "instagram" | "youtube";
type Objective = "watch_time" | "shares" | "saves" | "ctr";

interface MobileSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;
  objective: Objective;
  setObjective: (objective: Objective) => void;
  topic: string;
  setTopic: (topic: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generations?: HookGeneration[];
  setCurrentGeneration?: (generation: HookGeneration) => void;
  trigger?: React.ReactNode;
}

export function MobileSidebar({
  isOpen,
  onOpenChange,
  selectedPlatform,
  setSelectedPlatform,
  objective,
  setObjective,
  topic,
  setTopic,
  onGenerate,
  isGenerating,
  generations,
  setCurrentGeneration,
  trigger
}: MobileSidebarProps) {
  const platforms = [
    { 
      value: "tiktok" as Platform, 
      label: "TikTok", 
      icon: SiTiktok,
      color: "bg-black",
      textColor: "text-white"
    },
    { 
      value: "instagram" as Platform, 
      label: "Reels", 
      icon: SiInstagram,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      textColor: "text-white"
    },
    { 
      value: "youtube" as Platform, 
      label: "Shorts", 
      icon: SiYoutube,
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

  const handleGenerate = () => {
    onGenerate();
    onOpenChange(false); // Close sidebar after generating
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger && (
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
      )}
      
      <SheetContent side="left" className="w-full sm:w-96 p-0">
        <SheetHeader className="p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Create New Hooks</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6 overflow-y-auto h-full pb-24">
          {/* Platform Selection */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">Platform</Label>
            <div className="grid grid-cols-1 gap-3">
              {platforms.map((platform) => {
                const isSelected = selectedPlatform === platform.value;
                const IconComponent = platform.icon;
                
                return (
                  <Button
                    key={platform.value}
                    type="button"
                    variant="outline"
                    className={`p-4 h-auto flex items-center space-x-3 text-left relative overflow-hidden ${
                      isSelected 
                        ? `${platform.color} ${platform.textColor} border-transparent` 
                        : "bg-white hover:bg-slate-50 border-slate-200"
                    }`}
                    onClick={() => setSelectedPlatform(platform.value)}
                  >
                    <IconComponent className={`text-xl ${
                      isSelected ? platform.textColor : 
                      platform.value === "tiktok" ? "text-black" :
                      platform.value === "instagram" ? "text-pink-500" :
                      "text-red-600"
                    }`} />
                    <span className={`font-medium ${
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
            <Label htmlFor="objective" className="text-sm font-medium text-slate-700 mb-2 block">
              Objective
            </Label>
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
            <Label htmlFor="topic" className="text-sm font-medium text-slate-700 mb-2 block">
              Video Topic
            </Label>
            <Textarea
              id="topic"
              placeholder="Describe your video idea... e.g., '7-day sugar-free experiment results'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-32 resize-none text-sm"
              aria-describedby="topic-description"
              aria-label="Video topic description"
            />
            <p id="topic-description" className="text-xs text-slate-500 mt-2">
              Be specific about what your video will cover for better hook generation
            </p>
          </div>

          {/* Generate Button */}
          <div>
            <Button 
              className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl bg-blue-600 hover:bg-blue-700"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
            >
              <Wand2 className={`w-5 h-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? "Generating..." : "Generate 10 Hooks"}
            </Button>
          </div>

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
                      className="w-full justify-start h-auto p-3 bg-slate-50 hover:bg-slate-100"
                      onClick={() => {
                        setCurrentGeneration?.(gen);
                        onOpenChange(false);
                      }}
                    >
                      <div className="text-left">
                        <p className="text-sm text-slate-900 font-medium truncate">
                          {gen.topic}
                        </p>
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
      </SheetContent>
    </Sheet>
  );
}