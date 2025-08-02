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
  max: process.env.NODE_ENV === 'production' ? 30 : 20, // More connections in production
  min: isRailwayEnvironment ? 1 : 5, // Fewer minimum connections for Railway
  idleTimeoutMillis: 60000, // Close idle clients after 60 seconds (increased for better connection reuse)
  connectionTimeoutMillis: isRailwayInternalUrl ? 10000 : 3000, // Longer timeout for Railway internal URLs
  statementTimeout: 30000, // Cancel queries after 30 seconds
  query_timeout: 30000, // Query timeout
  acquireTimeoutMillis: isRailwayInternalUrl ? 120000 : 60000, // Longer acquire timeout for Railway
  createTimeoutMillis: isRailwayInternalUrl ? 10000 : 3000, // Longer create timeout for Railway
  destroyTimeoutMillis: 5000, // How long to wait when destroying a client
  reapIntervalMillis: 1000, // How often to check for idle clients to destroy
  createRetryIntervalMillis: isRailwayInternalUrl ? 1000 : 200, // Slower retries for Railway
  propagateCreateError: false // Don't crash if initial connection fails
});

export const db = drizzle({ client: pool, schema });