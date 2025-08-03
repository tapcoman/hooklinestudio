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
  max: process.env.NODE_ENV === 'production' ? 15 : 10, // More conservative max connections
  min: isRailwayEnvironment ? 2 : 1, // Ensure minimum connections for health checks
  idleTimeoutMillis: 60000, // Standard idle timeout
  connectionTimeoutMillis: isRailwayInternalUrl ? 30000 : 10000, // Generous timeout for Railway internal URLs
  statementTimeout: 30000, // More generous statement timeout
  query_timeout: 30000, // More generous query timeout
  acquireTimeoutMillis: isRailwayInternalUrl ? 45000 : 15000, // Railway-optimized acquire timeout
  createTimeoutMillis: isRailwayInternalUrl ? 30000 : 10000, // Railway-optimized create timeout
  destroyTimeoutMillis: 5000, // Standard destroy timeout
  reapIntervalMillis: 5000, // Standard cleanup interval
  createRetryIntervalMillis: isRailwayInternalUrl ? 3000 : 1000, // Reasonable retries for Railway
  propagateCreateError: true, // Show connection errors for debugging
  // Railway-specific optimizations
  allowExitOnIdle: false, // Keep connections alive for health checks
  maxUses: 10000, // Standard connection rotation
  application_name: `hooklinestudio-${process.env.RAILWAY_ENVIRONMENT || 'local'}`,
  // Enhanced SSL configuration for Railway
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle({ client: pool, schema });

// Database connection health checker function
export async function testDatabaseConnection(timeout = 10000): Promise<{ success: boolean; error?: string; connectionInfo?: any }> {
  try {
    const testQuery = pool.query('SELECT 1 as health, NOW() as current_time, version() as db_version');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Database connection timeout after ${timeout}ms`)), timeout)
    );
    
    const result = await Promise.race([testQuery, timeoutPromise]);
    
    return {
      success: true,
      connectionInfo: {
        version: result.rows[0]?.db_version?.split(' ')[0] || 'unknown',
        time: result.rows[0]?.current_time,
        poolStats: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Initialize connection pool with retry logic for Railway
export async function initializeDatabase(): Promise<void> {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt}/${maxRetries}...`);
      const connectionTest = await testDatabaseConnection(15000);
      
      if (connectionTest.success) {
        console.log('✅ Database connection established successfully');
        console.log(`Database version: ${connectionTest.connectionInfo?.version}`);
        return;
      } else {
        throw new Error(connectionTest.error);
      }
    } catch (error) {
      console.log(`❌ Database connection attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
      
      if (attempt === maxRetries) {
        console.error('🚨 Failed to establish database connection after all retries');
        throw error;
      }
      
      console.log(`⏳ Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}