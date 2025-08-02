// Simple analytics utility for tracking user interactions
// This enables honest, time-boxed claims based on real usage data

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private enabled = process.env.NODE_ENV === 'production';

  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      console.log('[Analytics]', event, properties);
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now()
    };

    this.events.push(analyticsEvent);

    // In production, you would send to your analytics service
    // For now, we'll store locally and console.log for development
    console.log('[Analytics]', analyticsEvent);
    
    // Store in localStorage for basic persistence
    try {
      const stored = localStorage.getItem('hls_analytics') || '[]';
      const existingEvents = JSON.parse(stored);
      existingEvents.push(analyticsEvent);
      
      // Keep only last 100 events to avoid storage bloat
      const recentEvents = existingEvents.slice(-100);
      localStorage.setItem('hls_analytics', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('[Analytics] Failed to store event:', error);
    }
  }

  // Landing page specific events for integrity tracking
  trackHeroTrySample() {
    this.track('hero_try_sample_clicked', {
      source: 'hero_section',
      action: 'demo_initiated'
    });
  }

  trackSampleGenerated(platform: string, wordCount: number, score?: number) {
    this.track('sample_generated', {
      platform,
      word_count: wordCount,
      score,
      source: 'mini_demo'
    });
  }

  trackCtaStartedFree(source: string) {
    this.track('cta_started_free', {
      source,
      action: 'onboarding_initiated'
    });
  }

  trackWatchedDemo45s() {
    this.track('watched_demo_45s', {
      action: 'demo_viewed',
      duration: '45_seconds'
    });
  }

  trackStickyCta() {
    this.track('sticky_cta_clicked', {
      source: 'sticky_micro_cta',
      action: 'onboarding_initiated'
    });
  }

  // Get analytics summary for honest claims
  getSummary() {
    try {
      const stored = localStorage.getItem('hls_analytics') || '[]';
      const events = JSON.parse(stored);
      
      return {
        total_events: events.length,
        sample_generations: events.filter((e: AnalyticsEvent) => e.event === 'sample_generated').length,
        cta_clicks: events.filter((e: AnalyticsEvent) => e.event === 'cta_started_free').length,
        sticky_cta_clicks: events.filter((e: AnalyticsEvent) => e.event === 'sticky_cta_clicked').length,
        demo_views: events.filter((e: AnalyticsEvent) => e.event === 'watched_demo_45s').length
      };
    } catch {
      return { total_events: 0 };
    }
  }
}

export const analytics = new Analytics();