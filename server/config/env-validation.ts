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