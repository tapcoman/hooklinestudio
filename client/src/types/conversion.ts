/**
 * Comprehensive type definitions for conversion optimization components
 * Provides strict typing for CTAs, trust signals, urgency indicators, and analytics
 */

import { ReactNode, MouseEventHandler, FocusEventHandler, ComponentPropsWithoutRef } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Base conversion component props with strict accessibility requirements
 */
export interface BaseConversionProps {
  /** Unique identifier for analytics tracking */
  readonly testId?: string;
  /** CSS class names for styling customization */
  readonly className?: string;
  /** Accessibility label for screen readers */
  readonly 'aria-label'?: string;
  /** Accessibility description */
  readonly 'aria-describedby'?: string;
  /** Whether the component should respect reduced motion preferences */
  readonly respectReducedMotion?: boolean;
}

/**
 * Platform-specific configurations with discriminated union
 */
export type SupportedPlatform = 'tiktok' | 'instagram' | 'youtube' | 'all';

export interface PlatformConfig {
  readonly icon: LucideIcon | React.ComponentType<{ className?: string }>;
  readonly color: string;
  readonly bgColor: string;
  readonly text: string;
  readonly description: string;
}

export type PlatformConfigs = Record<SupportedPlatform, PlatformConfig>;

/**
 * CTA Component Variants with strict discriminated unions
 */
export type CTAVariant = 'primary' | 'secondary' | 'platform-specific' | 'urgent' | 'minimal';
export type CTASize = 'sm' | 'md' | 'lg' | 'xl';

export interface BaseCTAProps extends BaseConversionProps {
  readonly variant?: CTAVariant;
  readonly size?: CTASize;
  readonly platform?: SupportedPlatform;
  readonly customText?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onAction?: () => void | Promise<void>;
  readonly context: string; // Required for analytics tracking
}

/**
 * Primary CTA specific props
 */
export interface PrimaryCTAProps extends BaseCTAProps {
  readonly variant: 'primary';
  readonly showUrgency?: boolean;
  readonly showSocialProof?: boolean;
  readonly urgencyText?: string;
  readonly socialProofItems?: readonly SocialProofItem[];
}

/**
 * Platform-specific CTA props
 */
export interface PlatformCTAProps extends BaseCTAProps {
  readonly variant: 'platform-specific';
  readonly platform: Exclude<SupportedPlatform, 'all'>;
  readonly showPlatformIcon?: boolean;
  readonly platformDescription?: string;
}

/**
 * Urgent CTA props
 */
export interface UrgentCTAProps extends BaseCTAProps {
  readonly variant: 'urgent';
  readonly urgencyLevel?: 'low' | 'medium' | 'high';
  readonly timeRemaining?: string;
  readonly spotsRemaining?: number;
}

/**
 * Minimal CTA props
 */
export interface MinimalCTAProps extends BaseCTAProps {
  readonly variant: 'minimal';
  readonly icon?: LucideIcon;
  readonly showArrow?: boolean;
}

/**
 * Secondary CTA props
 */
export interface SecondaryCTAProps extends BaseCTAProps {
  readonly variant: 'secondary';
  readonly showIcon?: boolean;
  readonly showSocialProof?: boolean;
}

/**
 * Union type for all CTA variants
 */
export type CTAProps = 
  | PrimaryCTAProps 
  | PlatformCTAProps 
  | UrgentCTAProps 
  | MinimalCTAProps 
  | SecondaryCTAProps;

/**
 * Trust Signal Component Types
 */
export type TrustSignalVariant = 'default' | 'minimal' | 'prominent';

export interface TrustSignalProps extends BaseConversionProps {
  readonly variant?: TrustSignalVariant;
  readonly showAnimation?: boolean;
  readonly customBadges?: readonly TrustBadgeConfig[];
}

export interface TrustBadgeConfig {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly text: string;
  readonly bgColor: string;
  readonly textColor: string;
  readonly borderColor: string;
  readonly priority: number;
}

export interface SocialProofItem {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly text: string;
  readonly color: string;
  readonly verified?: boolean;
}

/**
 * Urgency Indicator Types
 */
export type UrgencyVariant = 'subtle' | 'prominent' | 'banner';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface UrgencyIndicatorProps extends BaseConversionProps {
  readonly variant?: UrgencyVariant;
  readonly level?: UrgencyLevel;
  readonly countdownTarget?: Date;
  readonly showRealTimeUpdates?: boolean;
}

export interface CountdownConfig {
  readonly endTime: Date;
  readonly onExpiry?: () => void;
  readonly autoReset?: boolean;
  readonly resetDuration?: number; // in milliseconds
}

export interface ActivityIndicatorConfig {
  readonly activities: readonly ActivityItem[];
  readonly updateInterval: number; // in milliseconds
  readonly showIcon?: boolean;
}

export interface ActivityItem {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly text: string;
  readonly color: string;
  readonly weight: number; // for random selection
}

/**
 * Performance Optimization Types
 */
export interface MemoizedComponentProps {
  readonly shouldMemo?: boolean;
  readonly memoComparison?: (prevProps: any, nextProps: any) => boolean;
}

export interface CallbackConfig {
  readonly dependencies: readonly any[];
  readonly debounceMs?: number;
  readonly throttleMs?: number;
}

/**
 * Event Handler Types with proper typing
 */
export type ConversionEventHandler<T = HTMLElement> = (
  event: React.MouseEvent<T> | React.KeyboardEvent<T>,
  context: AnalyticsContext
) => void | Promise<void>;

export type ConversionFocusHandler<T = HTMLElement> = (
  event: React.FocusEvent<T>,
  context: AnalyticsContext
) => void;

export type ConversionChangeHandler<T = any> = (
  value: T,
  context: AnalyticsContext
) => void;

/**
 * Analytics and Tracking Types
 */
export interface AnalyticsContext {
  readonly component: string;
  readonly variant?: string;
  readonly platform?: SupportedPlatform;
  readonly userId?: string;
  readonly sessionId: string;
  readonly timestamp: number;
  readonly metadata?: Record<string, unknown>;
}

export interface ConversionEvent {
  readonly type: ConversionEventType;
  readonly context: AnalyticsContext;
  readonly properties: Record<string, unknown>;
}

export type ConversionEventType = 
  | 'cta_click'
  | 'cta_view'
  | 'cta_hover'
  | 'trust_signal_view'
  | 'urgency_indicator_view'
  | 'conversion_funnel_step'
  | 'a_b_test_exposure'
  | 'error_boundary_triggered';

/**
 * A/B Testing Types
 */
export interface ABTestConfig<T extends string = string> {
  readonly testId: string;
  readonly variants: Record<T, ABTestVariant>;
  readonly traffic: number; // 0-1
  readonly targeting?: ABTestTargeting;
}

export interface ABTestVariant {
  readonly id: string;
  readonly weight: number;
  readonly config: Record<string, unknown>;
}

export interface ABTestTargeting {
  readonly userSegments?: readonly string[];
  readonly geoTargeting?: readonly string[];
  readonly deviceTypes?: readonly ('mobile' | 'tablet' | 'desktop')[];
}

/**
 * Error Handling Types
 */
export interface ConversionError extends Error {
  readonly component: string;
  readonly context: AnalyticsContext;
  readonly recoverable: boolean;
  readonly errorBoundary?: boolean;
}

export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error?: ConversionError;
  readonly errorInfo?: React.ErrorInfo;
}

export interface ErrorFallbackProps {
  readonly error: ConversionError;
  readonly resetError: () => void;
  readonly context: AnalyticsContext;
}

/**
 * Theme and Responsive Types
 */
export interface ConversionTheme {
  readonly colors: {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly success: string;
    readonly warning: string;
    readonly error: string;
    readonly neutral: string;
  };
  readonly spacing: {
    readonly xs: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
  };
  readonly breakpoints: {
    readonly sm: number;
    readonly md: number;
    readonly lg: number;
    readonly xl: number;
  };
}

export interface ResponsiveConfig<T> {
  readonly sm?: T;
  readonly md?: T;
  readonly lg?: T;
  readonly xl?: T;
  readonly default: T;
}

/**
 * Validation and Runtime Safety Types
 */
export interface ValidationSchema<T> {
  readonly validate: (value: unknown) => value is T;
  readonly transform?: (value: T) => T;
  readonly defaultValue: T;
}

export interface RuntimeValidationConfig {
  readonly enableValidation: boolean;
  readonly throwOnError: boolean;
  readonly logWarnings: boolean;
}

/**
 * Custom Hook Return Types
 */
export interface UseConversionTrackingReturn {
  readonly trackEvent: (event: ConversionEvent) => void;
  readonly trackCTAClick: (context: AnalyticsContext) => void;
  readonly trackView: (component: string, context: AnalyticsContext) => void;
  readonly getAnalyticsSummary: () => AnalyticsSummary;
}

export interface AnalyticsSummary {
  readonly totalEvents: number;
  readonly conversionRate: number;
  readonly topPerformingVariants: readonly VariantPerformance[];
  readonly recentActivity: readonly ConversionEvent[];
}

export interface VariantPerformance {
  readonly variantId: string;
  readonly conversionRate: number;
  readonly totalViews: number;
  readonly totalClicks: number;
}

export interface UseABTestingReturn<T extends string> {
  readonly variant: T;
  readonly isLoading: boolean;
  readonly trackExposure: () => void;
  readonly getVariantConfig: () => Record<string, unknown>;
}

export interface UsePerformanceOptimizationReturn {
  readonly memoizedCallback: <T extends (...args: any[]) => any>(
    callback: T,
    deps: readonly any[]
  ) => T;
  readonly debouncedCallback: <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ) => T;
  readonly throttledCallback: <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ) => T;
}

/**
 * Component State Management Types
 */
export type CTAState = 'idle' | 'hover' | 'loading' | 'success' | 'error';

export interface CTAStateManager {
  readonly state: CTAState;
  readonly setState: (state: CTAState) => void;
  readonly isInteractive: boolean;
  readonly canTransition: (from: CTAState, to: CTAState) => boolean;
}

/**
 * Integration Types for External Services
 */
export interface StripeIntegrationConfig {
  readonly publicKey: string;
  readonly priceId: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
}

export interface FirebaseAnalyticsConfig {
  readonly measurementId: string;
  readonly customEvents: Record<string, any>;
}

/**
 * Type Guards and Utilities
 */
export const isValidCTAVariant = (variant: string): variant is CTAVariant => {
  return ['primary', 'secondary', 'platform-specific', 'urgent', 'minimal'].includes(variant);
};

export const isValidPlatform = (platform: string): platform is SupportedPlatform => {
  return ['tiktok', 'instagram', 'youtube', 'all'].includes(platform);
};

export const isValidUrgencyLevel = (level: string): level is UrgencyLevel => {
  return ['low', 'medium', 'high', 'critical'].includes(level);
};

/**
 * Utility type for creating strict component props
 */
export type StrictComponentProps<T extends Record<string, any>> = {
  readonly [K in keyof T]: T[K];
} & {
  readonly children?: ReactNode;
  readonly key?: React.Key;
};

/**
 * Environment-specific types
 */
export interface EnvironmentConfig {
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly enableAnalytics: boolean;
  readonly enableABTesting: boolean;
  readonly enableErrorReporting: boolean;
  readonly apiBaseUrl: string;
  readonly cdnBaseUrl: string;
}

export type ConversionEnvironment = 'development' | 'staging' | 'production';