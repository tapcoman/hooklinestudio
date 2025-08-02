import { Request, Response, NextFunction } from 'express';

export function productionSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Only apply strict headers in production
  if (process.env.NODE_ENV === 'production') {
    
    // Strict Transport Security (HSTS) - Force HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    // Content Security Policy (CSP) - Enhanced for Stripe
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.stripe.com https://api.openai.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'"
    ].join('; '));
    
    // X-Frame-Options - Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-Content-Type-Options - Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)'
    ].join(', '));
  }
  
  // These headers apply in all environments
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  
  next();
}

// Force HTTPS in production
export function forceHTTPS(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('X-Forwarded-Proto') !== 'https') {
    return res.redirect(301, `https://${req.get('Host')}${req.url}`);
  }
  next();
}