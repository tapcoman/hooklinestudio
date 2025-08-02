import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { getEnv } from '../config/env-validation';
import { logger } from '../config/logger';

/**
 * Smart caching middleware for different asset types
 * Optimizes caching strategies for conversion components and static assets
 */
export function smartCaching(req: Request, res: Response, next: NextFunction) {
  const env = getEnv();
  const url = req.url;
  const method = req.method;
  
  // Only apply caching to GET requests
  if (method !== 'GET') {
    return next();
  }
  
  // Different caching strategies based on asset type
  if (url.match(/\.(js|css|woff2?|ttf|eot|svg|ico)$/)) {
    // Static assets - Long term caching with immutable flag
    const isHashed = url.includes('-') && url.match(/\.[a-f0-9]{8,}\./);
    
    if (isHashed) {
      // Hashed assets can be cached for a year
      res.setHeader('Cache-Control', env.CDN_CACHE_CONTROL);
      res.setHeader('Expires', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString());
    } else {
      // Non-hashed assets get shorter cache
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    }
    
    // Add ETag for better caching
    res.setHeader('ETag', `"${Date.now()}"`);
    
  } else if (url.match(/\.(png|jpg|jpeg|gif|webp|avif)$/)) {
    // Images - Medium term caching
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
    res.setHeader('Vary', 'Accept'); // For WebP/AVIF content negotiation
    
  } else if (url.startsWith('/api/')) {
    // API endpoints - No caching by default
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    // Exception for static API responses (like public configs)
    if (url.includes('/config') || url.includes('/public')) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    
  } else if (url === '/' || url.includes('.html')) {
    // HTML pages - Short caching with validation
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate'); // 5 minutes
    res.setHeader('Vary', 'Accept-Encoding, User-Agent');
    
  } else {
    // Default for other resources
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
  }
  
  // Add security headers for all cached content
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  next();
}

/**
 * Compression middleware with optimized settings for conversion components
 */
export const optimizedCompression = compression({
  // Compression level (1-9, higher = better compression but slower)
  level: 6,
  
  // Minimum size to compress (avoid compressing small files)
  threshold: 1024,
  
  // Compression filter
  filter: (req: Request, res: Response) => {
    // Don't compress if already compressed
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Don't compress images (they're already compressed)
    if (req.url.match(/\.(png|jpg|jpeg|gif|webp|avif|ico)$/)) {
      return false;
    }
    
    // Don't compress analytics tracking requests (small payloads)
    if (req.url.startsWith('/api/track') || req.url.startsWith('/api/analytics/track')) {
      return false;
    }
    
    // Use compression.filter for everything else
    return compression.filter(req, res);
  },
  
  // Memory level (1-9, higher = more memory but better compression)
  memLevel: 8,
  
  // Window bits (9-15, higher = better compression but more memory)
  windowBits: 15,
  
  // Compression strategy
  strategy: require('zlib').constants.Z_DEFAULT_STRATEGY
});

/**
 * CDN-specific headers for Railway and external CDNs
 */
export function cdnOptimization(req: Request, res: Response, next: NextFunction) {
  const env = getEnv();
  
  // Only apply to static assets
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|webp|avif|woff2?|ttf|eot|svg|ico)$/)) {
    // Railway CDN headers
    res.setHeader('X-Railway-Cache', 'HIT');
    res.setHeader('X-Cache-Status', 'MISS');
    
    // Cloudflare optimization headers (if using Cloudflare)
    res.setHeader('CF-Cache-Status', 'DYNAMIC');
    res.setHeader('CF-Ray', `${Date.now()}-DFW`);
    
    // Generic CDN headers
    res.setHeader('X-Served-By', process.env.RAILWAY_SERVICE_ID || 'origin');
    res.setHeader('X-Cache-Region', process.env.RAILWAY_REGION || 'us-east');
    
    // Prefetch hints for related assets
    if (req.url.includes('conversion-components')) {
      res.setHeader('Link', [
        '</assets/js/analytics.js>; rel=prefetch',
        '</assets/css/conversion-components.css>; rel=preload; as=style'
      ].join(', '));
    }
    
    // Progressive Web App headers for cached assets
    if (req.url.includes('service-worker') || req.url.includes('manifest')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
    }
  }
  
  next();
}

/**
 * Performance monitoring for caching effectiveness
 */
export function cachePerformanceMonitoring(req: Request, res: Response, next: NextFunction) {
  const env = getEnv();
  
  if (env.ENABLE_PERFORMANCE_MONITORING) {
    const startTime = Date.now();
    
    // Track cache hit/miss ratios
    const originalSend = res.send;
    res.send = function(this: Response, data: any) {
      const responseTime = Date.now() - startTime;
      const cacheStatus = res.getHeader('Cache-Control');
      
      // Log cache performance
      logger.debug('Cache performance', {
        url: req.url,
        method: req.method,
        responseTime: `${responseTime}ms`,
        cacheControl: cacheStatus,
        contentLength: res.getHeader('Content-Length'),
        contentEncoding: res.getHeader('Content-Encoding')
      });
      
      // Track conversion component performance specifically
      if (req.url.includes('conversion-components') || req.url.includes('analytics')) {
        logger.info('Conversion asset performance', {
          asset: req.url,
          responseTime: `${responseTime}ms`,
          cached: cacheStatus?.toString().includes('max-age') ? 'yes' : 'no'
        });
      }
      
      return originalSend.call(this, data);
    };
  }
  
  next();
}

/**
 * Browser hints and resource optimization
 */
export function browserOptimization(req: Request, res: Response, next: NextFunction) {
  // Only apply to HTML responses
  if (req.url === '/' || req.url.includes('.html') || (!req.url.includes('.') && req.accepts('html'))) {
    
    // DNS prefetch for external services
    const dnsHints = [
      'https://api.stripe.com',
      'https://js.stripe.com',
      'https://api.openai.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ].map(domain => `<${domain}>; rel=dns-prefetch`).join(', ');
    
    // Preload critical conversion assets
    const preloadHints = [
      '</assets/js/react-vendor.js>; rel=preload; as=script',
      '</assets/js/conversion-components.js>; rel=preload; as=script',
      '</assets/css/main.css>; rel=preload; as=style',
      '</assets/css/conversion-components.css>; rel=preload; as=style'
    ].join(', ');
    
    // Module preload for ES modules
    const modulePreloadHints = [
      '</assets/js/analytics.js>; rel=modulepreload',
      '</assets/js/utilities.js>; rel=modulepreload'
    ].join(', ');
    
    // Combine all hints
    const allHints = [dnsHints, preloadHints, modulePreloadHints].join(', ');
    res.setHeader('Link', allHints);
    
    // Critical resource hints
    res.setHeader('X-Resource-Hints', 'enabled');
    
    // Server timing for performance analysis
    res.setHeader('Server-Timing', `railway;dur=${Date.now()};desc="Railway Processing"`);
  }
  
  next();
}

/**
 * Asset versioning and cache busting
 */
export function assetVersioning(req: Request, res: Response, next: NextFunction) {
  // Add version headers to assets for debugging
  if (req.url.match(/\.(js|css)$/)) {
    res.setHeader('X-Asset-Version', process.env.npm_package_version || '1.0.0');
    res.setHeader('X-Build-Time', process.env.BUILD_TIME || Date.now().toString());
    
    // Add source map headers for development
    if (process.env.NODE_ENV !== 'production' && req.url.includes('.js')) {
      const mapUrl = req.url + '.map';
      res.setHeader('X-SourceMap', mapUrl);
    }
  }
  
  next();
}

/**
 * Complete caching and optimization middleware stack
 */
export function cachingMiddlewareStack() {
  return [
    optimizedCompression,
    smartCaching,
    cdnOptimization,
    browserOptimization,
    assetVersioning,
    cachePerformanceMonitoring
  ];
}