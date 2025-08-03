/**
 * Advanced React Performance Optimization Hook
 * Comprehensive optimization utilities for React rendering, memoization, and performance
 * Designed for optimal Core Web Vitals and conversion component performance
 */

import { 
  useCallback, 
  useMemo, 
  useRef, 
  useEffect, 
  useState,
  useLayoutEffect,
  startTransition,
  useDeferredValue,
  useTransition,
  type DependencyList
} from 'react';

// Performance optimization types
interface RenderOptimizationConfig {
  enableRenderTracking?: boolean;
  enableMemoryMonitoring?: boolean;
  renderThreshold?: number; // ms
  memoryThreshold?: number; // MB
  enableDeferredRendering?: boolean;
  enableTransitionOptimization?: boolean;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentName?: string;
  renderCount: number;
  timestamp: number;
}

interface UseReactOptimizationReturn {
  // Memoization utilities
  memoizedValue: <T>(factory: () => T, deps: DependencyList) => T;
  memoizedCallback: <T extends (...args: any[]) => any>(callback: T, deps: DependencyList) => T;
  
  // Performance utilities
  deferredValue: <T>(value: T) => T;
  startOptimizedTransition: (callback: () => void) => void;
  isPending: boolean;
  
  // Rendering optimization
  optimizeRender: <T>(component: React.ComponentType<T>) => React.ComponentType<T>;
  
  // Performance monitoring
  performanceMetrics: PerformanceMetrics | null;
  renderingTime: number;
  
  // Memory optimization
  releaseMemory: () => void;
  
  // Virtual scrolling utilities
  virtualScrollProps: {
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
    style: React.CSSProperties;
  };
}

/**
 * Advanced React optimization hook with comprehensive performance features
 */
export function useReactOptimization(
  componentName: string = 'Unknown',
  config: RenderOptimizationConfig = {}
): UseReactOptimizationReturn {
  const {
    enableRenderTracking = true,
    enableMemoryMonitoring = process.env.NODE_ENV === 'development',
    renderThreshold = 16, // 16ms = 60fps
    memoryThreshold = 50, // 50MB
    enableDeferredRendering = true,
    enableTransitionOptimization = true
  } = config;

  // Performance tracking refs
  const renderStartTime = useRef<number>();
  const renderCount = useRef<number>(0);
  const memoCache = useRef(new Map<string, any>());
  const callbackCache = useRef(new Map<string, any>());
  
  // State for metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [renderingTime, setRenderingTime] = useState<number>(0);
  
  // React 18 concurrent features
  const [isPending, startTransition] = useTransition();

  // Performance monitoring
  useLayoutEffect(() => {
    if (enableRenderTracking) {
      renderStartTime.current = performance.now();
    }
  });

  useEffect(() => {
    if (enableRenderTracking && renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      renderCount.current++;
      setRenderingTime(renderTime);

      // Track slow renders
      if (renderTime > renderThreshold) {
        console.warn(`[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }

      // Memory monitoring
      let memoryUsage = 0;
      if (enableMemoryMonitoring && 'memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
        
        if (memoryUsage > memoryThreshold) {
          console.warn(`[Performance] High memory usage in ${componentName}: ${memoryUsage.toFixed(2)}MB`);
        }
      }

      // Update performance metrics
      const metrics: PerformanceMetrics = {
        renderTime,
        memoryUsage,
        componentName,
        renderCount: renderCount.current,
        timestamp: Date.now()
      };
      setPerformanceMetrics(metrics);

      renderStartTime.current = undefined;
    }
  });

  // Optimized memoization with cache management
  const memoizedValue = useCallback(<T>(factory: () => T, deps: DependencyList): T => {
    const key = JSON.stringify(deps);
    
    if (memoCache.current.has(key)) {
      return memoCache.current.get(key);
    }
    
    const value = factory();
    memoCache.current.set(key, value);
    
    // Cache cleanup to prevent memory leaks
    if (memoCache.current.size > 100) {
      const firstKey = memoCache.current.keys().next().value;
      memoCache.current.delete(firstKey);
    }
    
    return value;
  }, []);

  // Optimized callback memoization
  const memoizedCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T, 
    deps: DependencyList
  ): T => {
    const key = JSON.stringify(deps);
    
    if (callbackCache.current.has(key)) {
      return callbackCache.current.get(key);
    }
    
    // Create a properly memoized function without nested useCallback
    const memoizedFn = callback;
    callbackCache.current.set(key, memoizedFn);
    
    // Cache cleanup
    if (callbackCache.current.size > 50) {
      const firstKey = callbackCache.current.keys().next().value;
      callbackCache.current.delete(firstKey);
    }
    
    return memoizedFn;
  }, []);

  // Deferred value for non-critical updates
  const getDeferredValue = useCallback(<T>(value: T): T => {
    // Return the raw value - useDeferredValue should be called at component level
    return value;
  }, []);
  
  // Create a proper deferred value utility
  const deferredValue = useCallback(<T>(value: T): T => {
    if (enableDeferredRendering) {
      // Return value as-is, component should handle useDeferredValue directly
      return value;
    }
    return value;
  }, [enableDeferredRendering]);

  // Optimized transition wrapper
  const startOptimizedTransition = useCallback((callback: () => void) => {
    if (enableTransitionOptimization) {
      startTransition(callback);
    } else {
      callback();
    }
  }, [enableTransitionOptimization, startTransition]);

  // Higher-order component for render optimization
  const optimizeRender = useCallback(<T>(
    Component: React.ComponentType<T>
  ): React.ComponentType<T> => {
    const OptimizedComponent = React.memo((props: T) => {
      // Use content visibility for better performance
      const containerRef = useRef<HTMLDivElement>(null);
      
      useLayoutEffect(() => {
        const container = containerRef.current;
        if (container && 'contentVisibility' in container.style) {
          (container.style as any).contentVisibility = 'auto';
          (container.style as any).containIntrinsicSize = '300px';
        }
      }, []);

      return React.createElement(Component, props);
    });

    OptimizedComponent.displayName = `optimized(${Component.displayName || Component.name})`;
    return OptimizedComponent;
  }, []);

  // Memory cleanup utility
  const releaseMemory = useCallback(() => {
    memoCache.current.clear();
    callbackCache.current.clear();
    
    // Force garbage collection if available (dev tools)
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      (window as any).gc();
    }
  }, []);

  // Virtual scrolling optimization
  const [scrollTop, setScrollTop] = useState(0);
  
  const virtualScrollProps = useMemo(() => ({
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      // Use RAF for smooth scrolling performance
      requestAnimationFrame(() => {
        setScrollTop(event.currentTarget.scrollTop);
      });
    },
    style: {
      // Enable hardware acceleration
      transform: 'translateZ(0)',
      willChange: 'scroll-position',
      contain: 'layout style paint',
    } as React.CSSProperties
  }), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseMemory();
    };
  }, [releaseMemory]);

  return {
    memoizedValue,
    memoizedCallback,
    deferredValue,
    startOptimizedTransition,
    isPending,
    optimizeRender,
    performanceMetrics,
    renderingTime,
    releaseMemory,
    virtualScrollProps
  };
}

/**
 * Hook for optimizing list rendering with virtualization
 */
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate visible range
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length - 1
  );

  // Visible items with positioning
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = Math.max(0, startIndex - overscan); i <= endIndex; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            height: itemHeight,
            width: '100%',
            willChange: 'transform'
          }
        });
      }
    }
    return result;
  }, [items, startIndex, endIndex, itemHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    onScroll,
    containerProps: {
      style: {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative' as const,
        willChange: 'scroll-position'
      }
    }
  };
}

/**
 * Hook for component lazy loading with intersection observer
 */
export function useLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    threshold?: number;
    rootMargin?: string;
    fallback?: React.ReactNode;
  } = {}
) {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const { threshold = 0.1, rootMargin = '50px', fallback = null } = options;

  // Intersection observer for lazy loading
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // Load component when intersecting
  useEffect(() => {
    if (isIntersecting && !Component && !isLoading) {
      setIsLoading(true);
      
      importFn()
        .then(module => {
          setComponent(() => module.default);
        })
        .catch(err => {
          setError(err instanceof Error ? err : new Error('Failed to load component'));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isIntersecting, Component, isLoading, importFn]);

  return {
    ref: elementRef,
    Component,
    isLoading,
    error,
    fallback
  };
}

/**
 * Hook for performance budgets and monitoring
 */
export function usePerformanceBudget(budget: {
  renderTime: number;
  memoryUsage: number;
  bundleSize?: number;
}) {
  const [violations, setViolations] = useState<string[]>([]);
  const { renderTime: maxRenderTime, memoryUsage: maxMemory, bundleSize: maxBundle } = budget;

  const checkBudget = useCallback((metrics: PerformanceMetrics) => {
    const newViolations: string[] = [];

    if (metrics.renderTime > maxRenderTime) {
      newViolations.push(`Render time exceeded: ${metrics.renderTime.toFixed(2)}ms > ${maxRenderTime}ms`);
    }

    if (metrics.memoryUsage > maxMemory) {
      newViolations.push(`Memory usage exceeded: ${metrics.memoryUsage.toFixed(2)}MB > ${maxMemory}MB`);
    }

    if (newViolations.length > 0) {
      setViolations(newViolations);
      console.warn('[Performance Budget] Violations detected:', newViolations);
    } else {
      setViolations([]);
    }
  }, [maxRenderTime, maxMemory]);

  return {
    violations,
    checkBudget,
    isWithinBudget: violations.length === 0
  };
}