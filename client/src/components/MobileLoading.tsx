import { cn } from '@/lib/utils';

interface MobileLoadingProps {
  message?: string;
  type?: 'generating' | 'loading' | 'processing';
  className?: string;
}

export function MobileLoading({ 
  message = "Loading...", 
  type = 'loading',
  className 
}: MobileLoadingProps) {
  const getLoadingIcon = () => {
    switch (type) {
      case 'generating':
        return (
          <div className="relative">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-b-blue-400 rounded-full animate-spin animation-delay-150"></div>
          </div>
        );
      case 'processing':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-100"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-200"></div>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        );
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 px-4",
      className
    )}>
      <div className="mb-4">
        {getLoadingIcon()}
      </div>
      <p className="text-sm text-slate-600 text-center font-medium">
        {message}
      </p>
      {type === 'generating' && (
        <p className="text-xs text-slate-500 text-center mt-2">
          This usually takes 10-30 seconds
        </p>
      )}
    </div>
  );
}

// Loading skeleton for hook cards
export function MobileHookCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto bg-white shadow-sm border-slate-200 rounded-lg">
      <div className="p-6">
        {/* Progress indicator skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="w-12 h-4 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Hook text skeleton */}
        <div className="mb-6 space-y-2">
          <div className="h-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
        </div>

        {/* Framework and score skeleton */}
        <div className="flex items-center justify-center mb-6 space-x-3">
          <div className="w-20 h-6 bg-slate-200 rounded-full animate-pulse" />
          <div className="w-12 h-6 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Action buttons skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>

        {/* Navigation skeleton */}
        <div className="flex justify-between items-center">
          <div className="w-16 h-8 bg-slate-200 rounded animate-pulse" />
          <div className="w-16 h-8 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Full page mobile loading
export function MobilePageLoading({ 
  title = "Loading your hooks...",
  subtitle = "Please wait while we prepare your content."
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6">
        {/* Logo/Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        
        {/* Title */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {title}
          </h2>
          <p className="text-slate-600 text-sm">
            {subtitle}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-100" />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-200" />
        </div>
      </div>
    </div>
  );
}

// CSS for animation delays (add to global CSS if needed)
export const loadingAnimationStyles = `
  .animation-delay-100 {
    animation-delay: 0.1s;
  }
  
  .animation-delay-150 {
    animation-delay: 0.15s;
  }
  
  .animation-delay-200 {
    animation-delay: 0.2s;
  }
  
  .border-3 {
    border-width: 3px;
  }
`;