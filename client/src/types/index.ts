/**
 * Centralized exports for all TypeScript types and utilities
 * Provides convenient imports for conversion optimization components
 * 
 * @example
 * ```typescript
 * import { 
 *   CTAProps, 
 *   useConversionTracking, 
 *   validateCTAProps 
 * } from '@/types';
 * ```
 */

// Core conversion types
export * from './conversion';
export * from './analytics';
export * from './utils';

// Re-export commonly used types for convenience
export type {
  // Component Props
  CTAProps,
  PrimaryCTAProps,
  PlatformCTAProps,
  UrgentCTAProps,
  MinimalCTAProps,
  SecondaryCTAProps,
  TrustSignalProps,
  UrgencyIndicatorProps,
  
  // Analytics Types
  AnalyticsEvent,
  AnalyticsContext,
  ConversionEvent,
  
  // Hook Return Types
  UseConversionTrackingReturn,
  UseAnalyticsReturn,
  UseABTestingReturn,
  UsePerformanceOptimizationReturn,
  
  // Error Handling
  ConversionError,
  ErrorBoundaryState,
  ErrorFallbackProps,
  
  // Utility Types
  StrictComponentProps,
  ResponsiveValue,
  ComponentSize,
  ColorVariant,
  
  // Configuration Types
  EnvironmentConfig,
  AnalyticsConfig,
  ABTestConfig
} from './conversion';

export type {
  // Event Types
  CTAClickEvent,
  CTAViewEvent,
  ABTestExposureEvent,
  ErrorEvent,
  PerformanceEvent,
  
  // Analytics Configuration
  AnalyticsProvider,
  UserTraits,
  RealTimeMetrics,
  FunnelAnalytics,
  PerformanceMetrics,
  
  // Privacy and Compliance
  PrivacyConfig,
  ConsentManagement
} from './analytics';

export type {
  // Advanced Utility Types
  DeepPartial,
  DeepRequired,
  RequireKeys,
  OptionalKeys,
  ValueOf,
  PickByType,
  OmitByType,
  ArrayElement,
  DeepReadonly,
  Brand,
  
  // Component Composition
  PolymorphicComponentProps,
  ComponentWithRef,
  
  // State Management
  StateWithActions,
  ActionCreator,
  
  // Validation
  ValidationResult,
  ValidationError,
  Validator,
  
  // API Types
  APIResponse,
  APIError,
  HTTPMethod,
  RequestConfig
} from './utils';

/**
 * Platform-specific type guards
 */
export { 
  isValidCTAVariant,
  isValidPlatform,
  isValidUrgencyLevel 
} from './conversion';

/**
 * Analytics type guards
 */
export {
  isCTAClickEvent,
  isCTAViewEvent,
  isABTestExposureEvent,
  isErrorEvent
} from './analytics';

/**
 * Utility type guards
 */
export {
  isRecord,
  isStringArray,
  isNumberArray,
  hasProperty,
  isValidSize,
  isValidColorVariant
} from './utils';

/**
 * Validation functions and schemas
 */
export {
  validateCTAProps,
  validateAnalyticsEvent,
  validateEnvironmentConfig,
  validateRailwayEnv,
  assertValidCTAProps,
  assertValidAnalyticsEvent,
  withPropValidation,
  
  // Schemas for direct use
  platformSchema,
  ctaVariantSchema,
  componentSizeSchema,
  urgencyLevelSchema,
  analyticsContextSchema,
  interactiveCTAPropsSchema,
  trustSignalPropsSchema,
  urgencyIndicatorPropsSchema
} from '../lib/validation';

/**
 * Common constants and defaults
 */
export const SUPPORTED_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'all'] as const;
export const CTA_VARIANTS = ['primary', 'secondary', 'platform-specific', 'urgent', 'minimal'] as const;
export const COMPONENT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export const COLOR_VARIANTS = ['primary', 'secondary', 'success', 'warning', 'error', 'neutral', 'accent'] as const;
export const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Type-safe platform configurations
 */
export const PLATFORM_COLORS = {
  tiktok: '#000000',
  instagram: '#E4405F', 
  youtube: '#FF0000',
  all: '#1E40AF'
} as const;

/**
 * Breakpoint definitions for responsive design
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

/**
 * Default component configurations
 */
export const DEFAULT_CTA_CONFIG = {
  variant: 'primary',
  platform: 'all',
  size: 'lg',
  showUrgency: false,
  showSocialProof: false,
  disabled: false,
  loading: false,
  enablePrefetch: true
} as const;

export const DEFAULT_ANALYTICS_CONFIG = {
  batchSize: 10,
  flushInterval: 5000,
  maxRetries: 3,
  enableAutoTracking: true,
  enableConsoleLogging: false,
  enableLocalStorage: true,
  samplingRate: 1.0
} as const;

/**
 * Error types for better error handling
 */
export const ERROR_TYPES = {
  VALIDATION_ERROR: 'ValidationError',
  NETWORK_ERROR: 'NetworkError',
  TIMEOUT_ERROR: 'TimeoutError',
  PERMISSION_ERROR: 'PermissionError',
  COMPONENT_ERROR: 'ComponentError',
  ANALYTICS_ERROR: 'AnalyticsError'
} as const;

/**
 * Event types for analytics tracking
 */
export const CONVERSION_EVENTS = {
  CTA_CLICK: 'cta_click',
  CTA_VIEW: 'cta_view',
  TRUST_SIGNAL_VIEW: 'trust_signal_view',
  URGENCY_INDICATOR_VIEW: 'urgency_indicator_view',
  FUNNEL_STEP: 'funnel_step',
  AB_TEST_EXPOSURE: 'ab_test_exposure',
  ERROR: 'error',
  PERFORMANCE: 'performance'
} as const;

/**
 * Type-safe environment detection
 */
export const ENVIRONMENT = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isStaging: process.env.NODE_ENV === 'staging', 
  isProduction: process.env.NODE_ENV === 'production',
  current: process.env.NODE_ENV as 'development' | 'staging' | 'production'
} as const;