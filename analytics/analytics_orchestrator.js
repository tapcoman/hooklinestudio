// Main Analytics Orchestrator - Privacy-Compliant Integration
import { conversionAnalytics } from './conversion_tracking.js';
import { abTesting, AB_TESTS } from './ab_testing.js';
import { behavioralAnalytics } from './behavioral_analytics.js';
import { performanceAnalytics } from './performance_analytics.js';
import { customerSegmentation } from './customer_segmentation.js';
import { dashboardAnalytics } from './dashboard_analytics.js';

class AnalyticsOrchestrator {
  constructor() {
    this.initialized = false;
    this.consentGiven = false;
    this.modules = {};
    this.config = this.getDefaultConfig();
    
    this.initializeAnalytics();
  }

  getDefaultConfig() {
    return {
      // Privacy settings
      respectDNT: true,
      anonymizeIPs: true,
      cookieConsent: false,
      dataRetentionDays: 365,
      
      // Performance settings
      samplingRate: 1.0, // 100% for now, can be reduced for high traffic
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      
      // Feature flags
      enableABTesting: true,
      enableBehavioralTracking: true,
      enablePerformanceTracking: true,
      enablePredictiveAnalytics: true,
      enableRealTimeDashboard: true,
      
      // Segment integration
      segmentWriteKey: process.env.SEGMENT_WRITE_KEY || 'your_segment_key',
      
      // BigQuery settings
      bigQueryDataset: 'hookline_analytics',
      bigQueryProject: process.env.GOOGLE_CLOUD_PROJECT || 'hookline-studio'
    };
  }

  async initializeAnalytics() {
    try {
      // Check privacy compliance
      await this.checkPrivacyCompliance();
      
      if (!this.consentGiven) {
        console.log('Analytics consent not given, initializing in privacy mode');
        this.initializePrivacyMode();
        return;
      }

      // Initialize Segment
      await this.initializeSegment();
      
      // Initialize all analytics modules
      this.modules = {
        conversion: conversionAnalytics,
        abTesting: abTesting,
        behavioral: behavioralAnalytics,
        performance: performanceAnalytics,
        segmentation: customerSegmentation,
        dashboard: dashboardAnalytics
      };

      // Set up A/B tests
      this.initializeABTests();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Mark as initialized
      this.initialized = true;
      
      console.log('Analytics orchestrator initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      this.initializeFallbackMode();
    }
  }

  async checkPrivacyCompliance() {
    // Check Do Not Track
    if (this.config.respectDNT && navigator.doNotTrack === '1') {
      this.consentGiven = false;
      return;
    }

    // Check for existing consent (from cookie or localStorage)
    const existingConsent = localStorage.getItem('analytics_consent');
    if (existingConsent) {
      this.consentGiven = JSON.parse(existingConsent).granted;
      return;
    }

    // For GDPR/CCPA compliance, wait for explicit consent
    this.consentGiven = await this.requestUserConsent();
  }

  async requestUserConsent() {
    // This would integrate with your consent management platform
    // For now, return true for development
    return new Promise((resolve) => {
      // In production, show consent banner and wait for user action
      const consent = true; // Mock consent for development
      
      localStorage.setItem('analytics_consent', JSON.stringify({
        granted: consent,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
      
      resolve(consent);
    });
  }

  async initializeSegment() {
    if (typeof analytics === 'undefined') {
      // Load Segment Analytics.js
      const script = document.createElement('script');
      script.src = 'https://cdn.segment.com/analytics.js/v1/YOUR_WRITE_KEY/analytics.min.js';
      script.async = true;
      document.head.appendChild(script);
      
      // Wait for Segment to load
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    // Configure Segment with privacy settings
    analytics.page({
      anonymousId: this.generateAnonymousId(),
      context: {
        ip: '0.0.0.0', // Anonymize IP
        userAgent: this.config.anonymizeIPs ? this.anonymizeUserAgent(navigator.userAgent) : navigator.userAgent
      }
    });
  }

  initializeABTests() {
    // Initialize active A/B tests
    Object.values(AB_TESTS).forEach(test => {
      const variant = abTesting.initializeTest(
        test.id,
        test.variants,
        test.allocation
      );
      
      // Apply variant to DOM if needed
      this.applyTestVariant(test.id, variant);
    });
  }

  applyTestVariant(testId, variant) {
    switch (testId) {
      case 'hero_section_v1':
        this.applyHeroVariant(variant);
        break;
      case 'cta_button_v1':
        this.applyCTAVariant(variant);
        break;
      case 'social_proof_v1':
        this.applySocialProofVariant(variant);
        break;
    }
  }

  applyHeroVariant(variant) {
    const heroElement = document.querySelector('[data-test="hero-section"]');
    if (heroElement) {
      heroElement.setAttribute('data-variant', variant);
      
      switch (variant) {
        case 'variant_a':
          heroElement.innerHTML = this.getHeroVariantA();
          break;
        case 'variant_b':
          heroElement.innerHTML = this.getHeroVariantB();
          break;
        default:
          // Control variant - no changes
          break;
      }
    }
  }

  applyCTAVariant(variant) {
    const ctaButtons = document.querySelectorAll('[data-test="cta-button"]');
    ctaButtons.forEach(button => {
      button.setAttribute('data-variant', variant);
      
      switch (variant) {
        case 'green_cta':
          button.className = button.className.replace(/bg-\w+-\d+/, 'bg-green-600 hover:bg-green-700');
          break;
        case 'orange_cta':
          button.className = button.className.replace(/bg-\w+-\d+/, 'bg-orange-600 hover:bg-orange-700');
          break;
        default:
          // Control variant - keep original styling
          break;
      }
    });
  }

  applySocialProofVariant(variant) {
    const socialProofElement = document.querySelector('[data-test="social-proof"]');
    if (socialProofElement) {
      socialProofElement.setAttribute('data-variant', variant);
      
      switch (variant) {
        case 'testimonials_top':
          // Move testimonials to top of page
          this.moveSocialProofToTop(socialProofElement);
          break;
        case 'stats_hero':
          // Show stats in hero section
          this.showStatsInHero();
          break;
        default:
          // Control variant - original placement
          break;
      }
    }
  }

  setupEventListeners() {
    // Conversion tracking
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-track]');
      if (target) {
        const action = target.getAttribute('data-track');
        this.trackConversion(action, {
          element: target.tagName,
          text: target.textContent.trim()
        });
      }
    });

    // Form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        this.trackConversion('form_submission', {
          formId: form.id || 'unnamed_form',
          formAction: form.action
        });
      }
    });

    // Page unload - send final metrics
    window.addEventListener('beforeunload', () => {
      this.flushAnalytics();
    });

    // Visibility change - track engagement
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseTracking();
      } else {
        this.resumeTracking();
      }
    });
  }

  // Public methods for tracking
  trackConversion(type, properties = {}) {
    if (!this.initialized || !this.consentGiven) return;

    // Track in conversion analytics
    this.modules.conversion.trackConversionStep(type, properties);
    
    // Track in A/B testing
    this.modules.abTesting.trackConversion(type, properties.value);
    
    // Update segmentation
    const userId = this.getUserId();
    const currentBehavior = this.getCurrentBehaviorProfile(userId);
    this.modules.segmentation.updateBehaviorProfile(userId, currentBehavior);
  }

  trackPageView(page, properties = {}) {
    if (!this.initialized || !this.consentGiven) return;

    const pageData = {
      page,
      ...properties,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    analytics.page(page, pageData);
    this.modules.conversion.trackPageView('landingPageView', pageData);
  }

  identifyUser(userId, traits = {}) {
    if (!this.initialized || !this.consentGiven) return;

    analytics.identify(userId, traits);
    this.modules.segmentation.identifyCohort({ ...traits, userId });
  }

  // Privacy methods
  updateConsent(granted) {
    this.consentGiven = granted;
    
    localStorage.setItem('analytics_consent', JSON.stringify({
      granted,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));

    if (granted && !this.initialized) {
      this.initializeAnalytics();
    } else if (!granted) {
      this.pauseAllTracking();
    }
  }

  pauseAllTracking() {
    this.initialized = false;
    // Clear any stored data
    this.clearStoredData();
  }

  clearStoredData() {
    // Clear analytics-related data from localStorage/sessionStorage
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('analytics_') || 
      key.startsWith('segment_') ||
      key.startsWith('amplitude_')
    );
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Utility methods
  getCurrentBehaviorProfile(userId) {
    // This would aggregate current session behavior
    return {
      pageViews: 1,
      timeOnSite: Date.now() - performance.timing.navigationStart,
      maxScrollDepth: this.getMaxScrollDepth(),
      formInteractions: this.getFormInteractionCount(),
      videoWatched: this.hasWatchedVideo(),
      downloadedAsset: this.hasDownloadedAsset(),
      socialShare: this.hasSocialShared(),
      returnVisitor: this.isReturnVisitor()
    };
  }

  getMaxScrollDepth() {
    const scrollTop = window.pageYOffset;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    const windowHeight = window.innerHeight;
    return Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
  }

  getUserId() {
    return analytics?.user()?.id() || analytics?.user()?.anonymousId() || this.generateAnonymousId();
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  generateAnonymousId() {
    return 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  anonymizeUserAgent(userAgent) {
    // Remove specific version numbers for privacy
    return userAgent.replace(/\d+\.\d+\.\d+/g, 'x.x.x');
  }

  // Fallback methods
  initializePrivacyMode() {
    console.log('Running in privacy mode - limited analytics');
    // Initialize basic, non-invasive tracking
  }

  initializeFallbackMode() {
    console.log('Running in fallback mode - local analytics only');
    // Initialize local-only analytics without external services
  }

  pauseTracking() {
    // Pause active tracking when page is hidden
  }

  resumeTracking() {
    // Resume tracking when page becomes visible
  }

  flushAnalytics() {
    // Send any pending analytics data
    if (this.initialized && this.consentGiven) {
      // Force send any batched events
      if (typeof analytics !== 'undefined') {
        analytics.flush();
      }
    }
  }

  // Mock methods for behavior tracking
  getFormInteractionCount() { return 0; }
  hasWatchedVideo() { return false; }
  hasDownloadedAsset() { return false; }
  hasSocialShared() { return false; }
  isReturnVisitor() { return false; }

  // Variant content methods
  getHeroVariantA() {
    return `
      <h1 class="text-5xl font-bold text-gray-900 mb-6">
        Create Viral Content in Minutes, Not Hours
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        AI-powered video editing that understands what makes content go viral
      </p>
    `;
  }

  getHeroVariantB() {
    return `
      <h1 class="text-5xl font-bold text-gray-900 mb-6">
        From Zero to Viral: Your Content Creation Superpower
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Join 10,000+ creators using AI to 10x their content output
      </p>
    `;
  }

  moveSocialProofToTop(element) {
    const header = document.querySelector('header');
    if (header && element) {
      header.insertAdjacentElement('afterend', element);
    }
  }

  showStatsInHero() {
    const heroElement = document.querySelector('[data-test="hero-section"]');
    if (heroElement) {
      const statsHTML = `
        <div class="flex justify-center space-x-8 mt-8">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">10,000+</div>
            <div class="text-sm text-gray-500">Creators</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">1M+</div>
            <div class="text-sm text-gray-500">Videos Created</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">50M+</div>
            <div class="text-sm text-gray-500">Views Generated</div>
          </div>
        </div>
      `;
      heroElement.insertAdjacentHTML('beforeend', statsHTML);
    }
  }
}

// Initialize analytics orchestrator
export const analyticsOrchestrator = new AnalyticsOrchestrator();

// Global analytics interface
window.HookLineAnalytics = {
  track: (event, properties) => analyticsOrchestrator.trackConversion(event, properties),
  page: (name, properties) => analyticsOrchestrator.trackPageView(name, properties),
  identify: (userId, traits) => analyticsOrchestrator.identifyUser(userId, traits),
  updateConsent: (granted) => analyticsOrchestrator.updateConsent(granted),
  getDashboard: () => dashboardAnalytics.generateExecutiveDashboard()
};