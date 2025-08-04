interface ErrorInfo {
  message: string;
  stack?: string;
  component?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

class DebugLogger {
  private errors: ErrorInfo[] = [];
  private isEnabled = true;

  constructor() {
    this.setupGlobalErrorHandlers();
    this.logSystemInfo();
  }

  private setupGlobalErrorHandlers() {
    // Capture unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: `Unhandled Error: ${event.message}`,
        stack: event.error?.stack,
        component: 'Global',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        component: 'Promise',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Override console.error to capture React errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      if (message.includes('React') || message.includes('Hook') || message.includes('Component')) {
        this.logError({
          message: `React Error: ${message}`,
          component: 'React',
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      }
      
      originalError.apply(console, args);
    };
  }

  private logSystemInfo() {
    console.group('🔍 DEBUG LOGGER INITIALIZED');
    console.log('📍 URL:', window.location.href);
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔥 Firebase Config:', {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
      appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'
    });
    console.log('🛠️ Environment:', import.meta.env.MODE);
    console.groupEnd();
  }

  logError(error: ErrorInfo) {
    if (!this.isEnabled) return;

    this.errors.push(error);
    
    console.group(`🚨 ERROR #${this.errors.length}`);
    console.error('Message:', error.message);
    console.error('Component:', error.component);
    console.error('Timestamp:', error.timestamp);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    console.groupEnd();

    // Store in localStorage for persistence
    try {
      localStorage.setItem('hookline_debug_errors', JSON.stringify(this.errors));
    } catch (e) {
      console.warn('Failed to store debug errors in localStorage');
    }
  }

  logInfo(message: string, component?: string, data?: any) {
    if (!this.isEnabled) return;

    console.group(`ℹ️ INFO: ${component || 'App'}`);
    console.log('Message:', message);
    if (data) {
      console.log('Data:', data);
    }
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  logComponentMount(componentName: string) {
    this.logInfo(`Component mounted`, componentName);
  }

  logComponentError(componentName: string, error: Error) {
    this.logError({
      message: `Component Error in ${componentName}: ${error.message}`,
      stack: error.stack,
      component: componentName,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('hookline_debug_errors');
    console.log('🧹 Debug errors cleared');
  }

  enable() {
    this.isEnabled = true;
    console.log('🔍 Debug logger enabled');
  }

  disable() {
    this.isEnabled = false;
    console.log('🔇 Debug logger disabled');
  }
}

export const debugLogger = new DebugLogger();

// Global access for browser console
(window as any).debugLogger = debugLogger;