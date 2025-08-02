// A/B Testing Framework
class ABTestingFramework {
  constructor() {
    this.tests = new Map();
    this.minSampleSize = 1000;
    this.confidenceLevel = 0.95;
  }

  // Initialize A/B test variant
  initializeTest(testId, variants, trafficAllocation) {
    const userId = this.getUserId();
    const variant = this.assignVariant(userId, testId, variants, trafficAllocation);
    
    this.tests.set(testId, {
      variant,
      startTime: Date.now(),
      userId
    });

    // Track variant assignment
    analytics.track('ab_test_assigned', {
      testId,
      variant,
      userId,
      timestamp: new Date().toISOString()
    });

    return variant;
  }

  // Assign user to variant using consistent hashing
  assignVariant(userId, testId, variants, allocation) {
    const hash = this.hashUserId(userId + testId);
    const bucket = hash % 100;
    
    let cumulativeWeight = 0;
    for (const [variant, weight] of Object.entries(allocation)) {
      cumulativeWeight += weight;
      if (bucket < cumulativeWeight) {
        return variant;
      }
    }
    return variants[0]; // Fallback
  }

  // Simple hash function for consistent assignment
  hashUserId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Track conversion for active tests
  trackConversion(conversionType, value = null) {
    this.tests.forEach((testData, testId) => {
      analytics.track('ab_test_conversion', {
        testId,
        variant: testData.variant,
        conversionType,
        value,
        timeToConversion: Date.now() - testData.startTime,
        userId: testData.userId,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Statistical significance calculation
  calculateSignificance(controlConversions, controlVisitors, variantConversions, variantVisitors) {
    const controlRate = controlConversions / controlVisitors;
    const variantRate = variantConversions / variantVisitors;
    
    const pooledRate = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlVisitors + 1/variantVisitors));
    
    const zScore = (variantRate - controlRate) / standardError;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    return {
      controlRate,
      variantRate,
      lift: (variantRate - controlRate) / controlRate,
      zScore,
      pValue,
      isSignificant: pValue < (1 - this.confidenceLevel)
    };
  }

  // Normal CDF approximation
  normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  // Error function approximation
  erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  getUserId() {
    return analytics.user().id() || analytics.user().anonymousId();
  }
}

// Test configurations
const AB_TESTS = {
  HERO_SECTION: {
    id: 'hero_section_v1',
    variants: ['control', 'variant_a', 'variant_b'],
    allocation: { control: 34, variant_a: 33, variant_b: 33 }
  },
  CTA_BUTTON: {
    id: 'cta_button_v1',
    variants: ['control', 'green_cta', 'orange_cta'],
    allocation: { control: 34, green_cta: 33, orange_cta: 33 }
  },
  SOCIAL_PROOF: {
    id: 'social_proof_v1',
    variants: ['control', 'testimonials_top', 'stats_hero'],
    allocation: { control: 34, testimonials_top: 33, stats_hero: 33 }
  }
};

export const abTesting = new ABTestingFramework();
export { AB_TESTS };