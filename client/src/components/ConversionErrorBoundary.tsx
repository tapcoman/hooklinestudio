/**
 * Comprehensive error boundary for conversion optimization components
 * Provides typed exception handling, analytics tracking, and graceful degradation
 */

import React, { Component, ErrorInfo, ReactNode, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Home, BarChart } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import type { 
  ConversionError, 
  ErrorBoundaryState, 
  ErrorFallbackProps,
  AnalyticsContext 
} from '@/types/conversion';
import type { ErrorWithContext } from '@/types/utils';

/**
 * Props for the ConversionErrorBoundary component
 */
interface ConversionErrorBoundaryProps {
  /** Child components to render */
  readonly children: ReactNode;
  /** Fallback component to render when an error occurs */
  readonly fallback?: FC<ErrorFallbackProps>;
  /** Whether to show detailed error information in development */
  readonly showDetails?: boolean;
  /** Component name for analytics tracking */
  readonly componentName?: string;
  /** Analytics context for error tracking */
  readonly analyticsContext?: Partial<AnalyticsContext>;
  /** Callback when an error occurs */
  readonly onError?: (error: ConversionError, errorInfo: ErrorInfo) => void;
  /** Maximum number of automatic retries */
  readonly maxRetries?: number;
  /** Whether to enable automatic recovery */
  readonly enableAutoRecovery?: boolean;
  /** Recovery delay in milliseconds */
  readonly recoveryDelay?: number;
}

/**
 * Enhanced error boundary state with retry tracking
 */
interface EnhancedErrorBoundaryState extends ErrorBoundaryState {
  readonly retryCount: number;
  readonly lastErrorTime: number;
  readonly isRecovering: boolean;
  readonly errorId: string;
}

/**
 * Comprehensive error boundary class with conversion optimization features
 */
export class ConversionErrorBoundary extends Component<
  ConversionErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  private retryTimeoutId?: NodeJS.Timeout;
  private readonly sessionId: string;

  constructor(props: ConversionErrorBoundaryProps) {
    super(props);
    
    this.sessionId = crypto.randomUUID();
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      lastErrorTime: 0,
      isRecovering: false,
      errorId: ''
    };
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    const errorId = crypto.randomUUID();
    const conversionError: ConversionError = {
      ...error,
      name: error.name || 'ConversionError',
      message: error.message || 'An unknown error occurred',
      component: 'Unknown',
      context: {
        component: 'ErrorBoundary',
        sessionId: crypto.randomUUID(),
        timestamp: Date.now()
      },
      recoverable: true,
      errorBoundary: true
    };

    return {
      hasError: true,
      error: conversionError,
      lastErrorTime: Date.now(),
      errorId
    };
  }

  /**
   * Component did catch error handler with comprehensive tracking
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { 
      componentName = 'Unknown',
      analyticsContext = {},
      onError,
      maxRetries = 3,
      enableAutoRecovery = true,
      recoveryDelay = 2000
    } = this.props;

    // Create enhanced conversion error
    const conversionError: ConversionError = {
      ...error,
      name: error.name || 'ConversionError',
      message: error.message || 'An unknown error occurred',
      component: componentName,
      context: {
        component: componentName,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        ...analyticsContext
      },
      recoverable: this.isRecoverableError(error),
      errorBoundary: true,
      stack: error.stack
    };

    // Update state with error info
    this.setState({
      errorInfo,
      error: conversionError
    });

    // Track error in analytics
    this.trackError(conversionError, errorInfo);

    // Call error callback if provided
    if (onError) {
      onError(conversionError, errorInfo);
    }

    // Log error details
    this.logError(conversionError, errorInfo);

    // Attempt auto-recovery if enabled and retries available
    if (enableAutoRecovery && this.state.retryCount < maxRetries && conversionError.recoverable) {
      this.scheduleRecovery(recoveryDelay);
    }
  }

  /**
   * Track error in analytics system
   */
  private trackError(error: ConversionError, errorInfo: ErrorInfo): void {
    try {
      analytics.track('error', {
        errorType: error.name,
        errorMessage: error.message,
        stackTrace: error.stack || '',
        componentName: error.component,
        recoverable: error.recoverable,
        errorBoundary: true,
        retryCount: this.state.retryCount,
        sessionId: this.sessionId,
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        errorBoundaryProps: {
          componentName: this.props.componentName,
          maxRetries: this.props.maxRetries,
          enableAutoRecovery: this.props.enableAutoRecovery
        }
      }, error.context);
    } catch (trackingError) {
      console.error('[ErrorBoundary] Failed to track error:', trackingError);
    }
  }

  /**
   * Log error with appropriate level based on environment
   */
  private logError(error: ConversionError, errorInfo: ErrorInfo): void {
    const errorContext = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        component: error.component,
        recoverable: error.recoverable
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      state: {
        retryCount: this.state.retryCount,
        errorId: this.state.errorId
      },
      props: {
        componentName: this.props.componentName,
        maxRetries: this.props.maxRetries
      }
    };

    if (process.env.NODE_ENV === 'development') {
      console.group(`[ConversionErrorBoundary] Error in ${error.component}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.log('Context:', errorContext);
      console.groupEnd();
    } else {
      console.error('[ConversionErrorBoundary] Error:', errorContext);
    }
  }

  /**
   * Determine if an error is recoverable
   */
  private isRecoverableError(error: Error): boolean {
    // Network errors are usually recoverable
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return true;
    }

    // Timeout errors are recoverable
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return true;
    }

    // Component lifecycle errors might be recoverable
    if (error.message.includes('Cannot read properties of undefined')) {
      return true;
    }

    // Permission errors are typically not recoverable
    if (error.message.includes('Permission denied')) {
      return false;
    }

    // Syntax errors are not recoverable
    if (error.name === 'SyntaxError') {
      return false;
    }

    // Default to recoverable for conversion components
    return true;
  }

  /**
   * Schedule automatic recovery attempt
   */
  private scheduleRecovery(delay: number): void {
    this.setState({ isRecovering: true });

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  /**
   * Handle manual or automatic retry
   */
  private handleRetry = (): void => {
    const { maxRetries = 3 } = this.props;

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    if (this.state.retryCount < maxRetries) {
      // Track retry attempt
      analytics.track('error_boundary_retry', {
        retryCount: this.state.retryCount + 1,
        errorId: this.state.errorId,
        component: this.props.componentName || 'Unknown',
        sessionId: this.sessionId
      });

      // Reset error state and increment retry count
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1,
        isRecovering: false,
        errorId: ''
      });
    } else {
      // Max retries reached
      this.setState({ isRecovering: false });
      
      analytics.track('error_boundary_max_retries', {
        maxRetries,
        errorId: this.state.errorId,
        component: this.props.componentName || 'Unknown',
        sessionId: this.sessionId
      });
    }
  };

  /**
   * Handle navigation to home page
   */
  private handleGoHome = (): void => {
    analytics.track('error_boundary_navigate_home', {
      errorId: this.state.errorId,
      component: this.props.componentName || 'Unknown',
      sessionId: this.sessionId
    });

    window.location.href = '/';
  };

  /**
   * Handle page reload
   */
  private handleReload = (): void => {
    analytics.track('error_boundary_reload', {
      errorId: this.state.errorId,
      component: this.props.componentName || 'Unknown',
      sessionId: this.sessionId
    });

    window.location.reload();
  };

  /**
   * Cleanup timeouts on unmount
   */
  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Render error fallback UI or children
   */
  render(): ReactNode {
    const { children, fallback: CustomFallback, showDetails = false, maxRetries = 3 } = this.props;
    const { hasError, error, errorInfo, retryCount, isRecovering } = this.state;

    if (hasError && error) {
      // Use custom fallback if provided
      if (CustomFallback) {
        return (
          <CustomFallback
            error={error}
            resetError={this.handleRetry}
            context={error.context}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full space-y-6">
            <Alert variant="destructive" className="border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-lg font-semibold">
                Oops! Something went wrong
              </AlertTitle>
              <AlertDescription className="mt-2">
                {error.message || 'An unexpected error occurred while loading this component.'}
              </AlertDescription>
            </Alert>

            {/* Error details in development */}
            {showDetails && process.env.NODE_ENV === 'development' && (
              <Alert className="border-orange-200 bg-orange-50">
                <BarChart className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <div>
                    <strong>Component:</strong> {error.component}
                  </div>
                  <div>
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div>
                    <strong>Retry Count:</strong> {retryCount}/{maxRetries}
                  </div>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Stack trace</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {error.recoverable && retryCount < maxRetries && (
                <Button
                  onClick={this.handleRetry}
                  disabled={isRecovering}
                  className="flex-1"
                  variant="default"
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again ({maxRetries - retryCount} left)
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>

            {/* Additional help text */}
            <div className="text-center text-sm text-gray-600">
              <p>
                If this problem persists, please{' '}
                <a 
                  href="mailto:support@hooklinestudio.com" 
                  className="text-blue-600 hover:underline"
                >
                  contact support
                </a>{' '}
                with error ID: <code className="bg-gray-100 px-1 rounded">{this.state.errorId}</code>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook for creating error boundaries with type safety
 */
export function useErrorBoundary(): {
  captureError: (error: Error, context?: Partial<AnalyticsContext>) => void;
  clearError: () => void;
} {
  const captureError = React.useCallback((error: Error, context?: Partial<AnalyticsContext>): void => {
    const conversionError: ConversionError = {
      ...error,
      name: error.name || 'CapturedError',
      component: context?.component || 'Unknown',
      context: {
        component: context?.component || 'Unknown',
        sessionId: crypto.randomUUID(),
        timestamp: Date.now(),
        ...context
      },
      recoverable: true,
      errorBoundary: false
    };

    // Track the error
    analytics.track('error', conversionError.context);
    
    // Re-throw to trigger error boundary
    throw conversionError;
  }, []);

  const clearError = React.useCallback((): void => {
    // This would be used with a state management solution
    // For now, it's a placeholder
  }, []);

  return { captureError, clearError };
}

/**
 * Higher-order component for adding error boundary to any component
 */
export function withErrorBoundary<P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ConversionErrorBoundaryProps>
): React.ComponentType<P> {
  const WithErrorBoundaryComponent: React.FC<P> = (props) => {
    return (
      <ConversionErrorBoundary
        componentName={WrappedComponent.displayName || WrappedComponent.name}
        {...errorBoundaryProps}
      >
        <WrappedComponent {...props} />
      </ConversionErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * Default error fallback component
 */
export const DefaultErrorFallback: FC<ErrorFallbackProps> = ({ 
  error, 
  resetError,
  context 
}) => {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
        <h3 className="text-lg font-semibold text-red-900">
          Component Error
        </h3>
      </div>
      
      <p className="text-red-800 mb-4">
        {error.message || 'This component encountered an error and cannot be displayed.'}
      </p>
      
      {error.recoverable && (
        <Button
          onClick={resetError}
          variant="outline"
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

/**
 * Async error boundary for handling promise rejections
 */
export function useAsyncErrorBoundary(): (error: Error) => void {
  const { captureError } = useErrorBoundary();
  
  return React.useCallback((error: Error) => {
    captureError(error, {
      component: 'AsyncOperation',
      metadata: { async: true }
    });
  }, [captureError]);
}