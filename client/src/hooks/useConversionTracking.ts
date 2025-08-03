/**
 * Custom hook for conversion tracking with comprehensive TypeScript support
 * Provides type-safe analytics, A/B testing, and performance monitoring
 */

import { analytics } from '@/lib/analytics';
import type { 
  UseConversionTrackingReturn,
  UseAnalyticsReturn,
  UseABTestingReturn,
  UsePerformanceOptimizationReturn
} from '@/types/conversion';
import type { 
  AnalyticsEvent,
  AnalyticsContext,
  ConversionEvent,
  ABTestAnalytics,
  FunnelAnalytics,
  AnalyticsSummary,
  VariantPerformance
} from '@/types/analytics';
import type { ComponentSize, ResponsiveValue } from '@/types/utils';

/**
 * Hook for comprehensive conversion tracking and analytics
 */
export function useConversionTracking(
  context: Partial<AnalyticsContext> = {}
): UseConversionTrackingReturn {
  const sessionId = useRef<string>(crypto.randomUUID());
  const [conversionRate, setConversionRate] = useState<number>(0);
  const [eventHistory, setEventHistory] = useState<ConversionEvent[]>([]);

  // Create base analytics context
  const baseContext = useMemo<AnalyticsContext>(() => ({
    component: 'Unknown',
    sessionId: sessionId.current,
    timestamp: Date.now(),
    ...context
  }), [context]);

  const trackEvent = useCallback((event: ConversionEvent): void => {
    setEventHistory(prev => [...prev.slice(-99), event]); // Keep last 100 events
    
    // Track in analytics system
    analytics.track(event.type, {
      ...event.context,
      ...event.properties
    });
  }, []);

  const trackCTAClick = useCallback((context: AnalyticsContext): void => {
    const event: ConversionEvent = {
      type: 'cta_click',
      context: { ...baseContext, ...context },
      properties: {
        timestamp: Date.now(),
        sessionId: sessionId.current
      }
    };
    trackEvent(event);
  }, [baseContext, trackEvent]);

  const trackView = useCallback((component: string, context: AnalyticsContext): void => {
    const event: ConversionEvent = {
      type: 'cta_view',
      context: { 
        ...baseContext, 
        component,
        ...context 
      },
      properties: {
        timestamp: Date.now(),
        sessionId: sessionId.current
      }
    };
    trackEvent(event);
  }, [baseContext, trackEvent]);

  const getAnalyticsSummary = useCallback((): AnalyticsSummary => {
    const totalEvents = eventHistory.length;
    const ctaClicks = eventHistory.filter(e => e.type === 'cta_click').length;
    const ctaViews = eventHistory.filter(e => e.type === 'cta_view').length;
    
    const conversionRate = ctaViews > 0 ? (ctaClicks / ctaViews) * 100 : 0;
    
    // Calculate variant performance
    const variantMap = new Map<string, { views: number; clicks: number }>();
    
    eventHistory.forEach(event => {
      const variant = event.context.variant || 'default';
      const current = variantMap.get(variant) || { views: 0, clicks: 0 };
      
      if (event.type === 'cta_view') current.views++;
      if (event.type === 'cta_click') current.clicks++;
      
      variantMap.set(variant, current);
    });
    
    const topPerformingVariants: VariantPerformance[] = Array.from(variantMap.entries())
      .map(([variantId, stats]) => ({
        variantId,
        conversionRate: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0,
        totalViews: stats.views,
        totalClicks: stats.clicks
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);

    return {
      totalEvents,
      conversionRate,
      topPerformingVariants,
      recentActivity: eventHistory.slice(-10)
    };
  }, [eventHistory]);

  // Update conversion rate when event history changes
  useEffect(() => {
    const summary = getAnalyticsSummary();
    setConversionRate(summary.conversionRate);
  }, [eventHistory, getAnalyticsSummary]);

  return {
    trackEvent,
    trackCTAClick,
    trackView,
    getAnalyticsSummary
  };
}

/**
 * Hook for analytics integration with type safety
 */
export function useAnalytics(config?: {
  enableAutoTracking?: boolean;
  trackPageViews?: boolean;
  sessionTimeout?: number;
}): UseAnalyticsReturn {
  const sessionId = useRef<string>(crypto.randomUUID());
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>();

  const { 
    enableAutoTracking = true,
    trackPageViews = true,
    sessionTimeout = 30 * 60 * 1000 // 30 minutes
  } = config || {};

  useEffect(() => {
    // Initialize analytics
    setIsInitialized(true);
    
    if (trackPageViews) {
      track({
        eventType: 'page_view',
        timestamp: Date.now(),
        sessionId: sessionId.current,
        deviceInfo: getDeviceInfo(),
        pageInfo: getPageInfo()
      });
    }

    // Setup session timeout
    const timeout = setTimeout(() => {
      sessionId.current = crypto.randomUUID();
    }, sessionTimeout);

    return () => clearTimeout(timeout);
  }, [trackPageViews, sessionTimeout]);

  const track = useCallback((
    event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'deviceInfo' | 'pageInfo'>
  ): void => {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: sessionId.current,
      userId,
      deviceInfo: getDeviceInfo(),
      pageInfo: getPageInfo()
    } as AnalyticsEvent;

    analytics.track(event.eventType, fullEvent);
  }, [userId]);

  const identify = useCallback((newUserId: string, traits?: Record<string, any>): void => {
    setUserId(newUserId);
    analytics.track('user_identified', {
      userId: newUserId,
      traits,
      timestamp: Date.now(),
      sessionId: sessionId.current
    });
  }, []);

  const page = useCallback((pageName: string, properties?: Record<string, any>): void => {
    track({
      eventType: 'page_view',
      properties: {
        pageName,
        ...properties
      }
    } as any);
  }, [track]);

  const reset = useCallback((): void => {
    setUserId(undefined);
    sessionId.current = crypto.randomUUID();
    analytics.track('session_reset', {
      timestamp: Date.now(),
      sessionId: sessionId.current
    });
  }, []);

  return {
    track,
    identify,
    page,
    reset,
    isInitialized,
    sessionId: sessionId.current
  };
}

/**
 * Hook for A/B testing with type safety
 */
export function useABTesting<T extends string>(
  testId: string,
  variants: Record<T, any>,
  config?: {
    trafficAllocation?: number;
    persistVariant?: boolean;
    debugMode?: boolean;
  }
): UseABTestingReturn<T> {
  const [variant, setVariant] = useState<T>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const exposureTracked = useRef<boolean>(false);

  const {
    trafficAllocation = 1.0,
    persistVariant = true,
    debugMode = false
  } = config || {};

  useEffect(() => {
    // Determine variant
    const storageKey = `ab_test_${testId}`;
    let selectedVariant: T;

    if (persistVariant) {
      const stored = localStorage.getItem(storageKey);
      if (stored && stored in variants) {
        selectedVariant = stored as T;
      } else {
        selectedVariant = selectVariant();
        localStorage.setItem(storageKey, selectedVariant);
      }
    } else {
      selectedVariant = selectVariant();
    }

    setVariant(selectedVariant);
    setIsLoading(false);

    if (debugMode) {
      console.log(`A/B Test ${testId}: variant ${selectedVariant}`);
    }
  }, [testId, variants, trafficAllocation, persistVariant, debugMode]);

  const selectVariant = useCallback((): T => {
    const variantKeys = Object.keys(variants) as T[];
    const randomIndex = Math.floor(Math.random() * variantKeys.length);
    return variantKeys[randomIndex]!;
  }, [variants]);

  const trackExposure = useCallback((): void => {
    if (!exposureTracked.current && variant) {
      analytics.track('ab_test_exposure', {
        testId,
        variantId: variant,
        timestamp: Date.now()
      });
      exposureTracked.current = true;
    }
  }, [testId, variant]);

  const getVariantConfig = useCallback((): Record<string, unknown> => {
    return variant ? variants[variant] : {};
  }, [variant, variants]);

  // Auto-track exposure when variant is determined
  useEffect(() => {
    if (variant && !isLoading) {
      trackExposure();
    }
  }, [variant, isLoading, trackExposure]);

  return {
    variant: variant!,
    isLoading,
    trackExposure,
    getVariantConfig
  };
}

/**
 * Hook for performance optimization with type safety
 */
export function usePerformanceOptimization(): UsePerformanceOptimizationReturn {
  const memoizedCallbacks = useRef(new Map());
  const debouncedCallbacks = useRef(new Map());
  const throttledCallbacks = useRef(new Map());

  const memoizedCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    deps: readonly any[]
  ): T => {
    const key = JSON.stringify(deps);
    
    if (!memoizedCallbacks.current.has(key)) {
      memoizedCallbacks.current.set(key, callback);
    }
    
    return memoizedCallbacks.current.get(key);
  }, []);

  const debouncedCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ): T => {
    const key = `${callback.toString()}_${delay}`;
    
    if (!debouncedCallbacks.current.has(key)) {
      let timeoutId: NodeJS.Timeout;
      
      const debouncedFn = (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), delay);
      };
      
      debouncedCallbacks.current.set(key, debouncedFn);
    }
    
    return debouncedCallbacks.current.get(key);
  }, []);

  const throttledCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ): T => {
    const key = `${callback.toString()}_${delay}`;
    
    if (!throttledCallbacks.current.has(key)) {
      let lastCall = 0;
      
      const throttledFn = (...args: any[]) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          return callback(...args);
        }
      };
      
      throttledCallbacks.current.set(key, throttledFn);
    }
    
    return throttledCallbacks.current.get(key);
  }, []);

  return {
    memoizedCallback,
    debouncedCallback,
    throttledCallback
  };
}

/**
 * Hook for intersection observer with conversion tracking
 */
export function useIntersectionTracking(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit & {
    trackViewDuration?: boolean;
    conversionContext?: Partial<AnalyticsContext>;
  }
) {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const [viewDuration, setViewDuration] = useState<number>(0);
  const entryTimeRef = useRef<number>();
  const { trackView } = useConversionTracking();

  const {
    trackViewDuration = true,
    conversionContext = {},
    ...observerOptions
  } = options || {};

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsIntersecting(true);
          entryTimeRef.current = Date.now();
          
          // Track view start
          trackView('intersection_observer', {
            component: 'IntersectionTracking',
            sessionId: crypto.randomUUID(),
            timestamp: Date.now(),
            ...conversionContext
          });
        } else if (entryTimeRef.current) {
          setIsIntersecting(false);
          
          if (trackViewDuration) {
            const duration = Date.now() - entryTimeRef.current;
            setViewDuration(duration);
            
            // Track view end with duration
            trackView('intersection_observer_end', {
              component: 'IntersectionTracking',
              sessionId: crypto.randomUUID(),
              timestamp: Date.now(),
              metadata: { viewDuration: duration },
              ...conversionContext
            });
          }
          
          entryTimeRef.current = undefined;
        }
      },
      observerOptions
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, trackViewDuration, conversionContext, trackView, observerOptions]);

  return {
    isIntersecting,
    viewDuration
  };
}

/**
 * Utility functions for device and page info
 */
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: getDevicePlatform(),
    screenResolution: [window.screen.width, window.screen.height] as const,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  };
}

function getPageInfo() {
  return {
    url: window.location.href,
    referrer: document.referrer,
    title: document.title,
    path: window.location.pathname,
    queryParams: Object.fromEntries(new URLSearchParams(window.location.search))
  };
}

function getDevicePlatform(): 'desktop' | 'mobile' | 'tablet' {
  const userAgent = navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}