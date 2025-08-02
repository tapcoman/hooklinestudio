import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon serverless, but handle Railway's connectivity timing
neonConfig.webSocketConstructor = ws;

// For Railway deployments, add more aggressive connection retry and timeout settings
if (process.env.RAILWAY_ENVIRONMENT) {
  neonConfig.wsProxy = (host) => {
    // For Railway internal URLs, add retry logic
    if (host.includes('railway.internal')) {
      console.log(`Connecting to Railway internal database: ${host}`);
    }
    return `${host}`;
  };
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Validate database URL format and security
const dbUrl = new URL(process.env.DATABASE_URL);
if (dbUrl.protocol !== 'postgresql:' && dbUrl.protocol !== 'postgres:') {
  throw new Error("DATABASE_URL must use postgresql:// protocol");
}

// Ensure SSL is required for production
if (process.env.NODE_ENV === 'production' && !dbUrl.searchParams.has('sslmode')) {
  dbUrl.searchParams.set('sslmode', 'require');
}

// Optimized connection pool configuration for production performance
// Special handling for Railway's internal URLs and timing issues
const isRailwayEnvironment = !!process.env.RAILWAY_ENVIRONMENT;
const isRailwayInternalUrl = process.env.DATABASE_URL?.includes('railway.internal');

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 20 : 15, // Reduced max connections for Railway stability
  min: isRailwayEnvironment ? 0 : 2, // No minimum connections for Railway to reduce connection pressure
  idleTimeoutMillis: isRailwayEnvironment ? 30000 : 60000, // Shorter idle timeout for Railway
  connectionTimeoutMillis: isRailwayInternalUrl ? 15000 : 5000, // Longer timeout for Railway internal URLs
  statementTimeout: 20000, // Shorter statement timeout
  query_timeout: 20000, // Shorter query timeout
  acquireTimeoutMillis: isRailwayInternalUrl ? 30000 : 10000, // Railway-optimized acquire timeout
  createTimeoutMillis: isRailwayInternalUrl ? 15000 : 5000, // Railway-optimized create timeout
  destroyTimeoutMillis: 3000, // Faster destroy timeout
  reapIntervalMillis: 2000, // More frequent cleanup for Railway
  createRetryIntervalMillis: isRailwayInternalUrl ? 2000 : 500, // Slower retries for Railway
  propagateCreateError: false, // Don't crash if initial connection fails
  // Railway-specific optimizations
  allowExitOnIdle: isRailwayEnvironment, // Allow process to exit when all clients are idle
  maxUses: isRailwayEnvironment ? 7500 : 10000, // Rotate connections more frequently on Railway
  application_name: `hooklinestudio-${process.env.RAILWAY_ENVIRONMENT || 'local'}`
});

export const db = drizzle({ client: pool, schema });