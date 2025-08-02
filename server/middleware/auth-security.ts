import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password reset (stricter)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Account lockout tracking (in production, use Redis)
const loginAttempts = new Map<string, { attempts: number; lastAttempt: Date; lockedUntil?: Date }>();

export function trackLoginAttempt(email: string, success: boolean) {
  const key = email.toLowerCase();
  const now = new Date();
  
  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(key);
    return { locked: false };
  }
  
  const record = loginAttempts.get(key) || { attempts: 0, lastAttempt: now };
  record.attempts += 1;
  record.lastAttempt = now;
  
  // Lock account after 5 failed attempts for 15 minutes
  if (record.attempts >= 5) {
    record.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
  }
  
  loginAttempts.set(key, record);
  
  return {
    locked: record.lockedUntil ? now < record.lockedUntil : false,
    attempts: record.attempts,
    lockedUntil: record.lockedUntil
  };
}

export function isAccountLocked(email: string): boolean {
  const record = loginAttempts.get(email.toLowerCase());
  if (!record?.lockedUntil) return false;
  
  const now = new Date();
  if (now >= record.lockedUntil) {
    // Lock expired, clean it up
    loginAttempts.delete(email.toLowerCase());
    return false;
  }
  
  return true;
}

// Middleware to check for suspicious activity
export function suspiciousActivityCheck(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.get('User-Agent');
  const forwarded = req.get('X-Forwarded-For');
  
  // Log suspicious patterns (implement real logging in production)
  if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) {
    console.warn(`Suspicious auth attempt from ${req.ip}, UA: ${userAgent}`);
  }
  
  next();
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const weakPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'password1', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}