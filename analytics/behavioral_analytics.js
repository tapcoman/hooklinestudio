// Behavioral Analytics Tracking
class BehavioralAnalytics {
  constructor() {
    this.scrollDepths = [25, 50, 75, 100];
    this.engagementEvents = [];
    this.sessionStartTime = Date.now();
    this.heatmapData = [];
    this.formInteractions = new Map();
    
    this.initializeTracking();
  }

  initializeTracking() {
    this.trackScrollDepth();
    this.trackClickHeatmap();
    this.trackFormInteractions();
    this.trackEngagementMetrics();
    this.trackPageVisibility();
  }

  // Scroll depth tracking
  trackScrollDepth() {
    let maxScrollDepth = 0;
    const trackedDepths = new Set();

    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const windowHeight = window.innerHeight;
      const scrollDepth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
      }

      // Track milestone scroll depths
      this.scrollDepths.forEach(depth => {
        if (scrollDepth >= depth && !trackedDepths.has(depth)) {
          trackedDepths.add(depth);
          analytics.track('scroll_depth', {
            depth,
            timeToScroll: Date.now() - this.sessionStartTime,
            timestamp: new Date().toISOString()
          });
        }
      });
    };

    window.addEventListener('scroll', this.throttle(trackScroll, 100));
  }

  // Click heatmap tracking
  trackClickHeatmap() {
    document.addEventListener('click', (event) => {
      const clickData = {
        x: event.clientX,
        y: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
        target: this.getElementSelector(event.target),
        timestamp: Date.now(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      this.heatmapData.push(clickData);

      // Track significant interactions
      analytics.track('click_interaction', {
        element: clickData.target,
        position: { x: clickData.x, y: clickData.y },
        viewport: clickData.viewport,
        timestamp: new Date().toISOString()
      });

      // Batch send heatmap data periodically
      if (this.heatmapData.length >= 10) {
        this.sendHeatmapData();
      }
    });
  }

  // Form interaction tracking
  trackFormInteractions() {
    document.addEventListener('focusin', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        const formId = this.getFormId(event.target);
        const fieldName = event.target.name || event.target.id || 'unnamed_field';
        
        this.formInteractions.set(formId + '_' + fieldName, {
          focusTime: Date.now(),
          fieldName,
          formId
        });
      }
    });

    document.addEventListener('focusout', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        const formId = this.getFormId(event.target);
        const fieldName = event.target.name || event.target.id || 'unnamed_field';
        const key = formId + '_' + fieldName;
        
        const interaction = this.formInteractions.get(key);
        if (interaction) {
          const timeSpent = Date.now() - interaction.focusTime;
          
          analytics.track('form_field_interaction', {
            formId,
            fieldName,
            timeSpent,
            hasValue: !!event.target.value,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Track form submissions and abandonments
    document.addEventListener('submit', (event) => {
      const formId = this.getFormId(event.target);
      analytics.track('form_submission', {
        formId,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Engagement metrics tracking
  trackEngagementMetrics() {
    let mouseMovements = 0;
    let keystrokes = 0;
    let activeTime = 0;
    let lastActivity = Date.now();

    // Track mouse movements
    document.addEventListener('mousemove', this.throttle(() => {
      mouseMovements++;
      lastActivity = Date.now();
    }, 1000));

    // Track keystrokes
    document.addEventListener('keydown', () => {
      keystrokes++;
      lastActivity = Date.now();
    });

    // Calculate active time
    setInterval(() => {
      const now = Date.now();
      if (now - lastActivity < 30000) { // Active if interaction within 30 seconds
        activeTime += 1000;
      }
    }, 1000);

    // Send engagement data periodically
    setInterval(() => {
      analytics.track('engagement_metrics', {
        mouseMovements,
        keystrokes,
        activeTime,
        totalTime: Date.now() - this.sessionStartTime,
        engagementScore: this.calculateEngagementScore(mouseMovements, keystrokes, activeTime),
        timestamp: new Date().toISOString()
      });

      // Reset counters
      mouseMovements = 0;
      keystrokes = 0;
    }, 30000); // Every 30 seconds
  }

  // Page visibility tracking
  trackPageVisibility() {
    let visibilityStart = Date.now();
    let totalVisibleTime = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        totalVisibleTime += Date.now() - visibilityStart;
        analytics.track('page_visibility_hidden', {
          visibleTime: Date.now() - visibilityStart,
          totalVisibleTime,
          timestamp: new Date().toISOString()
        });
      } else {
        visibilityStart = Date.now();
        analytics.track('page_visibility_visible', {
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Utility functions
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  getElementSelector(element) {
    let selector = element.tagName.toLowerCase();
    if (element.id) selector += `#${element.id}`;
    if (element.className) selector += `.${element.className.replace(/\s+/g, '.')}`;
    return selector;
  }

  getFormId(element) {
    const form = element.closest('form');
    return form ? (form.id || form.name || 'unnamed_form') : 'no_form';
  }

  calculateEngagementScore(movements, keystrokes, activeTime) {
    // Simple engagement scoring algorithm
    const movementScore = Math.min(movements / 10, 10);
    const keystrokeScore = Math.min(keystrokes / 5, 10);
    const timeScore = Math.min(activeTime / 60000, 10); // Per minute
    
    return Math.round((movementScore + keystrokeScore + timeScore) / 3 * 10) / 10;
  }

  sendHeatmapData() {
    if (this.heatmapData.length > 0) {
      analytics.track('heatmap_batch', {
        clicks: this.heatmapData,
        sessionId: this.getSessionId(),
        timestamp: new Date().toISOString()
      });
      this.heatmapData = [];
    }
  }

  getSessionId() {
    return analytics.user().anonymousId() + '_' + this.sessionStartTime;
  }
}

export const behavioralAnalytics = new BehavioralAnalytics();