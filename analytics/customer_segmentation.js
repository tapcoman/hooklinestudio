// Customer Segmentation and Predictive Analytics
class CustomerSegmentation {
  constructor() {
    this.segments = new Map();
    this.userProfiles = new Map();
    this.behaviorScores = new Map();
    
    this.initializeSegmentation();
  }

  initializeSegmentation() {
    this.identifyUserSegments();
    this.trackGeographicPatterns();
    this.analyzeDeviceBehavior();
    this.monitorTrafficSources();
  }

  // Identify and classify user segments
  identifyUserSegments() {
    const userId = this.getUserId();
    
    // Get user context
    const userContext = {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Classify traffic source
    const trafficSource = this.classifyTrafficSource(userContext.referrer);
    
    // Identify creator persona
    const creatorPersona = this.identifyCreatorPersona(userContext);
    
    // Device classification
    const deviceType = this.classifyDevice(userContext.userAgent, userContext.viewport);
    
    const segment = {
      userId,
      trafficSource,
      creatorPersona,
      deviceType,
      geographic: this.getGeographicInfo(),
      timestamp: new Date().toISOString()
    };

    this.segments.set(userId, segment);

    // Track segment assignment
    analytics.track('user_segmented', segment);
    analytics.identify(userId, {
      segment: segment,
      traits: {
        trafficSource: trafficSource.category,
        creatorPersona: creatorPersona.type,
        deviceType: deviceType.category
      }
    });
  }

  // Traffic source classification
  classifyTrafficSource(referrer) {
    if (!referrer) {
      return { category: 'direct', subcategory: 'direct', confidence: 1.0 };
    }

    const url = new URL(referrer);
    const domain = url.hostname.toLowerCase();

    // Search engines
    if (domain.includes('google')) {
      return { category: 'organic', subcategory: 'google', confidence: 0.9 };
    }
    if (domain.includes('bing') || domain.includes('yahoo')) {
      return { category: 'organic', subcategory: 'other_search', confidence: 0.9 };
    }

    // Social media platforms
    if (domain.includes('facebook') || domain.includes('instagram')) {
      return { category: 'social', subcategory: 'meta', confidence: 0.95 };
    }
    if (domain.includes('tiktok')) {
      return { category: 'social', subcategory: 'tiktok', confidence: 0.95 };
    }
    if (domain.includes('youtube')) {
      return { category: 'social', subcategory: 'youtube', confidence: 0.95 };
    }
    if (domain.includes('twitter') || domain.includes('x.com')) {
      return { category: 'social', subcategory: 'twitter', confidence: 0.95 };
    }
    if (domain.includes('linkedin')) {
      return { category: 'social', subcategory: 'linkedin', confidence: 0.95 };
    }

    // Paid advertising
    const urlParams = url.searchParams;
    if (urlParams.get('utm_source') || urlParams.get('gclid') || urlParams.get('fbclid')) {
      return { category: 'paid', subcategory: 'advertising', confidence: 0.9 };
    }

    // Email
    if (urlParams.get('utm_medium') === 'email') {
      return { category: 'email', subcategory: 'campaign', confidence: 0.9 };
    }

    // Default to referral
    return { category: 'referral', subcategory: domain, confidence: 0.7 };
  }

  // Creator persona identification
  identifyCreatorPersona(context) {
    const userAgent = context.userAgent.toLowerCase();
    const referrer = context.referrer?.toLowerCase() || '';
    
    // Mobile-first indicators (TikTok/Instagram creators)
    if (this.isMobile(userAgent) && (referrer.includes('tiktok') || referrer.includes('instagram'))) {
      return { 
        type: 'mobile_content_creator', 
        platform: referrer.includes('tiktok') ? 'tiktok' : 'instagram',
        confidence: 0.8 
      };
    }

    // YouTube indicators
    if (referrer.includes('youtube') || context.screen.width >= 1920) {
      return { 
        type: 'youtube_creator', 
        platform: 'youtube',
        confidence: 0.7 
      };
    }

    // Professional creator indicators (LinkedIn, high-res screens)
    if (referrer.includes('linkedin') || (context.screen.width >= 2560 && context.screen.height >= 1440)) {
      return { 
        type: 'professional_creator', 
        platform: 'linkedin',
        confidence: 0.6 
      };
    }

    return { type: 'general_user', platform: 'unknown', confidence: 0.5 };
  }

  // Device classification
  classifyDevice(userAgent, viewport) {
    const ua = userAgent.toLowerCase();
    
    // Mobile detection
    if (/android|iphone|ipad|ipod|blackberry|windows phone/.test(ua)) {
      const isTablet = /ipad/.test(ua) || (viewport.width >= 768 && /android/.test(ua));
      return {
        category: isTablet ? 'tablet' : 'mobile',
        os: this.getOS(ua),
        browser: this.getBrowser(ua),
        screenSize: `${viewport.width}x${viewport.height}`
      };
    }

    // Desktop detection
    return {
      category: 'desktop',
      os: this.getOS(ua),
      browser: this.getBrowser(ua),
      screenSize: `${viewport.width}x${viewport.height}`
    };
  }

  // Geographic analysis (simplified - in production, use IP geolocation service)
  getGeographicInfo() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    return {
      timezone,
      language,
      estimatedRegion: this.estimateRegionFromTimezone(timezone)
    };
  }

  // Lead scoring based on behavior
  calculateLeadScore(userId, behaviors) {
    let score = 0;
    
    // Base scoring factors
    const scoringFactors = {
      pageViews: behaviors.pageViews * 2,
      timeOnSite: Math.min(behaviors.timeOnSite / 1000 / 60, 10) * 5, // Max 10 minutes
      scrollDepth: (behaviors.maxScrollDepth / 100) * 10,
      formInteractions: behaviors.formInteractions * 15,
      videoWatched: behaviors.videoWatched ? 20 : 0,
      downloadedAsset: behaviors.downloadedAsset ? 25 : 0,
      socialShare: behaviors.socialShare * 10,
      returnVisitor: behaviors.returnVisitor ? 15 : 0
    };

    // Calculate base score
    score = Object.values(scoringFactors).reduce((sum, val) => sum + val, 0);

    // Segment multipliers
    const segment = this.segments.get(userId);
    if (segment) {
      // Traffic source multipliers
      const sourceMultipliers = {
        organic: 1.2,
        social: 1.0,
        paid: 0.9,
        referral: 1.1,
        direct: 1.3,
        email: 1.4
      };

      // Creator persona multipliers
      const personaMultipliers = {
        mobile_content_creator: 1.3,
        youtube_creator: 1.2,
        professional_creator: 1.4,
        general_user: 1.0
      };

      score *= (sourceMultipliers[segment.trafficSource.category] || 1.0);
      score *= (personaMultipliers[segment.creatorPersona.type] || 1.0);
    }

    return Math.min(Math.round(score), 100); // Cap at 100
  }

  // Predict conversion likelihood
  predictConversionProbability(userId, leadScore, segment, behaviors) {
    // Simple logistic regression approximation
    // In production, use trained ML model
    
    let logit = -2.0; // Base intercept
    
    // Lead score impact
    logit += (leadScore / 100) * 3.0;
    
    // Segment impacts
    if (segment) {
      const segmentWeights = {
        'mobile_content_creator': 0.5,
        'youtube_creator': 0.3,
        'professional_creator': 0.7,
        'organic': 0.4,
        'social': 0.2,
        'paid': 0.1,
        'referral': 0.3,
        'direct': 0.6,
        'email': 0.8
      };
      
      logit += (segmentWeights[segment.creatorPersona.type] || 0);
      logit += (segmentWeights[segment.trafficSource.category] || 0);
    }
    
    // Behavior impacts
    if (behaviors.formInteractions > 0) logit += 1.0;
    if (behaviors.videoWatched) logit += 0.8;
    if (behaviors.downloadedAsset) logit += 1.2;
    if (behaviors.timeOnSite > 180000) logit += 0.6; // > 3 minutes
    
    // Convert logit to probability
    const probability = 1 / (1 + Math.exp(-logit));
    
    return Math.round(probability * 100) / 100;
  }

  // Churn risk analysis
  calculateChurnRisk(userId, trialData, engagementMetrics) {
    let riskScore = 0;
    
    // Days since trial start
    const daysSinceTrial = (Date.now() - new Date(trialData.startDate).getTime()) / (1000 * 60 * 60 * 24);
    
    // Risk factors
    if (daysSinceTrial > 7 && engagementMetrics.lastActivityDays > 3) riskScore += 30;
    if (engagementMetrics.featureUsage < 3) riskScore += 25;
    if (engagementMetrics.sessionFrequency < 0.5) riskScore += 20; // Less than every other day
    if (!engagementMetrics.hasCreatedContent) riskScore += 35;
    if (engagementMetrics.supportTickets > 2) riskScore += 15;
    
    // Protective factors
    if (engagementMetrics.hasInvitedTeamMembers) riskScore -= 20;
    if (engagementMetrics.hasCustomizedSettings) riskScore -= 10;
    if (engagementMetrics.exportedContent) riskScore -= 15;
    
    return Math.max(0, Math.min(100, riskScore));
  }

  // Lifetime value prediction
  predictLifetimeValue(conversionProbability, segment, behaviorProfile) {
    // Base LTV by segment
    const baseLTV = {
      'mobile_content_creator': 89,
      'youtube_creator': 149,
      'professional_creator': 299,
      'general_user': 79
    };
    
    let ltv = baseLTV[segment?.creatorPersona?.type] || baseLTV.general_user;
    
    // Adjust by conversion probability
    ltv *= conversionProbability;
    
    // Behavior multipliers
    if (behaviorProfile.engagementScore > 7) ltv *= 1.3;
    if (behaviorProfile.featureAdoption > 0.6) ltv *= 1.2;
    if (behaviorProfile.socialSharing) ltv *= 1.1;
    
    return Math.round(ltv);
  }

  // Utility functions
  isMobile(userAgent) {
    return /android|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent.toLowerCase());
  }

  getOS(userAgent) {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  getBrowser(userAgent) {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  estimateRegionFromTimezone(timezone) {
    if (timezone.includes('America/')) return 'Americas';
    if (timezone.includes('Europe/')) return 'Europe';
    if (timezone.includes('Asia/')) return 'Asia';
    if (timezone.includes('Australia/')) return 'Oceania';
    if (timezone.includes('Africa/')) return 'Africa';
    return 'Unknown';
  }

  getUserId() {
    return analytics.user().id() || analytics.user().anonymousId();
  }

  // Public methods for tracking
  updateBehaviorProfile(userId, behaviors) {
    const segment = this.segments.get(userId);
    const leadScore = this.calculateLeadScore(userId, behaviors);
    const conversionProbability = this.predictConversionProbability(userId, leadScore, segment, behaviors);
    const ltv = this.predictLifetimeValue(conversionProbability, segment, behaviors);

    const profile = {
      userId,
      leadScore,
      conversionProbability,
      predictedLTV: ltv,
      lastUpdated: new Date().toISOString()
    };

    this.userProfiles.set(userId, profile);

    analytics.track('user_profile_updated', profile);
    
    return profile;
  }
}

export const customerSegmentation = new CustomerSegmentation();