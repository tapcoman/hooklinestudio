# Railway Deployment Guide

This guide walks you through deploying Hook Line Studio to Railway, a modern hosting platform optimized for full-stack applications.

## Prerequisites

- Railway account ([sign up here](https://railway.app/))
- Git repository with your code
- Environment variables ready (see below)

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## Manual Deployment Steps

### 1. Create Railway Project

1. Go to [Railway](https://railway.app/) and log in
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository

### 2. Add PostgreSQL Database

1. In your Railway project dashboard, click "New Service"
2. Choose "Database" → "PostgreSQL"
3. Railway will automatically provision a PostgreSQL database
4. The `DATABASE_URL` will be automatically set in your environment

### 3. Configure Environment Variables

In your Railway project settings, add these environment variables:

#### Required Variables
```bash
NODE_ENV=production
PORT=5000

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Optional: Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

#### Railway Automatically Sets
- `DATABASE_URL` - PostgreSQL connection string
- `RAILWAY_ENVIRONMENT` - Railway environment name
- `RAILWAY_PROJECT_ID` - Your project ID
- `RAILWAY_SERVICE_ID` - Your service ID

### 4. Deploy Configuration

Railway uses the included `railway.toml` configuration file:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run railway:build"

[deploy]
startCommand = "npm run railway:start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[env]
NODE_ENV = "production"
PORT = { default = "5000" }
```

### 5. Deploy Your Application

1. Push your code to GitHub
2. Railway will automatically detect changes and deploy
3. Monitor the build process in Railway's dashboard

## Firebase Setup

### Service Account Configuration

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Set the following in Railway:
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_CLIENT_EMAIL`: Service account email
   - `FIREBASE_PRIVATE_KEY`: The entire private key (including headers)

### Firebase Rules

Ensure your Firestore rules allow authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Stripe Configuration

### Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.railway.app/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### Test vs Production

- For testing: Use `sk_test_` keys and test webhook endpoints
- For production: Use `sk_live_` keys and live webhook endpoints

## Database Management

### Automatic Migrations

The deployment process automatically runs database migrations:

```bash
npm run railway:build  # Builds app and runs migrations
```

### Manual Migration

If needed, you can run migrations manually:

```bash
# Connect to Railway PostgreSQL
railway connect

# Or use the CLI
npm run db:migrate
```

### Database Schema

The app uses Drizzle ORM for database management. Schema is defined in `/shared/schema.ts`.

## Monitoring & Health Checks

### Health Endpoints

- `/health` - Complete health check with service status
- `/ready` - Readiness probe for Railway
- `/live` - Liveness probe

### Logging

Railway automatically aggregates logs. The app uses structured JSON logging in production:

```json
{
  "level": "info",
  "message": "Server started",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "service": "hook-line-studio",
  "data": {
    "port": 5000,
    "railway": "production"
  }
}
```

### Monitoring

Railway provides built-in monitoring:
- CPU and memory usage
- Request metrics
- Error tracking
- Deployment history

## Domain Configuration

### Custom Domain

1. In Railway project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Railway handles SSL certificates automatically

### Environment URLs

Railway provides automatic environment URLs:
- Production: `https://your-app.railway.app`
- Preview: `https://your-app-pr-123.railway.app` (for pull requests)

## Scaling & Performance

### Horizontal Scaling

Railway supports horizontal scaling:
1. Go to project settings
2. Increase "Replicas" count
3. Railway handles load balancing automatically

### Resource Limits

Configure resource limits in Railway dashboard:
- Memory: 512MB - 32GB
- CPU: 1 vCPU - 32 vCPUs

### Database Scaling

Railway PostgreSQL can be scaled:
- Storage: Up to 100GB
- Connection pooling available
- Read replicas for high-traffic apps

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Railway dashboard
# Ensure all dependencies are in package.json
npm install
```

#### Database Connection Issues
```bash
# Verify DATABASE_URL is set
# Check PostgreSQL service status
# Ensure migration completed successfully
```

#### Environment Variables
```bash
# Verify all required variables are set
# Check for typos in variable names
# Ensure private keys include newlines
```

### Debug Commands

```bash
# Check health endpoint
curl https://your-app.railway.app/health

# View logs
railway logs

# Connect to database
railway connect
```

### Support

- Railway docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Project issues: GitHub Issues

## Security Considerations

### Environment Variables
- Never commit secrets to Git
- Use Railway's environment variables feature
- Rotate keys regularly

### Headers
The app includes security headers:
- HTTPS enforcement
- CSP headers
- XSS protection
- Frame options

### Database
- Connection uses SSL by default
- Environment-based access control
- Regular backups via Railway

## Cost Optimization

### Free Tier
Railway provides a generous free tier:
- $5/month in usage credits
- Multiple projects
- Automatic sleep for inactive apps

### Production Tips
- Monitor usage in Railway dashboard
- Optimize build cache
- Use appropriate resource limits
- Consider usage-based pricing

## Backup & Recovery

### Database Backups
Railway PostgreSQL includes:
- Automatic daily backups
- Point-in-time recovery
- Manual backup creation

### Code Backups
- Git repository serves as code backup
- Railway maintains deployment history
- Easy rollback to previous deployments

## CI/CD Integration

Railway automatically deploys on Git push. For advanced workflows:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          # Custom deployment logic
          # Tests, linting, etc.
```

## Migration from Other Platforms

### From Vercel/Netlify
1. Export environment variables
2. Update build commands in railway.toml
3. Configure custom domain

### From Heroku
1. Export Heroku config vars: `heroku config`
2. Import to Railway environment
3. Update any Heroku-specific configurations

This completes your Railway deployment setup. Your application should now be running on Railway with full production capabilities!