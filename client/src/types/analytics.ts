/**
 * Comprehensive analytics typing for conversion optimization
 * Provides strict type safety for event tracking, A/B testing, and performance monitoring
 */

/**
 * Core Analytics Event Schema with strict typing
 */
export interface BaseAnalyticsEvent {
  readonly eventType: string;
  readonly timestamp: number;
  readonly sessionId: string;
  readonly userId?: string;
  readonly deviceInfo: DeviceInfo;
  readonly pageInfo: PageInfo;
}

export interface DeviceInfo {
  readonly userAgent: string;
  readonly platform: 'desktop' | 'mobile' | 'tablet';
  readonly screenResolution: readonly [number, number];
  readonly colorDepth: number;
  readonly timezone: string;
  readonly language: string;
}

export interface PageInfo {
  readonly url: string;
  readonly referrer: string;
  readonly title: string;
  readonly path: string;
  readonly queryParams: Record<string, string>;
}

/**
 * Conversion-Specific Event Types with strict schemas
 */
export interface CTAClickEvent extends BaseAnalyticsEvent {
  readonly eventType: 'cta_click';
  readonly properties: {
    readonly ctaId: string;
    readonly ctaVariant: string;
    readonly ctaText: string;
    readonly ctaPosition: string;
    readonly platform?: string;
    readonly testVariant?: string;
    readonly conversionValue?: number;
  };
}

export interface CTAViewEvent extends BaseAnalyticsEvent {
  readonly eventType: 'cta_view';
  readonly properties: {
    readonly ctaId: string;
    readonly ctaVariant: string;
    readonly viewDuration: number;
    readonly scrollDepth: number;
    readonly inViewport: boolean;
  };
}

export interface TrustSignalViewEvent extends BaseAnalyticsEvent {
  readonly eventType: 'trust_signal_view';
  readonly properties: {
    readonly signalType: string;
    readonly signalVariant: string;
    readonly viewDuration: number;
    readonly interacted: boolean;
  };
}

export interface UrgencyIndicatorEvent extends BaseAnalyticsEvent {
  readonly eventType: 'urgency_indicator_view';
  readonly properties: {
    readonly indicatorType: string;
    readonly urgencyLevel: string;
    readonly timeRemaining?: number;
    readonly triggered: boolean;
  };
}

export interface ConversionFunnelEvent extends BaseAnalyticsEvent {
  readonly eventType: 'funnel_step';
  readonly properties: {
    readonly funnelId: string;
    readonly stepIndex: number;
    readonly stepName: string;
    readonly previousStep?: string;
    readonly timeFromPrevious?: number;
    readonly abandoned: boolean;
  };
}

export interface ABTestExposureEvent extends BaseAnalyticsEvent {
  readonly eventType: 'ab_test_exposure';
  readonly properties: {
    readonly testId: string;
    readonly variantId: string;
    readonly exposureTime: number;
    readonly eligible: boolean;
  };
}

export interface ErrorEvent extends BaseAnalyticsEvent {
  readonly eventType: 'error';
  readonly properties: {
    readonly errorType: string;
    readonly errorMessage: string;
    readonly stackTrace: string;
    readonly componentName: string;
    readonly recoverable: boolean;
    readonly errorBoundary: boolean;
  };
}

export interface PerformanceEvent extends BaseAnalyticsEvent {
  readonly eventType: 'performance';
  readonly properties: {
    readonly metricName: string;
    readonly metricValue: number;
    readonly metricUnit: string;
    readonly componentName: string;
    readonly renderTime?: number;
  };
}

/**
 * Union type for all analytics events
 */
export type AnalyticsEvent = 
  | CTAClickEvent
  | CTAViewEvent
  | TrustSignalViewEvent
  | UrgencyIndicatorEvent
  | ConversionFunnelEvent
  | ABTestExposureEvent
  | ErrorEvent
  | PerformanceEvent;

/**
 * Analytics Configuration Types
 */
export interface AnalyticsConfig {
  readonly apiKey: string;
  readonly endpoint: string;
  readonly batchSize: number;
  readonly flushInterval: number;
  readonly maxRetries: number;
  readonly enableAutoTracking: boolean;
  readonly enableConsoleLogging: boolean;
  readonly enableLocalStorage: boolean;
  readonly samplingRate: number;
  readonly excludeEvents?: readonly string[];
}

export interface AnalyticsProvider {
  readonly name: string;
  readonly initialize: (config: AnalyticsConfig) => Promise<void>;
  readonly track: (event: AnalyticsEvent) => Promise<void>;
  readonly identify: (userId: string, traits?: UserTraits) => Promise<void>;
  readonly reset: () => Promise<void>;
  readonly flush: () => Promise<void>;
}

export interface UserTraits {
  readonly email?: string;
  readonly name?: string;
  readonly company?: string;
  readonly plan?: string;
  readonly signupDate?: string;
  readonly lastActive?: string;
  readonly totalEvents?: number;
  readonly conversionValue?: number;
}

/**
 * Analytics Query and Reporting Types
 */
export interface AnalyticsQuery {
  readonly events: readonly string[];
  readonly dateRange: DateRange;
  readonly filters?: AnalyticsFilters;
  readonly groupBy?: readonly string[];
  readonly metrics: readonly AnalyticsMetric[];
  readonly limit?: number;
  readonly offset?: number;
}

export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

export interface AnalyticsFilters {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly platform?: string;
  readonly testVariant?: string;
  readonly customProperties?: Record<string, any>;
}

export interface AnalyticsMetric {
  readonly name: string;
  readonly aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
  readonly field?: string;
}

export interface AnalyticsResult {
  readonly data: readonly AnalyticsDataPoint[];
  readonly totalCount: number;
  readonly query: AnalyticsQuery;
  readonly executionTime: number;
}

export interface AnalyticsDataPoint {
  readonly dimensions: Record<string, any>;
  readonly metrics: Record<string, number>;
  readonly timestamp: number;
}

/**
 * Real-time Analytics Types
 */
export interface RealTimeMetrics {
  readonly activeUsers: number;
  readonly eventsPerSecond: number;
  readonly topEvents: readonly EventFrequency[];
  readonly conversionRate: number;
  readonly averageSessionDuration: number;
  readonly bounceRate: number;
}

export interface EventFrequency {
  readonly eventType: string;
  readonly count: number;
  readonly percentage: number;
}

/**
 * A/B Testing Analytics Types
 */
export interface ABTestAnalytics {
  readonly testId: string;
  readonly startDate: Date;
  readonly endDate?: Date;
  readonly status: ABTestStatus;
  readonly variants: readonly ABTestVariantAnalytics[];
  readonly significanceLevel: number;
  readonly minSampleSize: number;
  readonly actualSampleSize: number;
  readonly winner?: string;
}

export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';

export interface ABTestVariantAnalytics {
  readonly variantId: string;
  readonly name: string;
  readonly trafficAllocation: number;
  readonly participants: number;
  readonly conversions: number;
  readonly conversionRate: number;
  readonly confidenceInterval: readonly [number, number];
  readonly statisticalSignificance: number;
  readonly revenuePerUser?: number;
  readonly engagementScore?: number;
}

/**
 * Conversion Funnel Analytics
 */
export interface FunnelAnalytics {
  readonly funnelId: string;
  readonly name: string;
  readonly steps: readonly FunnelStepAnalytics[];
  readonly totalUsers: number;
  readonly conversionRate: number;
  readonly averageTimeToConvert: number;
  readonly dropOffAnalysis: DropOffAnalysis;
}

export interface FunnelStepAnalytics {
  readonly stepIndex: number;
  readonly stepName: string;
  readonly users: number;
  readonly conversionRate: number;
  readonly averageTimeToNext?: number;
  readonly dropOffRate: number;
  readonly topExitPages?: readonly string[];
}

export interface DropOffAnalysis {
  readonly biggestDropOff: {
    readonly fromStep: string;
    readonly toStep: string;
    readonly dropOffRate: number;
  };
  readonly recommendations: readonly string[];
}

/**
 * Performance Analytics Types
 */
export interface PerformanceMetrics {
  readonly componentName: string;
  readonly renderTime: PerformanceStatistics;
  readonly memoryUsage: PerformanceStatistics;
  readonly bundleSize?: number;
  readonly errorRate: number;
  readonly userSatisfactionScore?: number;
}

export interface PerformanceStatistics {
  readonly min: number;
  readonly max: number;
  readonly average: number;
  readonly median: number;
  readonly p95: number;
  readonly p99: number;
}

/**
 * Privacy and Compliance Types
 */
export interface PrivacyConfig {
  readonly enableGDPRCompliance: boolean;
  readonly enableCCPACompliance: boolean;
  readonly consentRequired: boolean;
  readonly anonymizeIPs: boolean;
  readonly dataRetentionDays: number;
  readonly excludePII: boolean;
}

export interface ConsentManagement {
  readonly hasConsent: boolean;
  readonly consentDate?: Date;
  readonly consentVersion: string;
  readonly granularConsent: {
    readonly analytics: boolean;
    readonly marketing: boolean;
    readonly personalization: boolean;
  };
}

/**
 * Analytics Hook Return Types
 */
export interface UseAnalyticsReturn {
  readonly track: (event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'deviceInfo' | 'pageInfo'>) => void;
  readonly identify: (userId: string, traits?: UserTraits) => void;
  readonly page: (pageName: string, properties?: Record<string, any>) => void;
  readonly reset: () => void;
  readonly isInitialized: boolean;
  readonly sessionId: string;
}

export interface UseConversionTrackingReturn {
  readonly trackCTAClick: (ctaId: string, variant: string, properties?: Record<string, any>) => void;
  readonly trackCTAView: (ctaId: string, variant: string, viewDuration: number) => void;
  readonly trackFunnelStep: (funnelId: string, stepName: string, stepIndex: number) => void;
  readonly trackConversion: (value?: number, currency?: string) => void;
  readonly getConversionRate: () => number;
  readonly getFunnelAnalytics: (funnelId: string) => Promise<FunnelAnalytics | null>;
}

export interface UseABTestAnalyticsReturn {
  readonly trackExposure: (testId: string, variantId: string) => void;
  readonly trackConversion: (testId: string, conversionValue?: number) => void;
  readonly getTestResults: (testId: string) => Promise<ABTestAnalytics | null>;
  readonly isSignificant: (testId: string) => Promise<boolean>;
}

/**
 * Event Validation and Schema Types
 */
export interface EventSchema<T extends AnalyticsEvent = AnalyticsEvent> {
  readonly eventType: T['eventType'];
  readonly required: readonly (keyof T['properties'])[];
  readonly optional: readonly (keyof T['properties'])[];
  readonly validate: (event: any) => event is T;
  readonly transform?: (event: T) => T;
}

export type EventSchemaRegistry = {
  readonly [K in AnalyticsEvent['eventType']]: EventSchema<Extract<AnalyticsEvent, { eventType: K }>>;
};

/**
 * Type Guards for Analytics Events
 */
export const isCTAClickEvent = (event: AnalyticsEvent): event is CTAClickEvent => {
  return event.eventType === 'cta_click';
};

export const isCTAViewEvent = (event: AnalyticsEvent): event is CTAViewEvent => {
  return event.eventType === 'cta_view';
};

export const isABTestExposureEvent = (event: AnalyticsEvent): event is ABTestExposureEvent => {
  return event.eventType === 'ab_test_exposure';
};

export const isErrorEvent = (event: AnalyticsEvent): event is ErrorEvent => {
  return event.eventType === 'error';
};

/**
 * Analytics State Management Types
 */
export interface AnalyticsState {
  readonly isInitialized: boolean;
  readonly sessionId: string;
  readonly userId?: string;
  readonly consents: ConsentManagement;
  readonly queuedEvents: readonly AnalyticsEvent[];
  readonly lastFlush: number;
  readonly errorCount: number;
}

export interface AnalyticsAction {
  readonly type: 'INITIALIZE' | 'TRACK' | 'IDENTIFY' | 'RESET' | 'FLUSH' | 'ERROR' | 'UPDATE_CONSENT';
  readonly payload?: any;
}

/**
 * Integration-Specific Types
 */
export interface GoogleAnalyticsConfig extends AnalyticsConfig {
  readonly measurementId: string;
  readonly customDimensions?: Record<string, number>;
  readonly customMetrics?: Record<string, number>;
}

export interface MixpanelConfig extends AnalyticsConfig {
  readonly projectToken: string;
  readonly enablePersistence?: boolean;
  readonly superProperties?: Record<string, any>;
}

export interface SegmentConfig extends AnalyticsConfig {
  readonly writeKey: string;
  readonly integrations?: Record<string, any>;
}