// Performance Analytics and Core Web Vitals Tracking
class PerformanceAnalytics {
  constructor() {
    this.metrics = {};
    this.observer = null;
    this.initializeTracking();
  }

  initializeTracking() {
    this.trackCoreWebVitals();
    this.trackNavigationTiming();
    this.trackResourceTiming();
    this.trackCustomMetrics();
  }

  // Core Web Vitals tracking
  trackCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entry) => {
      const lcp = entry.startTime;
      this.metrics.lcp = lcp;
      
      analytics.track('core_web_vital_lcp', {
        value: lcp,
        rating: this.getCWVRating('lcp', lcp),
        timestamp: new Date().toISOString()
      });
    });

    // First Input Delay (FID)
    this.observeMetric('first-input', (entry) => {
      const fid = entry.processingStart - entry.startTime;
      this.metrics.fid = fid;
      
      analytics.track('core_web_vital_fid', {
        value: fid,
        rating: this.getCWVRating('fid', fid),
        timestamp: new Date().toISOString()
      });
    });

    // Cumulative Layout Shift (CLS)
    this.observeMetric('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        this.metrics.cls = (this.metrics.cls || 0) + entry.value;
      }
    });

    // Send CLS when page is about to unload
    window.addEventListener('beforeunload', () => {
      if (this.metrics.cls !== undefined) {
        analytics.track('core_web_vital_cls', {
          value: this.metrics.cls,
          rating: this.getCWVRating('cls', this.metrics.cls),
          timestamp: new Date().toISOString()
        });
      }
    });

    // First Contentful Paint (FCP)
    this.observeMetric('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        const fcp = entry.startTime;
        this.metrics.fcp = fcp;
        
        analytics.track('core_web_vital_fcp', {
          value: fcp,
          rating: this.getCWVRating('fcp', fcp),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Time to First Byte (TTFB)
    this.observeMetric('navigation', (entry) => {
      const ttfb = entry.responseStart - entry.requestStart;
      this.metrics.ttfb = ttfb;
      
      analytics.track('core_web_vital_ttfb', {
        value: ttfb,
        rating: this.getCWVRating('ttfb', ttfb),
        timestamp: new Date().toISOString()
      });
    });
  }

  // Navigation timing tracking
  trackNavigationTiming() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      
      if (navigation) {
        const timingMetrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.navigationStart,
          pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
          redirectTime: navigation.redirectEnd - navigation.redirectStart,
          dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpTime: navigation.connectEnd - navigation.connectStart,
          responseTime: navigation.responseEnd - navigation.responseStart
        };

        analytics.track('navigation_timing', {
          ...timingMetrics,
          timestamp: new Date().toISOString()
        });

        this.metrics = { ...this.metrics, ...timingMetrics };
      }
    });
  }

  // Resource timing tracking
  trackResourceTiming() {
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceMetrics = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize || entry.encodedBodySize,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
          };

          // Track slow resources
          if (entry.duration > 1000) {
            analytics.track('slow_resource', {
              ...resourceMetrics,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Resource timing observer not supported');
    }
  }

  // Custom performance metrics
  trackCustomMetrics() {
    // Track JavaScript errors that might impact performance
    window.addEventListener('error', (event) => {
      analytics.track('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      analytics.track('unhandled_promise_rejection', {
        reason: event.reason?.toString() || 'Unknown',
        timestamp: new Date().toISOString()
      });
    });

    // Track memory usage (if available)
    if (performance.memory) {
      setInterval(() => {
        analytics.track('memory_usage', {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          timestamp: new Date().toISOString()
        });
      }, 60000); // Every minute
    }
  }

  // Performance observer helper
  observeMetric(type, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ entryTypes: [type] });
    } catch (e) {
      console.warn(`Performance observer for ${type} not supported`);
    }
  }

  // Core Web Vitals rating system
  getCWVRating(metric, value) {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // Resource type classification
  getResourceType(url) {
    const extension = url.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['css'].includes(extension)) {
      return 'stylesheet';
    }
    if (['js'].includes(extension)) {
      return 'script';
    }
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) {
      return 'font';
    }
    return 'other';
  }

  // Performance budget monitoring
  checkPerformanceBudget() {
    const budget = {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      pageLoadTime: 3000,
      totalResourceSize: 2000000 // 2MB
    };

    const violations = [];

    Object.entries(budget).forEach(([metric, limit]) => {
      if (this.metrics[metric] && this.metrics[metric] > limit) {
        violations.push({
          metric,
          value: this.metrics[metric],
          limit,
          overage: this.metrics[metric] - limit
        });
      }
    });

    if (violations.length > 0) {
      analytics.track('performance_budget_violation', {
        violations,
        timestamp: new Date().toISOString()
      });
    }

    return violations;
  }

  // Get current performance summary
  getPerformanceSummary() {
    return {
      metrics: this.metrics,
      budgetViolations: this.checkPerformanceBudget(),
      timestamp: new Date().toISOString()
    };
  }
}

export const performanceAnalytics = new PerformanceAnalytics();