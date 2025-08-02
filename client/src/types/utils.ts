/**
 * Utility types for conversion optimization components
 * Provides reusable type patterns, transformations, and helpers
 */

import { ComponentProps, ComponentType, ReactElement, ReactNode } from 'react';

/**
 * Advanced utility types for strict typing
 */

/**
 * Makes all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes all properties in T required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Makes specific keys K in T required while keeping others optional
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Makes specific keys K in T optional while keeping others required
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Creates a union type from all values in T
 */
export type ValueOf<T> = T[keyof T];

/**
 * Creates a type with only the keys of T that extend U
 */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/**
 * Creates a type with only the keys of T that don't extend U
 */
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * Extracts the type of array elements
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Creates a type where all properties are readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Creates a type that omits never values from a union
 */
export type NonNever<T> = T extends never ? never : T;

/**
 * Creates a branded type for better type safety
 */
export type Brand<T, U> = T & { readonly __brand: U };

/**
 * Conversion-specific utility types
 */

/**
 * Standard sizes used across conversion components
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Standard color variants for conversion components
 */
export type ColorVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'neutral'
  | 'accent';

/**
 * Animation states for conversion components
 */
export type AnimationState = 'idle' | 'entering' | 'active' | 'exiting' | 'disabled';

/**
 * Responsive breakpoint types
 */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Responsive value type that can be a single value or object with breakpoint keys
 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

/**
 * Event handler types with proper generic constraints
 */
export type EventHandler<T extends Event = Event> = (event: T) => void | Promise<void>;

/**
 * Async event handler that handles both sync and async functions
 */
export type AsyncEventHandler<T extends Event = Event> = (event: T) => void | Promise<void>;

/**
 * Component prop types with strict constraints
 */
export type StrictComponentProps<T> = {
  [K in keyof T]: T[K];
} & {
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
};

/**
 * Polymorphic component props for flexible component APIs
 */
export type PolymorphicComponentProps<
  C extends React.ElementType,
  Props = {}
> = Props & 
  Omit<ComponentProps<C>, keyof Props | 'as'> & {
    as?: C;
  };

/**
 * Component with ref forwarding support
 */
export type ComponentWithRef<T, P = {}> = React.ForwardRefExoticComponent<
  P & React.RefAttributes<T>
>;

/**
 * Conversion funnel step type
 */
export interface ConversionStep {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly required: boolean;
  readonly metadata?: Record<string, unknown>;
}

/**
 * A/B test variant configuration
 */
export interface TestVariant<T = Record<string, unknown>> {
  readonly id: string;
  readonly name: string;
  readonly weight: number;
  readonly config: T;
  readonly isControl?: boolean;
}

/**
 * Platform-specific configuration type
 */
export interface PlatformConfig<T = Record<string, unknown>> {
  readonly platform: 'tiktok' | 'instagram' | 'youtube' | 'all';
  readonly config: T;
  readonly enabled: boolean;
}

/**
 * Theme configuration with strict typing
 */
export interface ThemeConfig {
  readonly colors: {
    readonly primary: ColorScale;
    readonly secondary: ColorScale;
    readonly accent: ColorScale;
    readonly neutral: ColorScale;
    readonly success: ColorScale;
    readonly warning: ColorScale;
    readonly error: ColorScale;
  };
  readonly spacing: SpacingScale;
  readonly typography: TypographyScale;
  readonly shadows: ShadowScale;
  readonly borders: BorderScale;
  readonly transitions: TransitionConfig;
}

export interface ColorScale {
  readonly 50: string;
  readonly 100: string;
  readonly 200: string;
  readonly 300: string;
  readonly 400: string;
  readonly 500: string;
  readonly 600: string;
  readonly 700: string;
  readonly 800: string;
  readonly 900: string;
  readonly 950: string;
}

export interface SpacingScale {
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly '2xl': string;
  readonly '3xl': string;
  readonly '4xl': string;
}

export interface TypographyScale {
  readonly fontSizes: Record<ComponentSize, string>;
  readonly lineHeights: Record<ComponentSize, string>;
  readonly fontWeights: {
    readonly normal: number;
    readonly medium: number;
    readonly semibold: number;
    readonly bold: number;
  };
}

export interface ShadowScale {
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly '2xl': string;
}

export interface BorderScale {
  readonly widths: Record<'thin' | 'medium' | 'thick', string>;
  readonly radii: Record<ComponentSize, string>;
}

export interface TransitionConfig {
  readonly duration: {
    readonly fast: string;
    readonly normal: string;
    readonly slow: string;
  };
  readonly easing: {
    readonly ease: string;
    readonly easeIn: string;
    readonly easeOut: string;
    readonly easeInOut: string;
  };
}

/**
 * Validation utility types
 */
export interface ValidationResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors?: readonly ValidationError[];
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export type Validator<T> = (value: unknown) => ValidationResult<T>;

/**
 * Configuration types for different conversion optimization features
 */

/**
 * CTA configuration with strict typing
 */
export interface CTAConfiguration {
  readonly variants: Record<string, CTAVariantConfig>;
  readonly defaultVariant: string;
  readonly trackingEnabled: boolean;
  readonly abTestConfig?: ABTestConfiguration;
}

export interface CTAVariantConfig {
  readonly text: string;
  readonly style: {
    readonly backgroundColor: string;
    readonly textColor: string;
    readonly borderColor?: string;
    readonly borderWidth?: string;
    readonly borderRadius?: string;
    readonly fontSize?: string;
    readonly fontWeight?: string;
    readonly padding?: string;
  };
  readonly animation?: {
    readonly type: 'none' | 'pulse' | 'bounce' | 'shake' | 'glow';
    readonly duration?: string;
    readonly delay?: string;
  };
  readonly icon?: {
    readonly name: string;
    readonly position: 'left' | 'right';
    readonly size?: string;
  };
}

/**
 * A/B testing configuration
 */
export interface ABTestConfiguration {
  readonly testId: string;
  readonly trafficAllocation: number; // 0-1
  readonly variants: Record<string, TestVariantConfig>;
  readonly successMetrics: readonly string[];
  readonly minSampleSize: number;
  readonly maxDuration: number; // in days
}

export interface TestVariantConfig {
  readonly weight: number; // 0-1
  readonly config: Record<string, unknown>;
  readonly name: string;
  readonly description?: string;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfiguration {
  readonly providers: readonly AnalyticsProviderConfig[];
  readonly events: AnalyticsEventConfig;
  readonly privacy: PrivacyConfig;
  readonly performance: PerformanceConfig;
}

export interface AnalyticsProviderConfig {
  readonly name: string;
  readonly enabled: boolean;
  readonly config: Record<string, unknown>;
  readonly events: readonly string[];
}

export interface AnalyticsEventConfig {
  readonly autoTrack: readonly string[];
  readonly customProperties: Record<string, PropertyConfig>;
}

export interface PropertyConfig {
  readonly type: 'string' | 'number' | 'boolean' | 'object';
  readonly required: boolean;
  readonly defaultValue?: unknown;
  readonly validation?: Validator<unknown>;
}

export interface PrivacyConfig {
  readonly respectDoNotTrack: boolean;
  readonly anonymizeIPs: boolean;
  readonly cookieConsent: boolean;
  readonly dataRetentionDays: number;
}

export interface PerformanceConfig {
  readonly batchSize: number;
  readonly flushInterval: number; // in milliseconds
  readonly maxRetries: number;
  readonly timeout: number; // in milliseconds
}

/**
 * Error handling utility types
 */
export interface ErrorWithContext extends Error {
  readonly context: ErrorContext;
  readonly recoverable: boolean;
  readonly timestamp: number;
}

export interface ErrorContext {
  readonly component: string;
  readonly props?: Record<string, unknown>;
  readonly state?: Record<string, unknown>;
  readonly userAgent?: string;
  readonly url?: string;
}

/**
 * Type guards and runtime type checking utilities
 */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
};

export const isNumberArray = (value: unknown): value is number[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
};

export const hasProperty = <T extends string>(
  obj: Record<string, unknown>,
  prop: T
): obj is Record<T, unknown> => {
  return prop in obj;
};

export const isValidSize = (size: string): size is ComponentSize => {
  return ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(size);
};

export const isValidColorVariant = (color: string): color is ColorVariant => {
  return ['primary', 'secondary', 'success', 'warning', 'error', 'neutral', 'accent'].includes(color);
};

/**
 * Helper types for component composition
 */
export type ComponentVariants<T extends Record<string, any>> = {
  [K in keyof T]: {
    [V in keyof T[K]]: T[K][V];
  };
};

export type VariantProps<T extends Record<string, any>> = {
  [K in keyof T]?: keyof T[K];
};

/**
 * Configuration for environment-specific behavior
 */
export interface EnvironmentConfiguration {
  readonly environment: 'development' | 'staging' | 'production';
  readonly features: FeatureFlags;
  readonly analytics: {
    readonly enabled: boolean;
    readonly debug: boolean;
    readonly samplingRate: number;
  };
  readonly performance: {
    readonly enableProfiling: boolean;
    readonly enableMetrics: boolean;
    readonly batchSize: number;
  };
}

export interface FeatureFlags {
  readonly abTesting: boolean;
  readonly realTimeAnalytics: boolean;
  readonly advancedTracking: boolean;
  readonly personalizedCTAs: boolean;
  readonly dynamicUrgency: boolean;
  readonly socialProofAutomation: boolean;
}

/**
 * Hook utility types
 */
export type HookReturnType<T extends (...args: any[]) => any> = ReturnType<T>;

export type HookParameterType<T extends (...args: any[]) => any> = Parameters<T>[0];

/**
 * State management utility types
 */
export interface StateWithActions<S, A> {
  readonly state: S;
  readonly actions: A;
}

export type ActionCreator<T extends string, P = void> = P extends void
  ? { readonly type: T }
  : { readonly type: T; readonly payload: P };

export type ActionsFromCreators<T extends Record<string, (...args: any[]) => any>> = {
  [K in keyof T]: ReturnType<T[K]>;
}[keyof T];

/**
 * Form and input utility types
 */
export interface FormFieldConfig<T = any> {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly validation: Validator<T>;
  readonly defaultValue?: T;
  readonly placeholder?: string;
  readonly label?: string;
  readonly description?: string;
}

export type FormData<T extends Record<string, FormFieldConfig>> = {
  [K in keyof T]: T[K] extends FormFieldConfig<infer U> ? U : never;
};

/**
 * API and networking utility types
 */
export interface APIResponse<T = any> {
  readonly data: T;
  readonly success: boolean;
  readonly message?: string;
  readonly errors?: readonly ValidationError[];
  readonly metadata?: Record<string, unknown>;
}

export interface APIError {
  readonly status: number;
  readonly message: string;
  readonly code: string;
  readonly details?: Record<string, unknown>;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  readonly method: HTTPMethod;
  readonly url: string;
  readonly data?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly retries?: number;
}