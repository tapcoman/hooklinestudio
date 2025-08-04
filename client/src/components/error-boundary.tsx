import React, { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Copy } from "lucide-react";
import { debugLogger } from "@/utils/debugLogger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to debug logger
    debugLogger.logComponentError('ErrorBoundary', error);

    // Call the optional onError callback
    this.props.onError?.(error, errorInfo);

    // Enhanced logging for development
    if (process.env.NODE_ENV === "development") {
      console.group('🚨 ERROR BOUNDARY CAUGHT ERROR');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleReset = () => {
    debugLogger.logInfo('Error boundary reset', 'ErrorBoundary');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleCopyError = () => {
    if (this.state.error) {
      const errorText = `Error: ${this.state.error.toString()}\n\nStack: ${this.state.error.stack}\n\nComponent Stack: ${this.state.errorInfo?.componentStack || 'N/A'}`;
      navigator.clipboard.writeText(errorText).then(() => {
        console.log('Error details copied to clipboard');
      }).catch(() => {
        console.log('Failed to copy error details');
      });
    }
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Something went wrong
                  </h2>
                  <p className="text-slate-600">
                    We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the issue persists.
                  </p>
                </div>

                {this.state.error && (
                  <details className="text-left bg-slate-100 p-4 rounded-lg text-sm">
                    <summary className="cursor-pointer font-medium text-slate-700 mb-2">
                      Error Details
                    </summary>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <strong>Error:</strong>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={this.handleCopyError}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                        {this.state.error.toString()}
                      </pre>
                      {this.state.error.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <strong>💡 Debug Tip:</strong> Check the browser console for more detailed error logs. You can also use <code>window.debugLogger.getErrors()</code> in the console.
                      </div>
                    </div>
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={this.handleReset} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook-based error boundary for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    debugLogger.logComponentError('useErrorHandler', error);
    console.error("Error caught by error handler:", error, errorInfo);
    // Could integrate with error reporting service here
  };
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}