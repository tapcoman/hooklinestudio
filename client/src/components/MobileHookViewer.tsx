import { useState, useEffect } from 'react';
import { MobileHookCard, useSwipeGesture } from './MobileHookCard';
import { MobileLoading, MobileHookCardSkeleton } from './MobileLoading';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HookGeneration } from '@shared/schema';

interface Hook {
  hook: string;
  framework: string;
  rationale: string;
  score?: number;
}

interface MobileHookViewerProps {
  generation: HookGeneration;
  userId: string;
  useTriModalView?: boolean;
  className?: string;
}

export function MobileHookViewer({ 
  generation, 
  userId, 
  useTriModalView = true,
  className 
}: MobileHookViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  
  const hooks = generation.hooks as Hook[] || [];
  const currentHook = hooks[currentIndex];

  const goToNext = () => {
    if (currentIndex < hooks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const swipeGesture = useSwipeGesture(goToNext, goToPrevious);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  if (!hooks.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No hooks generated yet.</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className={cn("space-y-4", className)}>
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">All Hooks</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('single')}
            className="text-xs"
          >
            <List className="w-4 h-4 mr-1" />
            Card View
          </Button>
        </div>

        {/* Grid of Hooks */}
        <div className="space-y-3">
          {hooks.map((hook, index) => (
            <div
              key={index}
              className="p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => {
                setCurrentIndex(index);
                setViewMode('single');
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-slate-900 flex-1 line-clamp-2">
                  "{hook.hook}"
                </p>
                <span className="text-xs text-slate-500 ml-2">#{index + 1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {hook.framework}
                </span>
                {hook.score && (
                  <span className="text-xs text-amber-600 font-medium">
                    ⭐ {hook.score}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} {...swipeGesture}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm font-medium text-slate-700">
            Hook {currentIndex + 1} of {hooks.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentIndex === hooks.length - 1}
            className="h-9 w-9 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode('grid')}
          className="text-xs"
        >
          <Grid3X3 className="w-4 h-4 mr-1" />
          Grid View
        </Button>
      </div>

      {/* Current Hook Card */}
      <div className="flex justify-center">
        {currentHook && (
          <MobileHookCard
            hook={currentHook.hook}
            framework={currentHook.framework}
            rationale={currentHook.rationale}
            score={currentHook.score}
            index={currentIndex + 1}
            total={hooks.length}
            onNext={goToNext}
            onPrevious={goToPrevious}
            className="w-full max-w-sm"
          />
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center space-x-2 py-4">
        {hooks.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              index === currentIndex 
                ? "bg-blue-600 w-6" 
                : "bg-slate-300 hover:bg-slate-400"
            )}
            aria-label={`Go to hook ${index + 1}`}
          />
        ))}
      </div>

      {/* Swipe Hint */}
      <div className="text-center">
        <p className="text-xs text-slate-500">
          Swipe left or right to navigate between hooks
        </p>
      </div>
    </div>
  );
}