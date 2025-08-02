// Conversion Funnel Tracking
class ConversionAnalytics {
  constructor() {
    this.funnel = {
      landingPageView: 'landing_view',
      trialSignup: 'trial_signup',
      paidConversion: 'paid_conversion'
    };
  }

  trackPageView(pageType, metadata = {}) {
    analytics.track(this.funnel[pageType], {
      ...metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    });
  }

  trackConversionStep(step, properties = {}) {
    analytics.track(`conversion_step_${step}`, {
      ...properties,
      stepTimestamp: new Date().toISOString()
    });
  }

  // Cohort Analysis Helper
  identifyCohort(user) {
    const cohortId = this.calculateCohortId(user);
    analytics.group(cohortId, {
      traits: {
        acquisitionSource: user.source,
        signupDate: user.signupDate
      }
    });
  }

  calculateCohortId(user) {
    // Example cohort logic: Group by acquisition month
    const signupDate = new Date(user.signupDate);
    return `cohort_${signupDate.getFullYear()}_${signupDate.getMonth() + 1}`;
  }
}

// Instantiate and export
export const conversionAnalytics = new ConversionAnalytics();