import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Rate limiting for API endpoints - environment-aware configuration
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Enable rate limiting in all environments but with different limits
});

// Stricter rate limiting for hook generation - environment-aware configuration
export const generateHooksLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // Much stricter limit for production
  message: 'Too many hook generation requests, please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  // Enable rate limiting in all environments but with different limits
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Remove potential XSS and script injection
    const sanitizeString = (str: string): string => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitizeObject(req.body);
  }
  next();
};

// Security headers middleware - disabled CSP in development to eliminate network issues
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production', // Disable CSP in development
  crossOriginEmbedderPolicy: false, // Disable for Vite compatibility
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false // Disable HSTS in development
});

// Validate request size
export const validateRequestSize = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.get('Content-Length');
  if (contentLength && parseInt(contentLength) > 1048576) { // 1MB limit
    return res.status(413).json({ error: 'Request too large' });
  }
  next();
};