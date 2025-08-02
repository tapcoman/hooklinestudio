/**
 * Railway-Specific Performance Optimization Middleware
 * Optimizes caching, compression, and CDN delivery for Railway hosting
 * Designed for optimal Core Web Vitals and sub-2s loading times
 */

import type { Request, Response, NextFunction } from 'express';
import compression from 'compression';

interface RailwayOptimizationConfig {
  enableCompression: boolean;
  enableCaching: boolean;
  enableCDN: boolean;
  compressionLevel: number;
  staticFilesCacheDuration: number;
  apiCacheDuration: number;
  enableGzip: boolean;
  enableBrotli: boolean;
}

const defaultConfig: RailwayOptimizationConfig = {
  enableCompression: true,
  enableCaching: true,
  enableCDN: true,
  compressionLevel: 6,
  staticFilesCacheDuration: 31536000, // 1 year
  apiCacheDuration: 300, // 5 minutes
  enableGzip: true,
  enableBrotli: true
};

/**
 * Compression middleware optimized for Railway
 */
export function createCompressionMiddleware(config: Partial<RailwayOptimizationConfig> = {}) {
  const mergedConfig = { ...defaultConfig, ...config };

  return compression({
    level: mergedConfig.compressionLevel,
    threshold: 1024, // Only compress files larger than 1KB
    filter: (req: Request, res: Response) => {
      // Don't compress for IE6
      if (req.headers['user-agent']?.includes('MSIE 6')) {
        return false;
      }

      // Don't compress images or videos (already compressed)
      const contentType = res.getHeader('content-type') as string;
      if (contentType?.startsWith('image/') || contentType?.startsWith('video/')) {
        return false;
      }

      // Compress everything else
      return compression.filter(req, res);
    }
  });
}

/**
 * Caching headers middleware optimized for Railway CDN
 */
export function createCachingMiddleware(config: Partial<RailwayOptimizationConfig> = {}) {
  const mergedConfig = { ...defaultConfig, ...config };

  return (req: Request, res: Response, next: NextFunction) => {
    if (!mergedConfig.enableCaching) {
      return next();
    }

    const path = req.path;
    const isStatic = /\.(js|css|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/i.test(path);
    const isAPI = path.startsWith('/api/');

    if (isStatic) {
      // Aggressive caching for static assets
      res.setHeader('Cache-Control', `public, max-age=${mergedConfig.staticFilesCacheDuration}, immutable`);
      res.setHeader('Expires', new Date(Date.now() + mergedConfig.staticFilesCacheDuration * 1000).toUTCString());
      
      // Enable ETag for efficient caching
      res.setHeader('ETag', `"${Date.now()}"`);
      
      // Vary header for proper CDN caching
      res.setHeader('Vary', 'Accept-Encoding');
      
    } else if (isAPI) {
      // Moderate caching for API responses
      res.setHeader('Cache-Control', `public, max-age=${mergedConfig.apiCacheDuration}, stale-while-revalidate=86400`);
      res.setHeader('Vary', 'Accept-Encoding, Authorization');
      
    } else {
      // HTML pages - use stale-while-revalidate for better UX
      res.setHeader('Cache-Control', 'public, max-age=0, stale-while-revalidate=86400');
      res.setHeader('Vary', 'Accept-Encoding');
    }

    next();
  };
}

/**
 * Security headers middleware with performance considerations
 */
export function createSecurityHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy with performance optimizations
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', csp);
    
    // Security headers that don't impact performance
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // HSTS for production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
  };
}

/**
 * Resource hints middleware for improved loading performance
 */
export function createResourceHintsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only add hints for HTML responses
    if (!req.path.endsWith('.html') && req.path !== '/') {
      return next();
    }

    // DNS prefetch for external resources
    const dnsPrefetchHints = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdnjs.cloudflare.com'
    ].map(origin => `<${origin}>; rel=dns-prefetch`).join(', ');

    // Preconnect for critical resources
    const preconnectHints = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ].map(origin => `<${origin}>; rel=preconnect; crossorigin`).join(', ');

    // Combine all hints
    const linkHeader = [dnsPrefetchHints, preconnectHints].filter(Boolean).join(', ');
    
    if (linkHeader) {
      res.setHeader('Link', linkHeader);
    }

    next();
  };
}

/**
 * Performance monitoring middleware
 */
export function createPerformanceMonitoringMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Capture original res.end
    const originalEnd = res.end;
    
    res.end = function(this: Response, ...args: any[]) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Add server timing header for debugging
      res.setHeader('Server-Timing', `total;dur=${duration}`);
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`[Performance] Slow request: ${req.method} ${req.path} - ${duration}ms`);
      }
      
      // Track metrics (in production, send to monitoring service)
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to monitoring service
        // trackServerPerformance({
        //   method: req.method,
        //   path: req.path,
        //   duration,
        //   statusCode: res.statusCode,
        //   timestamp: startTime
        // });
      }
      
      // Call original end method
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

/**
 * Static file optimization middleware
 */
export function createStaticFileOptimizationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    
    // Handle static file optimizations
    if (/\.(js|css|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/i.test(path)) {
      // Add immutable cache headers for hashed files
      if (/\.[a-f0-9]{8,}\.(js|css|woff2?|png|jpg|jpeg|gif|webp|svg)$/i.test(path)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      
      // Preload critical resources
      if (path.includes('main') || path.includes('vendor') || path.includes('app')) {
        res.setHeader('Link', `<${path}>; rel=preload; as=${getResourceType(path)}`);
      }
    }
    
    next();
  };
}

/**
 * Get resource type for preload hints
 */
function getResourceType(path: string): string {
  if (path.endsWith('.js')) return 'script';
  if (path.endsWith('.css')) return 'style';
  if (/\.(woff2?|ttf|otf)$/i.test(path)) return 'font';
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(path)) return 'image';
  return 'fetch';
}

/**
 * Service Worker header middleware
 */
export function createServiceWorkerMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/sw.js' || req.path === '/service-worker.js') {
      // Prevent caching of service worker
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Set correct MIME type
      res.setHeader('Content-Type', 'application/javascript');
      
      // Service Worker scope
      res.setHeader('Service-Worker-Allowed', '/');
    }
    
    next();
  };
}

/**
 * Railway-specific optimization middleware factory
 */
export function createRailwayOptimizationMiddleware(
  config: Partial<RailwayOptimizationConfig> = {}
) {
  const middlewares = [
    createPerformanceMonitoringMiddleware(),
    createSecurityHeadersMiddleware(),
    createCompressionMiddleware(config),
    createCachingMiddleware(config),
    createResourceHintsMiddleware(),
    createStaticFileOptimizationMiddleware(),
    createServiceWorkerMiddleware()
  ];

  return middlewares;
}

/**
 * Health check endpoint with performance metrics
 */
export function createHealthCheckEndpoint() {
  return (req: Request, res: Response) => {
    const startTime = Date.now();
    
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Performance metrics
    const responseTime = Date.now() - startTime;
    
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Server-Timing', `health;dur=${responseTime}`);
    res.json({
      ...health,
      responseTime
    });
  };
}