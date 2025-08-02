import { z } from "zod";

// Environment variable validation schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default("5000"),
  
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
  
  // Firebase configuration
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().email("FIREBASE_CLIENT_EMAIL must be a valid email"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),
  
  // Third-party services
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  
  // Analytics and Conversion Tracking Configuration
  ANALYTICS_ENABLED: z.string().transform(Boolean).default("true"),
  ANALYTICS_BATCH_SIZE: z.string().transform(Number).pipe(z.number().min(1).max(1000)).default("100"),
  ANALYTICS_FLUSH_INTERVAL: z.string().transform(Number).pipe(z.number().min(1000)).default("10000"),
  ANALYTICS_SAMPLING_RATE: z.string().transform(Number).pipe(z.number().min(0).max(1)).default("1.0"),
  
  // A/B Testing Configuration
  AB_TESTING_ENABLED: z.string().transform(Boolean).default("true"),
  AB_TESTING_DEFAULT_TRAFFIC: z.string().transform(Number).pipe(z.number().min(0).max(1)).default("1.0"),
  AB_TESTING_MIN_SAMPLE_SIZE: z.string().transform(Number).pipe(z.number().min(10)).default("100"),
  
  // Conversion Tracking Settings
  CONVERSION_TRACKING_ENABLED: z.string().transform(Boolean).default("true"),
  CONVERSION_API_ENDPOINT: z.string().default("/api/analytics/track"),
  CONVERSION_RETENTION_DAYS: z.string().transform(Number).pipe(z.number().min(1).max(365)).default("90"),
  
  // Privacy and Compliance
  GDPR_COMPLIANCE_ENABLED: z.string().transform(Boolean).default("true"),
  CCPA_COMPLIANCE_ENABLED: z.string().transform(Boolean).default("true"),
  ANONYMIZE_IPS: z.string().transform(Boolean).default("true"),
  DATA_RETENTION_DAYS: z.string().transform(Number).pipe(z.number().min(30).max(2555)).default("730"),
  
  // Performance Optimization
  ENABLE_COMPRESSION: z.string().transform(Boolean).default("true"),
  CACHE_MAX_AGE: z.string().transform(Number).pipe(z.number().min(0)).default("86400"),
  CDN_CACHE_CONTROL: z.string().default("public, max-age=31536000, immutable"),
  
  // Rate Limiting for Analytics Endpoints
  ANALYTICS_RATE_LIMIT_REQUESTS: z.string().transform(Number).pipe(z.number().min(1)).default("1000"),
  ANALYTICS_RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(z.number().min(60)).default("900"),
  
  // Monitoring and Alerting
  ENABLE_PERFORMANCE_MONITORING: z.string().transform(Boolean).default("true"),
  PERFORMANCE_THRESHOLD_P95: z.string().transform(Number).pipe(z.number().min(100)).default("500"),
  ERROR_RATE_THRESHOLD: z.string().transform(Number).pipe(z.number().min(0).max(1)).default("0.05"),
  
  // Third-party Analytics Integration (Optional)
  GOOGLE_ANALYTICS_MEASUREMENT_ID: z.string().optional(),
  MIXPANEL_PROJECT_TOKEN: z.string().optional(),
  SEGMENT_WRITE_KEY: z.string().optional(),
  
  // Optional environment variables
  REPL_ID: z.string().optional(),
  RAILWAY_ENVIRONMENT: z.string().optional(),
  RAILWAY_PROJECT_ID: z.string().optional(),
  RAILWAY_SERVICE_ID: z.string().optional(),
  
  // Logging and monitoring
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  ENABLE_REQUEST_LOGGING: z.string().transform(Boolean).default("true"),
});

export type AppEnv = z.infer<typeof envSchema>;

let validatedEnv: AppEnv;

export function validateEnvironment(): AppEnv {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    
    // Log successful validation in development
    if (validatedEnv.NODE_ENV === "development") {
      console.log("✅ Environment variables validated successfully");
    }
    
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      console.error("❌ Environment validation failed:");
      missingVars.forEach(err => console.error(`  - ${err}`));
      
      // In production, fail fast
      if (process.env.NODE_ENV === "production") {
        console.error("🚨 Cannot start server with invalid environment configuration");
        process.exit(1);
      }
      
      throw new Error(`Environment validation failed: ${missingVars.join(', ')}`);
    }
    throw error;
  }
}

export function getEnv(): AppEnv {
  if (!validatedEnv) {
    return validateEnvironment();
  }
  return validatedEnv;
}

// Utility functions for common environment checks
export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === "development";
}

export function isRailway(): boolean {
  return !!getEnv().RAILWAY_ENVIRONMENT;
}

export function getLogLevel(): string {
  return getEnv().LOG_LEVEL;
}

// Validate environment on module load
validateEnvironment();