/**
 * Core Web Vitals Monitor Component
 * Real-time monitoring and optimization for LCP, FID, CLS, FCP, TTFB
 * Provides performance insights and conversion impact analysis
 */

import { useState, useRef } from 'react';
import { analytics } from '@/lib/analytics';

// Core Web Vitals types
interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id: string;
  delta: number;
}

interface PerformanceInsights {
  lcp: WebVitalMetric | null;
  fid: WebVitalMetric | null;
  cls: WebVitalMetric | null;
  fcp: WebVitalMetric | null;
  ttfb: WebVitalMetric | null;
  inp: WebVitalMetric | null;
  overallScore: number;
  recommendations: string[];
}

// Thresholds for Core Web Vitals ratings
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
} as const;

export const CoreWebVitalsMonitor: React.FC<{
  enableConsoleLogging?: boolean;
  enableRealTimeTracking?: boolean;
  onMetricReceived?: (metric: WebVitalMetric) => void;
  onInsightsUpdate?: (insights: PerformanceInsights) => void;
}> = ({
  enableConsoleLogging = process.env.NODE_ENV === 'development',
  enableRealTimeTracking = true,
  onMetricReceived,
  onInsightsUpdate
}) => {
  const [insights, setInsights] = useState<PerformanceInsights>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
    overallScore: 0,
    recommendations: []
  });

  const metricsCollected = useRef(new Set<string>());
  const performanceObserver = useRef<PerformanceObserver | null>(null);

  // Rate a metric based on Core Web Vitals thresholds
  const rateMetric = useCallback((name: WebVitalMetric['name'], value: number): WebVitalMetric['rating'] => {
    const threshold = THRESHOLDS[name];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }, []);

  // Process and store a metric
  const processMetric = useCallback((metric: WebVitalMetric) => {
    if (metricsCollected.current.has(metric.id)) return;
    metricsCollected.current.add(metric.id);

    if (enableConsoleLogging) {
      console.log(`[CWV] ${metric.name}: ${metric.value}ms (${metric.rating})`);
    }

    // Update insights
    setInsights(prev => {
      const updated = { ...prev, [metric.name.toLowerCase()]: metric };
      
      // Calculate overall score (0-100)
      const metrics = [updated.lcp, updated.fid, updated.cls, updated.fcp, updated.ttfb, updated.inp].filter(Boolean);
      const goodMetrics = metrics.filter(m => m!.rating === 'good').length;
      const overallScore = metrics.length > 0 ? (goodMetrics / metrics.length) * 100 : 0;
      
      // Generate recommendations
      const recommendations = generateRecommendations(updated);
      
      const finalInsights = { ...updated, overallScore, recommendations };
      
      // Call callbacks
      onInsightsUpdate?.(finalInsights);
      
      return finalInsights;
    });

    // Track in analytics
    analytics.track('performance', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: metric.timestamp,
      url: window.location.pathname
    });

    onMetricReceived?.(metric);
  }, [enableConsoleLogging, onMetricReceived, onInsightsUpdate]);

  // Generate performance recommendations
  const generateRecommendations = useCallback((insights: PerformanceInsights): string[] => {
    const recommendations: string[] = [];

    if (insights.lcp?.rating === 'poor') {
      recommendations.push('Optimize Largest Contentful Paint: Consider lazy loading non-critical images and preloading hero images');
    }
    
    if (insights.fid?.rating === 'poor') {
      recommendations.push('Improve First Input Delay: Break up long JavaScript tasks and defer non-critical scripts');
    }
    
    if (insights.cls?.rating === 'poor') {
      recommendations.push('Reduce Cumulative Layout Shift: Set dimensions on images and reserve space for dynamic content');
    }
    
    if (insights.fcp?.rating === 'poor') {
      recommendations.push('Optimize First Contentful Paint: Inline critical CSS and eliminate render-blocking resources');
    }
    
    if (insights.ttfb?.rating === 'poor') {
      recommendations.push('Improve Time to First Byte: Optimize server response time and use CDN caching');
    }
    
    if (insights.inp?.rating === 'poor') {
      recommendations.push('Reduce Interaction to Next Paint: Optimize event handlers and use React.memo for expensive components');
    }

    return recommendations;
  }, []);

  // Web Vitals measurement using web-vitals library approach
  useEffect(() => {
    if (!enableRealTimeTracking) return;

    let cleanup: (() => void)[] = [];

    // Measure LCP (Largest Contentful Paint)
    const measureLCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceNavigationTiming;
          
          if (lastEntry) {
            const metric: WebVitalMetric = {
              name: 'LCP',
              value: lastEntry.loadEventEnd - lastEntry.loadEventStart,
              rating: rateMetric('LCP', lastEntry.loadEventEnd - lastEntry.loadEventStart),
              timestamp: Date.now(),
              id: `lcp-${Date.now()}`,
              delta: 0
            };
            
            processMetric(metric);
          }
        });
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          cleanup.push(() => observer.disconnect());
        } catch (error) {
          console.warn('[CWV] LCP observation not supported:', error);
        }
      }
    };

    // Measure FID (First Input Delay)
    const measureFID = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry: any) => {
            const metric: WebVitalMetric = {
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              rating: rateMetric('FID', entry.processingStart - entry.startTime),
              timestamp: Date.now(),
              id: `fid-${entry.startTime}`,
              delta: 0
            };
            
            processMetric(metric);
          });
        });
        
        try {
          observer.observe({ entryTypes: ['first-input'] });
          cleanup.push(() => observer.disconnect());
        } catch (error) {
          console.warn('[CWV] FID observation not supported:', error);
        }
      }
    };

    // Measure CLS (Cumulative Layout Shift)
    const measureCLS = () => {
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        let sessionValue = 0;
        let sessionEntries: any[] = [];

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              const firstSessionEntry = sessionEntries[0];
              const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

              if (sessionValue && 
                  entry.startTime - lastSessionEntry.startTime < 1000 &&
                  entry.startTime - firstSessionEntry.startTime < 5000) {
                sessionValue += entry.value;
                sessionEntries.push(entry);
              } else {
                sessionValue = entry.value;
                sessionEntries = [entry];
              }

              if (sessionValue > clsValue) {
                clsValue = sessionValue;
                
                const metric: WebVitalMetric = {
                  name: 'CLS',
                  value: clsValue,
                  rating: rateMetric('CLS', clsValue),
                  timestamp: Date.now(),
                  id: `cls-${entry.startTime}`,
                  delta: entry.value
                };
                
                processMetric(metric);
              }
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['layout-shift'] });
          cleanup.push(() => observer.disconnect());
        } catch (error) {
          console.warn('[CWV] CLS observation not supported:', error);
        }
      }
    };

    // Measure FCP (First Contentful Paint)
    const measureFCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              const metric: WebVitalMetric = {
                name: 'FCP',
                value: entry.startTime,
                rating: rateMetric('FCP', entry.startTime),
                timestamp: Date.now(),
                id: `fcp-${entry.startTime}`,
                delta: 0
              };
              
              processMetric(metric);
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['paint'] });
          cleanup.push(() => observer.disconnect());
        } catch (error) {
          console.warn('[CWV] FCP observation not supported:', error);
        }
      }
    };

    // Measure TTFB (Time to First Byte)
    const measureTTFB = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        
        if (navigationEntries.length > 0) {
          const entry = navigationEntries[0];
          const ttfb = entry.responseStart - entry.requestStart;
          
          const metric: WebVitalMetric = {
            name: 'TTFB',
            value: ttfb,
            rating: rateMetric('TTFB', ttfb),
            timestamp: Date.now(),
            id: `ttfb-${Date.now()}`,
            delta: 0
          };
          
          processMetric(metric);
        }
      }
    };

    // Measure INP (Interaction to Next Paint) - approximation
    const measureINP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry: any) => {
            if (entry.processingEnd) {
              const inp = entry.processingEnd - entry.startTime;
              
              const metric: WebVitalMetric = {
                name: 'INP',
                value: inp,
                rating: rateMetric('INP', inp),
                timestamp: Date.now(),
                id: `inp-${entry.startTime}`,
                delta: 0
              };
              
              processMetric(metric);
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['event'] });
          cleanup.push(() => observer.disconnect());
        } catch (error) {
          console.warn('[CWV] INP observation not supported:', error);
        }
      }
    };

    // Initialize measurements
    measureLCP();
    measureFID();
    measureCLS();
    measureFCP();
    measureTTFB();
    measureINP();

    // Cleanup function
    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [enableRealTimeTracking, processMetric, rateMetric]);

  // Report final metrics on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Send final metrics to analytics
      if (insights.lcp || insights.fid || insights.cls) {
        analytics.track('performance_session_end', {
          lcp: insights.lcp?.value,
          fid: insights.fid?.value,
          cls: insights.cls?.value,
          fcp: insights.fcp?.value,
          ttfb: insights.ttfb?.value,
          inp: insights.inp?.value,
          overallScore: insights.overallScore,
          url: window.location.pathname,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [insights]);

  // In development, show performance insights
  if (process.env.NODE_ENV === 'development' && enableConsoleLogging) {
    return (
      <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50 font-mono">
        <div className="mb-2 font-bold">Core Web Vitals Monitor</div>
        
        {insights.lcp && (
          <div className={`mb-1 ${insights.lcp.rating === 'good' ? 'text-green-400' : insights.lcp.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>
            LCP: {insights.lcp.value.toFixed(0)}ms ({insights.lcp.rating})
          </div>
        )}
        
        {insights.fid && (
          <div className={`mb-1 ${insights.fid.rating === 'good' ? 'text-green-400' : insights.fid.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>
            FID: {insights.fid.value.toFixed(0)}ms ({insights.fid.rating})
          </div>
        )}
        
        {insights.cls && (
          <div className={`mb-1 ${insights.cls.rating === 'good' ? 'text-green-400' : insights.cls.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>
            CLS: {insights.cls.value.toFixed(3)} ({insights.cls.rating})
          </div>
        )}
        
        {insights.fcp && (
          <div className={`mb-1 ${insights.fcp.rating === 'good' ? 'text-green-400' : insights.fcp.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>
            FCP: {insights.fcp.value.toFixed(0)}ms ({insights.fcp.rating})
          </div>
        )}
        
        {insights.ttfb && (
          <div className={`mb-1 ${insights.ttfb.rating === 'good' ? 'text-green-400' : insights.ttfb.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>
            TTFB: {insights.ttfb.value.toFixed(0)}ms ({insights.ttfb.rating})
          </div>
        )}
        
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div>Score: {insights.overallScore.toFixed(0)}/100</div>
        </div>
        
        {insights.recommendations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-yellow-400 mb-1">Recommendations:</div>
            {insights.recommendations.slice(0, 2).map((rec, i) => (
              <div key={i} className="text-xs text-gray-300 mb-1">{rec}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Production version is invisible
  return null;
};

// Hook for accessing Core Web Vitals data
export const useCoreWebVitals = () => {
  const [metrics, setMetrics] = useState<PerformanceInsights>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
    overallScore: 0,
    recommendations: []
  });

  const handleInsightsUpdate = useCallback((insights: PerformanceInsights) => {
    setMetrics(insights);
  }, []);

  return {
    metrics,
    handleInsightsUpdate
  };
};