/**
 * Runtime type validation using Zod for conversion optimization components
 * Provides type-safe validation for critical conversion data and analytics events
 */

import { z } from 'zod';

/**
 * Base validation schemas for conversion components
 */

// Platform validation
export const platformSchema = z.enum(['tiktok', 'instagram', 'youtube', 'all']);

// CTA variant validation
export const ctaVariantSchema = z.enum(['primary', 'secondary', 'platform-specific', 'urgent', 'minimal']);

// Size validation
export const componentSizeSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);

// Color variant validation
export const colorVariantSchema = z.enum(['primary', 'secondary', 'success', 'warning', 'error', 'neutral', 'accent']);

// Urgency level validation
export const urgencyLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Analytics and tracking validation schemas
 */

// Device info validation
export const deviceInfoSchema = z.object({
  userAgent: z.string(),
  platform: z.enum(['desktop', 'mobile', 'tablet']),
  screenResolution: z.tuple([z.number(), z.number()]),
  colorDepth: z.number(),
  timezone: z.string(),
  language: z.string()
});

// Page info validation
export const pageInfoSchema = z.object({
  url: z.string().url(),
  referrer: z.string(),
  title: z.string(),
  path: z.string(),
  queryParams: z.record(z.string())
});

// Analytics context validation
export const analyticsContextSchema = z.object({
  component: z.string(),
  variant: z.string().optional(),
  platform: platformSchema.optional(),
  userId: z.string().optional(),
  sessionId: z.string(),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional()
});

// Conversion event validation
export const conversionEventTypeSchema = z.enum([
  'cta_click',
  'cta_view', 
  'trust_signal_view',
  'urgency_indicator_view',
  'funnel_step',
  'ab_test_exposure',
  'error',
  'performance'
]);

// CTA click event validation
export const ctaClickEventSchema = z.object({
  eventType: z.literal('cta_click'),
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
  deviceInfo: deviceInfoSchema,
  pageInfo: pageInfoSchema,
  properties: z.object({
    ctaId: z.string(),
    ctaVariant: z.string(),
    ctaText: z.string(),
    ctaPosition: z.string(),
    platform: z.string().optional(),
    testVariant: z.string().optional(),
    conversionValue: z.number().optional()
  })
});

// CTA view event validation
export const ctaViewEventSchema = z.object({
  eventType: z.literal('cta_view'),
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
  deviceInfo: deviceInfoSchema,
  pageInfo: pageInfoSchema,
  properties: z.object({
    ctaId: z.string(),
    ctaVariant: z.string(),
    viewDuration: z.number(),
    scrollDepth: z.number(),
    inViewport: z.boolean()
  })
});

// A/B test exposure event validation
export const abTestExposureEventSchema = z.object({
  eventType: z.literal('ab_test_exposure'),
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
  deviceInfo: deviceInfoSchema,
  pageInfo: pageInfoSchema,
  properties: z.object({
    testId: z.string(),
    variantId: z.string(),
    exposureTime: z.number(),
    eligible: z.boolean()
  })
});

// Error event validation
export const errorEventSchema = z.object({
  eventType: z.literal('error'),
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
  deviceInfo: deviceInfoSchema,
  pageInfo: pageInfoSchema,
  properties: z.object({
    errorType: z.string(),
    errorMessage: z.string(),
    stackTrace: z.string(),
    componentName: z.string(),
    recoverable: z.boolean(),
    errorBoundary: z.boolean()
  })
});

/**
 * Component props validation schemas
 */

// Base conversion props validation
export const baseConversionPropsSchema = z.object({
  testId: z.string().optional(),
  className: z.string().optional(),
  'aria-label': z.string().optional(),
  'aria-describedby': z.string().optional(),
  respectReducedMotion: z.boolean().optional()
});

// Interactive CTA props validation
export const interactiveCTAPropsSchema = baseConversionPropsSchema.extend({
  variant: ctaVariantSchema.optional(),
  platform: platformSchema.optional(),
  size: componentSizeSchema.optional(),
  showUrgency: z.boolean().optional(),
  showSocialProof: z.boolean().optional(),
  customText: z.string().optional(),
  onAction: z.function().optional(),
  context: z.string(),
  disabled: z.boolean().optional(),
  loading: z.boolean().optional(),
  abTestVariant: z.string().optional(),
  conversionMetadata: z.record(z.unknown()).optional(),
  enablePrefetch: z.boolean().optional()
});

// Trust signal props validation
export const trustSignalPropsSchema = baseConversionPropsSchema.extend({
  variant: z.enum(['default', 'minimal', 'prominent']).optional(),
  showAnimation: z.boolean().optional(),
  customBadges: z.array(z.object({
    id: z.string(),
    icon: z.any(), // LucideIcon - can't validate function types with Zod
    text: z.string(),
    bgColor: z.string(),
    textColor: z.string(),
    borderColor: z.string(),
    priority: z.number()
  })).optional()
});

// Urgency indicator props validation
export const urgencyIndicatorPropsSchema = baseConversionPropsSchema.extend({
  variant: z.enum(['subtle', 'prominent', 'banner']).optional(),
  level: urgencyLevelSchema.optional(),
  countdownTarget: z.date().optional(),
  showRealTimeUpdates: z.boolean().optional()
});

/**
 * Configuration validation schemas
 */

// A/B test configuration validation
export const abTestConfigSchema = z.object({
  testId: z.string(),
  trafficAllocation: z.number().min(0).max(1),
  variants: z.record(z.object({
    weight: z.number().min(0).max(1),
    config: z.record(z.unknown()),
    name: z.string(),
    description: z.string().optional()
  })),
  successMetrics: z.array(z.string()),
  minSampleSize: z.number().min(1),
  maxDuration: z.number().min(1)
});

// Analytics configuration validation
export const analyticsConfigSchema = z.object({
  apiKey: z.string(),
  endpoint: z.string().url(),
  batchSize: z.number().min(1).max(100),
  flushInterval: z.number().min(1000),
  maxRetries: z.number().min(0).max(10),
  enableAutoTracking: z.boolean(),
  enableConsoleLogging: z.boolean(),
  enableLocalStorage: z.boolean(),
  samplingRate: z.number().min(0).max(1),
  excludeEvents: z.array(z.string()).optional()
});

// Environment configuration validation
export const environmentConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  features: z.object({
    abTesting: z.boolean(),
    realTimeAnalytics: z.boolean(),
    advancedTracking: z.boolean(),
    personalizedCTAs: z.boolean(),
    dynamicUrgency: z.boolean(),
    socialProofAutomation: z.boolean()
  }),
  analytics: z.object({
    enabled: z.boolean(),
    debug: z.boolean(),
    samplingRate: z.number().min(0).max(1)
  }),
  performance: z.object({
    enableProfiling: z.boolean(),
    enableMetrics: z.boolean(),
    batchSize: z.number().min(1)
  })
});

/**
 * Railway environment variables validation
 */
export const railwayEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  VITE_FIREBASE_API_KEY: z.string(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string(),
  VITE_FIREBASE_PROJECT_ID: z.string(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  VITE_FIREBASE_APP_ID: z.string(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_')
});

/**
 * Validation helper functions with comprehensive error handling
 */

export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: string[];
};

/**
 * Validate data against a Zod schema with detailed error reporting
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: {
    throwOnError?: boolean;
    logWarnings?: boolean;
  }
): ValidationResult<T> {
  const { throwOnError = false, logWarnings = true } = options || {};

  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      if (logWarnings) {
        console.warn('[Validation] Validation failed:', errors);
      }
      
      if (throwOnError) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      
      return {
        success: false,
        errors
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    
    if (logWarnings) {
      console.error('[Validation] Validation error:', errorMessage);
    }
    
    if (throwOnError) {
      throw error;
    }
    
    return {
      success: false,
      errors: [errorMessage]
    };
  }
}

/**
 * Specific validation functions for common use cases
 */

export function validateCTAProps(props: unknown): ValidationResult<z.infer<typeof interactiveCTAPropsSchema>> {
  return validateWithSchema(interactiveCTAPropsSchema, props);
}

export function validateAnalyticsEvent(event: unknown): ValidationResult<z.infer<typeof ctaClickEventSchema | typeof ctaViewEventSchema | typeof abTestExposureEventSchema | typeof errorEventSchema>> {
  // Try to determine event type and validate accordingly
  if (typeof event === 'object' && event !== null && 'eventType' in event) {
    const eventType = (event as any).eventType;
    
    switch (eventType) {
      case 'cta_click':
        return validateWithSchema(ctaClickEventSchema, event);
      case 'cta_view':
        return validateWithSchema(ctaViewEventSchema, event);
      case 'ab_test_exposure':
        return validateWithSchema(abTestExposureEventSchema, event);
      case 'error':
        return validateWithSchema(errorEventSchema, event);
      default:
        return {
          success: false,
          errors: [`Unknown event type: ${eventType}`]
        };
    }
  }
  
  return {
    success: false,
    errors: ['Invalid event structure: missing eventType']
  };
}

export function validateEnvironmentConfig(config: unknown): ValidationResult<z.infer<typeof environmentConfigSchema>> {
  return validateWithSchema(environmentConfigSchema, config);
}

export function validateRailwayEnv(env: unknown): ValidationResult<z.infer<typeof railwayEnvSchema>> {
  return validateWithSchema(railwayEnvSchema, env, { 
    throwOnError: true,
    logWarnings: true 
  });
}

/**
 * Type guards using validation
 */

export function isValidPlatform(value: unknown): value is z.infer<typeof platformSchema> {
  return validateWithSchema(platformSchema, value).success;
}

export function isValidCTAVariant(value: unknown): value is z.infer<typeof ctaVariantSchema> {
  return validateWithSchema(ctaVariantSchema, value).success;
}

export function isValidAnalyticsEvent(value: unknown): value is z.infer<typeof ctaClickEventSchema | typeof ctaViewEventSchema> {
  return validateAnalyticsEvent(value).success;
}

/**
 * Runtime type assertion helpers
 */

export function assertValidCTAProps(props: unknown): asserts props is z.infer<typeof interactiveCTAPropsSchema> {
  const result = validateCTAProps(props);
  if (!result.success) {
    throw new Error(`Invalid CTA props: ${result.errors.join(', ')}`);
  }
}

export function assertValidAnalyticsEvent(event: unknown): asserts event is z.infer<typeof ctaClickEventSchema | typeof ctaViewEventSchema> {
  const result = validateAnalyticsEvent(event);
  if (!result.success) {
    throw new Error(`Invalid analytics event: ${result.errors.join(', ')}`);
  }
}

/**
 * Default values with validation
 */

export const defaultCTAProps = interactiveCTAPropsSchema.parse({
  variant: 'primary',
  platform: 'all',
  size: 'lg',
  showUrgency: false,
  showSocialProof: false,
  context: 'default',
  disabled: false,
  loading: false,
  enablePrefetch: true
});

export const defaultAnalyticsConfig = analyticsConfigSchema.parse({
  apiKey: '',
  endpoint: 'https://api.hooklinestudio.com/analytics',
  batchSize: 10,
  flushInterval: 5000,
  maxRetries: 3,
  enableAutoTracking: true,
  enableConsoleLogging: false,
  enableLocalStorage: true,
  samplingRate: 1.0
});

/**
 * Validation middleware for React components
 */

export function withPropValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  WrappedComponent: React.ComponentType<T>
): React.ComponentType<T> {
  return function ValidatedComponent(props: T) {
    const result = validateWithSchema(schema, props, {
      logWarnings: true,
      throwOnError: false
    });
    
    if (!result.success) {
      console.warn(`[${WrappedComponent.displayName || WrappedComponent.name}] Props validation failed:`, result.errors);
      
      // In development, show validation errors
      if (process.env.NODE_ENV === 'development') {
        return React.createElement('div', {
          style: { 
            color: 'red', 
            border: '2px solid red', 
            padding: '1rem', 
            margin: '1rem' 
          }
        }, `Validation Error: ${result.errors.join(', ')}`);
      }
    }
    
    return React.createElement(WrappedComponent, props);
  };
}