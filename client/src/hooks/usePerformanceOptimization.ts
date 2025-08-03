/**
 * Performance optimization hooks and utilities with strict TypeScript typing
 * Provides memoization, debouncing, throttling, and component performance monitoring
 * for conversion optimization components
 */

import { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  type DependencyList,
  type EffectCallback,
  type MutableRefObject
} from 'react';
import React from 'react';
import type { 
  UsePerformanceOptimizationReturn,
  CallbackConfig,
  MemoizedComponentProps
} from '@/types/conversion';
import type { EventHandler } from '@/types/utils';

/**
 * Enhanced performance optimization hook with comprehensive TypeScript support
 * Provides optimized callbacks, memoization, and performance monitoring
 */
export function usePerformanceOptimization(): UsePerformanceOptimizationReturn {
  const memoizedCallbacks = useRef(new Map<string, any>());
  const debouncedCallbacks = useRef(new Map<string, { fn: any; timeoutId: NodeJS.Timeout | null }>());
  const throttledCallbacks = useRef(new Map<string, { fn: any; lastCall: number }>());

  /**
   * Create a memoized callback with dependency tracking
   */
  const memoizedCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    deps: readonly any[]
  ): T => {
    const key = JSON.stringify(deps);
    
    if (!memoizedCallbacks.current.has(key)) {
      memoizedCallbacks.current.set(key, callback);
    }
    
    return memoizedCallbacks.current.get(key) as T;
  }, []);

  /**
   * Create a debounced callback with configurable delay
   */
  const debouncedCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ): T => {
    const key = `${callback.toString()}_${delay}`;
    
    const debouncedFn = (...args: Parameters<T>) => {
      const existing = debouncedCallbacks.current.get(key);
      
      if (existing?.timeoutId) {
        clearTimeout(existing.timeoutId);
      }
      
      const timeoutId = setTimeout(() => {
        callback(...args);
        debouncedCallbacks.current.delete(key);
      }, delay);
      
      debouncedCallbacks.current.set(key, { fn: callback, timeoutId });
    };
    
    return debouncedFn as T;
  }, []);

  /**
   * Create a throttled callback with configurable delay
   */
  const throttledCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ): T => {
    const key = `${callback.toString()}_${delay}`;
    
    const throttledFn = (...args: Parameters<T>) => {
      const existing = throttledCallbacks.current.get(key);
      const now = Date.now();
      
      if (!existing || now - existing.lastCall >= delay) {
        throttledCallbacks.current.set(key, { fn: callback, lastCall: now });
        return callback(...args);
      }
    };
    
    return throttledFn as T;
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      debouncedCallbacks.current.forEach(({ timeoutId }) => {
        if (timeoutId) clearTimeout(timeoutId);
      });
      debouncedCallbacks.current.clear();
      throttledCallbacks.current.clear();
      memoizedCallbacks.current.clear();
    };
  }, []);

  return {
    memoizedCallback,
    debouncedCallback,
    throttledCallback
  };
}

/**
 * Enhanced useCallback with configuration options
 * Provides debouncing, throttling, and dependency optimization
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  config: CallbackConfig
): T {
  const { dependencies, debounceMs, throttleMs } = config;
  const { debouncedCallback, throttledCallback } = usePerformanceOptimization();

  return useMemo(() => {
    if (debounceMs) {
      return debouncedCallback(callback, debounceMs);
    }
    
    if (throttleMs) {
      return throttledCallback(callback, throttleMs);
    }
    
    return callback;
  }, dependencies) as T;
}

/**
 * Memoized event handler hook with proper typing
 * Optimizes event handlers for conversion components
 */
export function useMemoizedEventHandler<T extends Event = Event>(
  handler: EventHandler<T>,
  dependencies: DependencyList = []
): EventHandler<T> {
  return useCallback(handler, dependencies);
}

/**
 * Optimized state setter with batching and validation
 */
export function useOptimizedState<T>(
  initialValue: T,
  options?: {
    validator?: (value: T) => boolean;
    batchUpdates?: boolean;
    debounceMs?: number;
  }
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const { validator, batchUpdates = false, debounceMs } = options || {};
  const { debouncedCallback } = usePerformanceOptimization();
  
  const optimizedSetState = useCallback((value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
    
    // Validate if validator provided
    if (validator && !validator(newValue)) {
      console.warn('[useOptimizedState] Validation failed for value:', newValue);
      return;
    }
    
    if (batchUpdates) {
      // Use React's automatic batching in React 18+
      React.unstable_batchedUpdates(() => {
        setState(newValue);
      });
    } else {
      setState(newValue);
    }
  }, [state, validator, batchUpdates]);

  // Apply debouncing if specified
  const finalSetState = debounceMs 
    ? debouncedCallback(optimizedSetState, debounceMs)
    : optimizedSetState;

  return [state, finalSetState];
}

/**
 * Component performance monitoring hook
 * Tracks render times and provides performance insights
 */
export function usePerformanceMonitoring(
  componentName: string,
  options?: {
    trackRenderTime?: boolean;
    trackMemoryUsage?: boolean;
    sampleRate?: number;
    onPerformanceData?: (data: PerformanceData) => void;
  }
) {
  const renderStartTime = useRef<number>();
  const renderCount = useRef<number>(0);
  const { 
    trackRenderTime = true,
    trackMemoryUsage = false,
    sampleRate = 1.0,
    onPerformanceData
  } = options || {};

  // Track render start
  useEffect(() => {
    if (trackRenderTime && Math.random() <= sampleRate) {
      renderStartTime.current = performance.now();
    }
  });

  // Track render completion
  useEffect(() => {
    if (renderStartTime.current && trackRenderTime) {
      const renderTime = performance.now() - renderStartTime.current;
      renderCount.current++;

      const performanceData: PerformanceData = {
        componentName,
        renderTime,
        renderCount: renderCount.current,
        timestamp: Date.now()
      };

      // Add memory usage if enabled and available
      if (trackMemoryUsage && 'memory' in performance) {
        const memory = (performance as any).memory;
        performanceData.memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
      }

      // Call performance data handler
      if (onPerformanceData) {
        onPerformanceData(performanceData);
      }

      // Log in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }

      renderStartTime.current = undefined;
    }
  });

  return {
    renderCount: renderCount.current
  };
}

/**
 * Intersection observer hook with performance optimization
 * Efficiently tracks element visibility for conversion analytics
 */
export function useIntersectionObserver(
  elementRef: MutableRefObject<Element | null>,
  options?: IntersectionObserverInit & {
    trackViewTime?: boolean;
    onVisibilityChange?: (isVisible: boolean, entry: IntersectionObserverEntry) => void;
  }
): {
  isIntersecting: boolean;
  viewTime: number;
  intersectionRatio: number;
} {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [viewTime, setViewTime] = useState(0);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const viewStartTime = useRef<number>();
  const { trackViewTime = true, onVisibilityChange, ...observerOptions } = options || {};

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        const wasIntersecting = isIntersecting;
        const isNowIntersecting = entry.isIntersecting;

        setIsIntersecting(isNowIntersecting);
        setIntersectionRatio(entry.intersectionRatio);

        // Track view time
        if (trackViewTime) {
          if (isNowIntersecting && !wasIntersecting) {
            viewStartTime.current = performance.now();
          } else if (!isNowIntersecting && wasIntersecting && viewStartTime.current) {
            const currentViewTime = performance.now() - viewStartTime.current;
            setViewTime(prev => prev + currentViewTime);
            viewStartTime.current = undefined;
          }
        }

        // Call visibility change handler
        if (onVisibilityChange) {
          onVisibilityChange(isNowIntersecting, entry);
        }
      },
      {
        threshold: 0.1,
        ...observerOptions
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      
      // Final view time calculation if still visible
      if (trackViewTime && viewStartTime.current) {
        const finalViewTime = performance.now() - viewStartTime.current;
        setViewTime(prev => prev + finalViewTime);
      }
    };
  }, [elementRef, isIntersecting, trackViewTime, onVisibilityChange]);

  return {
    isIntersecting,
    viewTime,
    intersectionRatio
  };
}

/**
 * Lazy loading hook with TypeScript support
 * Provides component-level lazy loading with error handling
 */
export function useLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: React.ReactNode;
    onError?: (error: Error) => void;
    preload?: boolean;
  }
): {
  Component: T | null;
  isLoading: boolean;
  error: Error | null;
  preload: () => void;
} {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { onError, preload: shouldPreload = false } = options || {};

  const loadComponent = useCallback(async () => {
    if (Component || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const module = await importFn();
      setComponent(() => module.default);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load component');
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  }, [Component, isLoading, importFn, onError]);

  // Preload if requested
  useEffect(() => {
    if (shouldPreload) {
      loadComponent();
    }
  }, [shouldPreload, loadComponent]);

  return {
    Component,
    isLoading,
    error,
    preload: loadComponent
  };
}

/**
 * Performance data interface
 */
interface PerformanceData {
  componentName: string;
  renderTime: number;
  renderCount: number;
  timestamp: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Higher-order component for performance monitoring
 */
export function withPerformanceMonitoring<P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  options?: Parameters<typeof usePerformanceMonitoring>[1]
): React.ComponentType<P> {
  const WithPerformanceComponent: React.FC<P> = (props) => {
    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    
    usePerformanceMonitoring(componentName, options);

    return React.createElement(WrappedComponent, props);
  };

  WithPerformanceComponent.displayName = 
    `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithPerformanceComponent;
}

/**
 * React 18 concurrent features hook
 * Provides typed access to React 18+ concurrent features
 */
export function useConcurrentFeatures() {
  const [isPending, startTransition] = React.useTransition();
  const deferredValue = React.useDeferredValue;
  const useSyncExternalStore = React.useSyncExternalStore;

  return {
    isPending,
    startTransition,
    deferredValue,
    useSyncExternalStore
  };
}

/**
 * Virtual scrolling hook for large lists
 * Optimizes rendering of large datasets in conversion components
 */
export function useVirtualScrolling<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
): {
  visibleItems: Array<{ item: T; index: number; style: React.CSSProperties }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
} {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length - 1
  );

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = Math.max(0, visibleStartIndex - overscan); i <= visibleEndIndex; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            height: itemHeight,
            width: '100%'
          }
        });
      }
    }
    return result;
  }, [items, visibleStartIndex, visibleEndIndex, itemHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    scrollToIndex
  };
}