/**
 * Performance Budget Configuration and Monitoring
 * Defines performance thresholds and provides real-time monitoring
 * for Core Web Vitals and conversion optimization
 */

// Performance budget thresholds based on Core Web Vitals
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals thresholds
  coreWebVitals: {
    LCP: {
      good: 2500,      // ms
      needsImprovement: 4000,
      poor: Infinity
    },
    FID: {
      good: 100,       // ms
      needsImprovement: 300,
      poor: Infinity
    },
    CLS: {
      good: 0.1,       // layout shift score
      needsImprovement: 0.25,
      poor: Infinity
    },
    FCP: {
      good: 1800,      // ms
      needsImprovement: 3000,
      poor: Infinity
    },
    TTFB: {
      good: 800,       // ms
      needsImprovement: 1800,
      poor: Infinity
    },
    INP: {
      good: 200,       // ms
      needsImprovement: 500,
      poor: Infinity
    }
  },

  // Resource budgets
  resources: {
    totalPageSize: {
      desktop: 2000,   // KB
      mobile: 1500     // KB
    },
    javascriptBundle: {
      main: 250,       // KB
      vendor: 500,     // KB
      total: 750       // KB
    },
    cssBundle: {
      critical: 14,    // KB (inline critical CSS)
      total: 100       // KB
    },
    images: {
      hero: 200,       // KB
      total: 1000      // KB
    },
    fonts: {
      total: 100       // KB
    }
  },

  // Network performance
  network: {
    requestCount: {
      initial: 50,     // requests for initial page load
      total: 100       // total requests
    },
    renderBlockingResources: 5,  // maximum number
    redirects: 2                 // maximum redirects
  },

  // Conversion-specific budgets
  conversion: {
    ctaRenderTime: 1000,        // ms - time to render CTA buttons
    heroImageLoadTime: 2000,    // ms - time to load hero images
    interactionReadyTime: 3000, // ms - time until page is interactive
    formValidationTime: 100     // ms - form validation response time
  }
} as const;

// Performance monitoring configuration
export interface PerformanceMonitoringConfig {
  enableRealTimeMonitoring: boolean;
  enableBudgetAlerts: boolean;
  enablePerformanceAPI: boolean;
  sampleRate: number;
  alertThreshold: 'good' | 'needsImprovement' | 'poor';
  enableConversionTracking: boolean;
}

export const DEFAULT_MONITORING_CONFIG: PerformanceMonitoringConfig = {
  enableRealTimeMonitoring: true,
  enableBudgetAlerts: process.env.NODE_ENV === 'development',
  enablePerformanceAPI: 'performance' in globalThis,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  alertThreshold: 'needsImprovement',
  enableConversionTracking: true
};

// Performance violation interface
export interface PerformanceViolation {
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'error' | 'critical';
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  context?: Record<string, any>;
}

// Performance monitor class
export class PerformanceBudgetMonitor {
  private config: PerformanceMonitoringConfig;
  private violations: PerformanceViolation[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private onViolationCallbacks: ((violation: PerformanceViolation) => void)[] = [];

  constructor(config: Partial<PerformanceMonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    
    if (this.config.enableRealTimeMonitoring) {
      this.initializeMonitoring();
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    if (!this.config.enablePerformanceAPI) return;

    // Monitor Core Web Vitals
    this.monitorLCP();
    this.monitorFID();
    this.monitorCLS();
    this.monitorFCP();
    this.monitorTTFB();
    this.monitorINP();

    // Monitor resource loading
    this.monitorResourceLoading();
    
    // Monitor custom conversion metrics
    if (this.config.enableConversionTracking) {
      this.monitorConversionMetrics();
    }
  }

  /**
   * Monitor Largest Contentful Paint
   */
  private monitorLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry) {
          this.checkBudget('LCP', lastEntry.startTime, PERFORMANCE_BUDGETS.coreWebVitals.LCP);
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('LCP', observer);
    } catch (error) {
      console.warn('[Performance Budget] LCP monitoring failed:', error);
    }
  }

  /**
   * Monitor First Input Delay
   */
  private monitorFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.checkBudget('FID', fid, PERFORMANCE_BUDGETS.coreWebVitals.FID);
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('FID', observer);
    } catch (error) {
      console.warn('[Performance Budget] FID monitoring failed:', error);
    }
  }

  /**
   * Monitor Cumulative Layout Shift
   */
  private monitorCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    try {
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
              this.checkBudget('CLS', clsValue, PERFORMANCE_BUDGETS.coreWebVitals.CLS);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('CLS', observer);
    } catch (error) {
      console.warn('[Performance Budget] CLS monitoring failed:', error);
    }
  }

  /**
   * Monitor First Contentful Paint
   */
  private monitorFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.checkBudget('FCP', entry.startTime, PERFORMANCE_BUDGETS.coreWebVitals.FCP);
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('FCP', observer);
    } catch (error) {
      console.warn('[Performance Budget] FCP monitoring failed:', error);
    }
  }

  /**
   * Monitor Time to First Byte
   */
  private monitorTTFB(): void {
    if (!('performance' in window)) return;

    try {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        const ttfb = entry.responseStart - entry.requestStart;
        this.checkBudget('TTFB', ttfb, PERFORMANCE_BUDGETS.coreWebVitals.TTFB);
      }
    } catch (error) {
      console.warn('[Performance Budget] TTFB monitoring failed:', error);
    }
  }

  /**
   * Monitor Interaction to Next Paint (approximation)
   */
  private monitorINP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (entry.processingEnd) {
            const inp = entry.processingEnd - entry.startTime;
            this.checkBudget('INP', inp, PERFORMANCE_BUDGETS.coreWebVitals.INP);
          }
        });
      });

      observer.observe({ entryTypes: ['event'] });
      this.observers.set('INP', observer);
    } catch (error) {
      console.warn('[Performance Budget] INP monitoring failed:', error);
    }
  }

  /**
   * Monitor resource loading performance
   */
  private monitorResourceLoading(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          const size = entry.transferSize || entry.encodedBodySize || 0;
          const duration = entry.duration;
          
          // Check resource size budgets
          if (entry.name.includes('.js')) {
            this.checkResourceBudget('javascript', size);
          } else if (entry.name.includes('.css')) {
            this.checkResourceBudget('css', size);
          } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(entry.name)) {
            this.checkResourceBudget('image', size);
          } else if (/\.(woff2?|ttf|otf)$/i.test(entry.name)) {
            this.checkResourceBudget('font', size);
          }
          
          // Check loading time for critical resources
          if (entry.name.includes('main.') || entry.name.includes('app.')) {
            this.checkBudget('critical-resource-load-time', duration, { good: 1000, needsImprovement: 2000, poor: Infinity });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      console.warn('[Performance Budget] Resource monitoring failed:', error);
    }
  }

  /**
   * Monitor conversion-specific metrics
   */
  private monitorConversionMetrics(): void {
    // Monitor CTA render time
    this.monitorCTARenderTime();
    
    // Monitor form interaction time
    this.monitorFormInteractionTime();
    
    // Monitor hero image load time
    this.monitorHeroImageLoadTime();
  }

  /**
   * Monitor CTA button render time
   */
  private monitorCTARenderTime(): void {
    const ctaElements = document.querySelectorAll('[data-testid*="cta"], .hero-cta, button[type="submit"]');
    
    ctaElements.forEach((element, index) => {
      const observer = new MutationObserver(() => {
        const renderTime = performance.now();
        this.checkBudget(
          `cta-render-time-${index}`, 
          renderTime, 
          { good: PERFORMANCE_BUDGETS.conversion.ctaRenderTime, needsImprovement: PERFORMANCE_BUDGETS.conversion.ctaRenderTime * 1.5, poor: Infinity }
        );
        observer.disconnect();
      });

      observer.observe(element, { childList: true, subtree: true });
    });
  }

  /**
   * Monitor form interaction time
   */
  private monitorFormInteractionTime(): void {
    const forms = document.querySelectorAll('form');
    
    forms.forEach((form, index) => {
      let interactionStart: number;
      
      const handleInteraction = () => {
        interactionStart = performance.now();
      };
      
      const handleValidation = () => {
        if (interactionStart) {
          const validationTime = performance.now() - interactionStart;
          this.checkBudget(
            `form-validation-time-${index}`,
            validationTime,
            { good: PERFORMANCE_BUDGETS.conversion.formValidationTime, needsImprovement: PERFORMANCE_BUDGETS.conversion.formValidationTime * 2, poor: Infinity }
          );
        }
      };
      
      form.addEventListener('input', handleInteraction);
      form.addEventListener('submit', handleValidation);
    });
  }

  /**
   * Monitor hero image load time
   */
  private monitorHeroImageLoadTime(): void {
    const heroImages = document.querySelectorAll('img[data-priority="true"], .hero img, [data-testid*="hero"] img');
    
    heroImages.forEach((img, index) => {
      if (img instanceof HTMLImageElement) {
        const startTime = performance.now();
        
        const handleLoad = () => {
          const loadTime = performance.now() - startTime;
          this.checkBudget(
            `hero-image-load-time-${index}`,
            loadTime,
            { good: PERFORMANCE_BUDGETS.conversion.heroImageLoadTime, needsImprovement: PERFORMANCE_BUDGETS.conversion.heroImageLoadTime * 1.5, poor: Infinity }
          );
        };
        
        if (img.complete) {
          handleLoad();
        } else {
          img.addEventListener('load', handleLoad, { once: true });
        }
      }
    });
  }

  /**
   * Check if a metric violates the performance budget
   */
  private checkBudget(
    metric: string, 
    value: number, 
    thresholds: { good: number; needsImprovement: number; poor: number }
  ): void {
    let severity: 'warning' | 'error' | 'critical';
    let violated = false;

    if (value > thresholds.poor) {
      severity = 'critical';
      violated = true;
    } else if (value > thresholds.needsImprovement) {
      severity = 'error';
      violated = this.config.alertThreshold !== 'poor';
    } else if (value > thresholds.good) {
      severity = 'warning';
      violated = this.config.alertThreshold === 'good';
    } else {
      return; // Within budget
    }

    if (violated && Math.random() <= this.config.sampleRate) {
      const violation: PerformanceViolation = {
        metric,
        value,
        threshold: thresholds[this.config.alertThreshold],
        severity,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: (navigator as any).connection?.effectiveType,
        context: {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          devicePixelRatio: window.devicePixelRatio
        }
      };

      this.handleViolation(violation);
    }
  }

  /**
   * Check resource budget violations
   */
  private checkResourceBudget(type: string, size: number): void {
    const sizeKB = size / 1024;
    let threshold: number;

    switch (type) {
      case 'javascript':
        threshold = PERFORMANCE_BUDGETS.resources.javascriptBundle.total;
        break;
      case 'css':
        threshold = PERFORMANCE_BUDGETS.resources.cssBundle.total;
        break;
      case 'image':
        threshold = PERFORMANCE_BUDGETS.resources.images.total;
        break;
      case 'font':
        threshold = PERFORMANCE_BUDGETS.resources.fonts.total;
        break;
      default:
        return;
    }

    if (sizeKB > threshold) {
      const violation: PerformanceViolation = {
        metric: `${type}-bundle-size`,
        value: sizeKB,
        threshold,
        severity: sizeKB > threshold * 1.5 ? 'critical' : 'error',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      this.handleViolation(violation);
    }
  }

  /**
   * Handle performance budget violation
   */
  private handleViolation(violation: PerformanceViolation): void {
    this.violations.push(violation);

    // Keep only recent violations
    if (this.violations.length > 100) {
      this.violations = this.violations.slice(-50);
    }

    // Alert in development
    if (this.config.enableBudgetAlerts) {
      console.warn(`[Performance Budget] ${violation.severity.toUpperCase()}: ${violation.metric}`, violation);
    }

    // Notify callbacks
    this.onViolationCallbacks.forEach(callback => {
      try {
        callback(violation);
      } catch (error) {
        console.error('[Performance Budget] Violation callback error:', error);
      }
    });

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.reportViolation(violation);
    }
  }

  /**
   * Report violation to analytics service
   */
  private async reportViolation(violation: PerformanceViolation): Promise<void> {
    try {
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon('/api/analytics/performance-violation', JSON.stringify(violation));
      } else {
        fetch('/api/analytics/performance-violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(violation)
        }).catch(() => {
          // Silently fail - analytics shouldn't break the app
        });
      }
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
    }
  }

  /**
   * Add violation callback
   */
  public onViolation(callback: (violation: PerformanceViolation) => void): void {
    this.onViolationCallbacks.push(callback);
  }

  /**
   * Get current violations
   */
  public getViolations(): PerformanceViolation[] {
    return [...this.violations];
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    totalViolations: number;
    criticalViolations: number;
    errorViolations: number;
    warningViolations: number;
    recentViolations: PerformanceViolation[];
  } {
    const criticalViolations = this.violations.filter(v => v.severity === 'critical').length;
    const errorViolations = this.violations.filter(v => v.severity === 'error').length;
    const warningViolations = this.violations.filter(v => v.severity === 'warning').length;
    const recentViolations = this.violations.slice(-10);

    return {
      totalViolations: this.violations.length,
      criticalViolations,
      errorViolations,
      warningViolations,
      recentViolations
    };
  }

  /**
   * Cleanup monitoring
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.violations = [];
    this.onViolationCallbacks = [];
  }
}

// Global performance budget monitor instance
export const performanceBudgetMonitor = new PerformanceBudgetMonitor();