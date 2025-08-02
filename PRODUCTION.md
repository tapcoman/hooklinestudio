# Production Deployment Guide

## Authentication & Security Status: ✅ PRODUCTION READY

### Required Environment Variables

**Authentication & Security:**
```bash
SESSION_SECRET=your-256-bit-random-secret-here
COOKIE_DOMAIN=your-domain.com  # Only set in production
NODE_ENV=production

# Firebase Auth (Optional - Enhanced Security)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-service-account-email
```

**Stripe Integration:**
```bash
STRIPE_SECRET_KEY=sk_live_...  # Your live Stripe secret key
VITE_STRIPE_PUBLIC_KEY=pk_live_...  # Your live Stripe publishable key
STRIPE_PRO_PRICE_ID=price_...  # Pro plan price ID from Stripe
STRIPE_TEAMS_PRICE_ID=price_...  # Teams plan price ID from Stripe
```

**Database & AI:**
```bash
DATABASE_URL=your-production-postgres-url
OPENAI_API_KEY=your-openai-api-key
```

### Security Features Implemented

#### Authentication Security ✅
- **Account Lockout**: 5 failed attempts = 15-minute lockout
- **Rate Limiting**: 5 auth attempts per 15 minutes per IP
- **Password Strength**: 8+ characters, mixed case, numbers, special characters
- **Session Security**: Secure cookies, CSRF protection, 7-day expiration
- **Suspicious Activity Detection**: Bot detection, logging of unusual patterns

#### Production Headers ✅
- **HSTS**: Force HTTPS with 1-year max-age
- **CSP**: Content Security Policy with Stripe compatibility
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME sniffing protection
- **Referrer Policy**: Strict origin policy

#### Stripe Integration ✅
- **Payment Processing**: Complete Pro/Teams subscription system
- **Webhook Handling**: Automatic subscription lifecycle management
- **Billing Portal**: Customer self-service portal
- **Security**: PCI-compliant payment handling

### Pre-Deployment Checklist

#### 1. Test Stripe Integration
- [ ] Visit `/billing` and test Pro subscription signup
- [ ] Test Teams subscription signup
- [ ] Verify billing portal access and plan changes
- [ ] Test subscription cancellation flow

#### 2. Test Authentication Security
- [ ] Try weak passwords during registration (should fail)
- [ ] Test account lockout (5 failed login attempts)
- [ ] Verify secure cookies in production environment
- [ ] Test logout and session clearing

#### 3. Database & Performance
- [ ] Verify PostgreSQL connection pooling
- [ ] Test database migrations with `npm run db:push`
- [ ] Monitor session storage and cleanup

#### 4. Security Headers
- [ ] Test CSP compatibility with all features
- [ ] Verify HTTPS redirect works
- [ ] Check all security headers with security scanner

### Deployment Commands

```bash
# Build for production
npm run build

# Push database schema
npm run db:push

# Start production server
NODE_ENV=production npm start
```

### Security Monitoring

The application logs the following security events:
- Failed login attempts with IP addresses
- Successful logins with location info
- Account lockouts and suspicious activity
- Registration attempts from new IPs

### Recommended Production Setup

1. **Load Balancer**: Use HTTPS termination
2. **Database**: PostgreSQL with connection pooling
3. **Monitoring**: Log aggregation for security events
4. **Backup**: Regular database backups
5. **CDN**: Serve static assets from CDN

### Post-Deployment Verification

1. **SSL/TLS**: Verify A+ rating on SSL Labs
2. **Security Headers**: Check with securityheaders.com
3. **Performance**: Test with Lighthouse (90+ scores)
4. **Payment Flow**: Complete end-to-end Stripe transactions
5. **Authentication**: Test login/logout from multiple devices

## Support

For production issues:
1. Check application logs for security events
2. Monitor Stripe dashboard for payment issues
3. Verify database connectivity and session storage
4. Review CSP violations in browser console