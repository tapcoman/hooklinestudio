import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart, Copy, Share2, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MobileHookCardProps {
  hook: string;
  framework: string;
  rationale: string;
  score?: number;
  index?: number;
  total?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onSave?: () => void;
  isDemo?: boolean;
  isFavorited?: boolean;
  className?: string;
}

export function MobileHookCard({ 
  hook, 
  framework, 
  rationale, 
  score, 
  index = 1, 
  total = 10,
  onNext,
  onPrevious,
  onSave,
  isDemo = false,
  isFavorited = false,
  className 
}: MobileHookCardProps) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(isFavorited);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook);
      toast({
        title: "Copied to clipboard!",
        description: "Hook text has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hook Line Studio - Generated Hook',
          text: hook,
        });
      } catch (error) {
        // User cancelled sharing
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onSave?.();
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Hook removed from your favorites." : "Hook saved to your favorites.",
    });
  };

  return (
    <Card 
      className={cn("w-full max-w-sm mx-auto bg-white shadow-sm border-slate-200", className)}
      role="article"
      aria-label={`Hook ${index} of ${total}: ${hook}`}
    >
      <CardContent className="p-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4" role="navigation" aria-label="Hook navigation">
          <div className="flex space-x-1" role="progressbar" aria-label={`Progress: ${index} of ${total} hooks`} aria-valuenow={index} aria-valuemin={1} aria-valuemax={total}>
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i < index ? "bg-blue-600" : "bg-slate-200"
                )}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 font-medium" aria-live="polite">
            {index} of {total}
          </span>
        </div>

        {/* Hook text - main content */}
        <div className="mb-6">
          <blockquote className="text-lg leading-relaxed font-medium text-slate-900 text-center">
            "{hook}"
          </blockquote>
        </div>

        {/* Framework and score */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3">
            <Badge 
              variant="secondary" 
              className="bg-blue-50 text-blue-700 border-blue-200 font-medium px-3 py-1"
            >
              {framework}
            </Badge>
            {score && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="text-sm font-medium text-slate-700">{score}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons - touch optimized (44px+ height) */}
        {!isDemo && (
          <div className="grid grid-cols-3 gap-3 mb-4" role="group" aria-label="Hook actions">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              className={cn(
                "h-12 flex-col space-y-1 text-xs border-slate-200 touch-target",
                isLiked && "bg-red-50 border-red-200 text-red-600"
              )}
              aria-label={isLiked ? "Remove hook from favorites" : "Add hook to favorites"}
              aria-pressed={isLiked}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} aria-hidden="true" />
              <span>{isLiked ? "Saved" : "Save"}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-12 flex-col space-y-1 text-xs border-slate-200 touch-target"
              aria-label="Copy hook text to clipboard"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>Copy</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-12 flex-col space-y-1 text-xs border-slate-200 touch-target"
              aria-label="Share hook"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              <span>Share</span>
            </Button>
          </div>
        )}

        {/* Navigation arrows for swiping */}
        {!isDemo && (onNext || onPrevious) && (
          <div className="flex justify-between items-center" role="navigation" aria-label="Hook navigation controls">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={index === 1}
              className="h-10 px-4 text-slate-600 disabled:opacity-30 touch-target"
              aria-label="Go to previous hook"
            >
              ← Previous
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={index === total}
              className="h-10 px-4 text-slate-600 disabled:opacity-30 touch-target"
              aria-label="Go to next hook"
            >
              Next →
            </Button>
          </div>
        )}

        {/* Rationale - smaller text at bottom */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            {rationale}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for swipe gestures
export function useSwipeGesture(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}