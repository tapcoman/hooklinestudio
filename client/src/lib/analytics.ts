/**
 * Enhanced analytics utility for tracking user interactions with strict typing
 * Enables honest, time-boxed claims based on real usage data
 * Supports conversion optimization, A/B testing, and performance monitoring
 */

import type { 
  AnalyticsEvent as TypedAnalyticsEvent,
  AnalyticsConfig,
  UserTraits,
  AnalyticsContext,
  ConversionEventType
} from '@/types/analytics';

// Legacy interface for backward compatibility
interface LegacyAnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

// Union type supporting both legacy and new typed events
type AnalyticsEvent = LegacyAnalyticsEvent | TypedAnalyticsEvent;

/**
 * Enhanced Analytics class with comprehensive TypeScript support
 * Provides type-safe event tracking, user identification, and conversion metrics
 */
class Analytics {
  private events: AnalyticsEvent[] = [];
  private enabled = process.env.NODE_ENV === 'production';
  private userId?: string;
  private userTraits?: UserTraits;
  private sessionId: string = this.generateSessionId();
  private config: Partial<AnalyticsConfig> = {
    batchSize: 10,
    flushInterval: 5000,
    maxRetries: 3,
    enableAutoTracking: true,
    enableConsoleLogging: !this.enabled,
    enableLocalStorage: true,
    samplingRate: 1.0
  };
  
  // Throttled persist function to avoid blocking UI
  private throttledPersistEvent = this.throttle(this.persistEvent.bind(this), 100);

  /**
   * Enhanced track method with support for both legacy and typed events
   * Includes sampling, validation, performance optimization, and error handling
   */
  track(event: string | ConversionEventType, properties?: Record<string, any>, context?: Partial<AnalyticsContext>): void {
    // Apply sampling rate
    if (Math.random() > this.config.samplingRate!) {
      return;
    }

    // Use requestIdleCallback for non-critical analytics to avoid blocking main thread
    const processEvent = () => {
      const analyticsEvent: AnalyticsEvent = this.isTypedEvent(event) ? {
        eventType: event,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        deviceInfo: this.getDeviceInfo(),
        pageInfo: this.getPageInfo(),
        properties: properties || {}
      } as TypedAnalyticsEvent : {
        event: event as string,
        properties: {
          ...properties,
          userId: this.userId,
          sessionId: this.sessionId,
          ...context
        },
        timestamp: Date.now()
      } as LegacyAnalyticsEvent;

      if (this.config.enableConsoleLogging) {
        console.log('[Analytics]', analyticsEvent);
      }

      this.events.push(analyticsEvent);

      // Store in localStorage if enabled (throttled to avoid blocking UI)
      if (this.config.enableLocalStorage) {
        this.throttledPersistEvent(analyticsEvent);
      }

      // Auto-flush if batch size reached
      if (this.events.length >= this.config.batchSize!) {
        this.flush();
      }
    };

    // Use idle callback for performance optimization
    if ('requestIdleCallback' in window) {
      requestIdleCallback(processEvent, { timeout: 1000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(processEvent, 0);
    }
  }

  /**
   * User identification with traits
   */
  identify(userId: string, traits?: UserTraits): void {
    this.userId = userId;
    this.userTraits = traits;
    
    this.track('user_identified', {
      userId,
      traits,
      timestamp: Date.now()
    });
  }

  /**
   * Reset user session and generate new session ID
   */
  reset(): void {
    this.userId = undefined;
    this.userTraits = undefined;
    this.sessionId = this.generateSessionId();
    
    this.track('session_reset', {
      timestamp: Date.now()
    });
  }

  /**
   * Flush events to analytics service
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    if (this.enabled) {
      // In production, send to analytics service
      try {
        // TODO: Implement actual analytics service integration
        console.log('[Analytics] Flushing events:', eventsToSend);
      } catch (error) {
        console.error('[Analytics] Failed to flush events:', error);
        // Re-add events for retry
        this.events.unshift(...eventsToSend);
      }
    }
  }

  /**
   * Configure analytics settings
   */
  configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Landing page specific events for integrity tracking (enhanced with types)
  trackHeroTrySample(): void {
    this.track('cta_click', {
      source: 'hero_section',
      action: 'demo_initiated',
      ctaType: 'try_sample'
    });
  }

  trackSampleGenerated(platform: string, wordCount: number, score?: number): void {
    this.track('sample_generated', {
      platform,
      word_count: wordCount,
      score,
      source: 'mini_demo'
    });
  }

  trackCtaStartedFree(source: string): void {
    this.track('cta_click', {
      source,
      action: 'onboarding_initiated',
      ctaType: 'start_free'
    });
  }

  trackWatchedDemo45s(): void {
    this.track('demo_viewed', {
      action: 'demo_viewed',
      duration: 45,
      durationUnit: 'seconds'
    });
  }

  trackStickyCta(): void {
    this.track('cta_click', {
      source: 'sticky_micro_cta',
      action: 'onboarding_initiated',
      ctaType: 'sticky'
    });
  }

  /**
   * Get comprehensive analytics summary for honest claims
   * Includes conversion rates, user behavior, and performance metrics
   */
  getSummary(): {
    total_events: number;
    unique_users: number;
    session_count: number;
    conversion_rate: number;
    sample_generations: number;
    cta_clicks: number;
    sticky_cta_clicks: number;
    demo_views: number;
    avg_session_duration: number;
    top_events: Array<{ event: string; count: number }>;
  } {
    try {
      const stored = localStorage.getItem('hls_analytics') || '[]';
      const events: AnalyticsEvent[] = JSON.parse(stored);
      
      const uniqueUsers = new Set(
        events.map(e => this.isLegacyEvent(e) ? e.properties?.userId : e.userId)
          .filter(Boolean)
      ).size;
      
      const uniqueSessions = new Set(
        events.map(e => this.isLegacyEvent(e) ? e.properties?.sessionId : e.sessionId)
          .filter(Boolean)
      ).size;
      
      const ctaViews = events.filter(e => 
        this.isLegacyEvent(e) ? e.event === 'cta_view' : e.eventType === 'cta_view'
      ).length;
      
      const ctaClicks = events.filter(e => 
        this.isLegacyEvent(e) ? 
          ['cta_started_free', 'sticky_cta_clicked'].includes(e.event) :
          e.eventType === 'cta_click'
      ).length;
      
      const conversionRate = ctaViews > 0 ? (ctaClicks / ctaViews) * 100 : 0;
      
      // Calculate event frequency
      const eventCounts = events.reduce((acc, event) => {
        const eventType = this.isLegacyEvent(event) ? event.event : event.eventType;
        acc[eventType] = (acc[eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topEvents = Object.entries(eventCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([event, count]) => ({ event, count }));
      
      return {
        total_events: events.length,
        unique_users: uniqueUsers,
        session_count: uniqueSessions,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        sample_generations: events.filter(e => 
          this.isLegacyEvent(e) ? e.event === 'sample_generated' : e.eventType === 'sample_generated'
        ).length,
        cta_clicks: ctaClicks,
        sticky_cta_clicks: events.filter(e => 
          this.isLegacyEvent(e) ? e.event === 'sticky_cta_clicked' : 
          (e.eventType === 'cta_click' && e.properties?.source === 'sticky_micro_cta')
        ).length,
        demo_views: events.filter(e => 
          this.isLegacyEvent(e) ? e.event === 'watched_demo_45s' : e.eventType === 'demo_viewed'
        ).length,
        avg_session_duration: 0, // TODO: Calculate from session events
        top_events: topEvents
      };
    } catch (error) {
      console.error('[Analytics] Failed to generate summary:', error);
      return {
        total_events: 0,
        unique_users: 0,
        session_count: 0,
        conversion_rate: 0,
        sample_generations: 0,
        cta_clicks: 0,
        sticky_cta_clicks: 0,
        demo_views: 0,
        avg_session_duration: 0,
        top_events: []
      };
    }
  }

  /**
   * Private helper methods
   */
  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private isTypedEvent(event: string | ConversionEventType): event is ConversionEventType {
    const typedEvents: ConversionEventType[] = [
      'cta_click', 'cta_view', 'trust_signal_view', 'urgency_indicator_view',
      'funnel_step', 'ab_test_exposure', 'error', 'performance'
    ];
    return typedEvents.includes(event as ConversionEventType);
  }

  private isLegacyEvent(event: AnalyticsEvent): event is LegacyAnalyticsEvent {
    return 'event' in event;
  }

  private persistEvent(event: AnalyticsEvent): void {
    try {
      const stored = localStorage.getItem('hls_analytics') || '[]';
      const existingEvents = JSON.parse(stored);
      existingEvents.push(event);
      
      // Keep only last 1000 events to avoid storage bloat
      const recentEvents = existingEvents.slice(-1000);
      localStorage.setItem('hls_analytics', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('[Analytics] Failed to store event:', error);
    }
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: this.getDevicePlatform(),
      screenResolution: [window.screen.width, window.screen.height] as const,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  private getPageInfo() {
    return {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      path: window.location.pathname,
      queryParams: Object.fromEntries(new URLSearchParams(window.location.search))
    };
  }

  private getDevicePlatform(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  /**
   * Throttle utility to limit function calls for performance
   */
  private throttle<T extends (...args: any[]) => void>(
    func: T, 
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;
    
    return (...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * Enhanced localStorage operations with performance optimizations
   */
  private persistEventOptimized(event: AnalyticsEvent): void {
    try {
      // Use a more efficient storage approach for performance
      const storageKey = 'hls_analytics_batch';
      const batchData = localStorage.getItem(storageKey);
      let events: AnalyticsEvent[] = [];
      
      if (batchData) {
        try {
          events = JSON.parse(batchData);
        } catch {
          // Reset if corrupted
          events = [];
        }
      }
      
      events.push(event);
      
      // Keep only last 500 events to prevent storage bloat and improve performance
      if (events.length > 500) {
        events = events.slice(-500);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(events));
    } catch (error) {
      console.warn('[Analytics] Failed to persist event:', error);
    }
  }

  /**
   * Background sync for improved performance
   */
  private async backgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('analytics-sync');
      } catch (error) {
        console.warn('[Analytics] Background sync registration failed:', error);
      }
    }
  }

  /**
   * Initialize performance optimizations
   */
  private initializePerformanceOptimizations(): void {
    // Periodic cleanup of old events
    setInterval(() => {
      if (this.events.length > this.config.batchSize! * 2) {
        this.flush();
      }
    }, this.config.flushInterval!);

    // Background sync initialization
    this.backgroundSync();

    // Visibility change handling for better performance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.events.length > 0) {
        // Flush events when page becomes hidden
        this.flush();
      }
    });

    // Page unload handling
    window.addEventListener('beforeunload', () => {
      if (this.events.length > 0) {
        // Use sendBeacon for reliable event sending on page unload
        if ('sendBeacon' in navigator) {
          const eventsToSend = [...this.events];
          this.events = [];
          
          navigator.sendBeacon('/api/analytics/batch', JSON.stringify({
            events: eventsToSend,
            timestamp: Date.now()
          }));
        }
      }
    });
  }
}

// Initialize analytics with performance optimizations
class PerformanceOptimizedAnalytics extends Analytics {
  constructor() {
    super();
    
    // Initialize performance optimizations after construction
    if (typeof window !== 'undefined') {
      this.initializePerformanceOptimizations();
    }
  }
}

export const analytics = new PerformanceOptimizedAnalytics();