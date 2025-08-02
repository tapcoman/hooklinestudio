import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { getEnv } from '../config/env-validation';
import { logger } from '../config/logger';

/**
 * CORS configuration specifically for analytics endpoints
 * Allows cross-origin requests for tracking while maintaining security
 */
export function analyticsCorsSecurity(req: Request, res: Response, next: NextFunction) {
  const env = getEnv();
  
  // Set CORS headers for analytics endpoints
  if (req.path.startsWith('/api/analytics') || req.path.startsWith('/api/track')) {
    const origin = req.get('origin');
    const allowedOrigins = [
      'https://hooklinestudio.com',
      'https://www.hooklinestudio.com',
      'https://app.hooklinestudio.com',
      ...(env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:5000'] : [])
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Session-ID',
      'X-User-ID',
      'X-Analytics-Version'
    ].join(', '));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
}

/**
 * Rate limiting specifically for analytics endpoints
 * Prevents abuse while allowing legitimate tracking
 */
export const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const env = getEnv();
    
    // Different limits based on endpoint type
    if (req.path.includes('/bulk')) {
      return 10; // Bulk endpoints are more restricted
    }
    if (req.path.includes('/track')) {
      return env.ANALYTICS_RATE_LIMIT_REQUESTS; // Use environment config
    }
    return 100; // Default for other analytics endpoints
  },
  message: {
    error: 'Too many analytics requests',
    retryAfter: '15 minutes',
    code: 'ANALYTICS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health') || req.path.startsWith('/ready');
  },
  keyGenerator: (req: Request) => {
    // Use session ID if available, otherwise fall back to IP
    const sessionId = req.get('X-Session-ID');
    const userId = req.get('X-User-ID');
    
    if (userId) return `user:${userId}`;
    if (sessionId) return `session:${sessionId}`;
    return req.ip;
  },
  onLimitReached: (req: Request) => {
    logger.warn('Analytics rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      sessionId: req.get('X-Session-ID'),
      userId: req.get('X-User-ID')
    });
  }
});

/**
 * Privacy compliance middleware for analytics
 * Ensures GDPR/CCPA compliance and IP anonymization
 */
export function analyticsPrivacyCompliance(req: Request, res: Response, next: NextFunction) {
  const env = getEnv();
  
  if (req.path.startsWith('/api/analytics') || req.path.startsWith('/api/track')) {
    // Add privacy headers
    res.setHeader('X-Privacy-Policy', 'https://hooklinestudio.com/privacy');
    res.setHeader('X-Data-Retention', `${env.DATA_RETENTION_DAYS} days`);
    
    // GDPR compliance headers
    if (env.GDPR_COMPLIANCE_ENABLED) {
      res.setHeader('X-GDPR-Compliant', 'true');
      res.setHeader('X-Data-Processing-Lawful-Basis', 'legitimate-interest');
    }
    
    // CCPA compliance headers
    if (env.CCPA_COMPLIANCE_ENABLED) {
      res.setHeader('X-CCPA-Compliant', 'true');
      res.setHeader('X-Do-Not-Sell', 'true');
    }
    
    // IP anonymization
    if (env.ANONYMIZE_IPS) {
      // Store original IP for logging if needed
      req.originalIp = req.ip;
      
      // Anonymize IP for analytics (remove last octet for IPv4)
      if (req.ip && req.ip.includes('.')) {
        const ipParts = req.ip.split('.');
        if (ipParts.length === 4) {
          req.anonymizedIp = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0`;
        }
      }
    }
  }
  
  next();
}

/**
 * Content validation for analytics payloads
 * Ensures data quality and prevents malicious content
 */
export function analyticsContentValidation(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' && (req.path.startsWith('/api/analytics') || req.path.startsWith('/api/track'))) {
    const contentType = req.get('content-type');
    
    // Ensure JSON content type
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Invalid content type',
        expected: 'application/json',
        received: contentType
      });
    }
    
    // Limit payload size for analytics
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSize = 100 * 1024; // 100KB max for analytics payload
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Payload too large',
        maxSize: `${maxSize} bytes`,
        received: `${contentLength} bytes`
      });
    }
  }
  
  next();
}

/**
 * Performance monitoring for analytics endpoints
 * Tracks response times and error rates
 */
export function analyticsPerformanceMonitoring(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/analytics') || req.path.startsWith('/api/track')) {
    const startTime = Date.now();
    
    // Override res.end to measure response time
    const originalEnd = res.end;
    res.end = function(this: Response, ...args: any[]) {
      const responseTime = Date.now() - startTime;
      const env = getEnv();
      
      // Log performance metrics
      if (env.ENABLE_PERFORMANCE_MONITORING) {
        logger.info('Analytics endpoint performance', {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          sessionId: req.get('X-Session-ID'),
          userId: req.get('X-User-ID')
        });
        
        // Alert on slow responses
        if (responseTime > env.PERFORMANCE_THRESHOLD_P95) {
          logger.warn('Slow analytics response detected', {
            path: req.path,
            responseTime: `${responseTime}ms`,
            threshold: `${env.PERFORMANCE_THRESHOLD_P95}ms`
          });
        }
      }
      
      // Add performance headers
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      res.setHeader('X-Served-By', process.env.RAILWAY_SERVICE_ID || 'local');
      
      return originalEnd.apply(this, args);
    };
  }
  
  next();
}

/**
 * Security headers specifically for analytics endpoints
 */
export function analyticsSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/analytics') || req.path.startsWith('/api/track')) {
    // Prevent caching of analytics responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // API-specific headers
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Analytics-Service', 'HookLineStudio');
  }
  
  next();
}

/**
 * Comprehensive analytics middleware stack
 * Combines all analytics-specific security measures
 */
export function analyticsMiddlewareStack() {
  return [
    analyticsCorsSecurity,
    analyticsPrivacyCompliance,
    analyticsContentValidation,
    analyticsPerformanceMonitoring,
    analyticsSecurityHeaders,
    analyticsRateLimit
  ];
}

// Extend Request interface for TypeScript
declare global {
  namespace Express {
    interface Request {
      originalIp?: string;
      anonymizedIp?: string;
    }
  }
}