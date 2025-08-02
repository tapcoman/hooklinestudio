import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

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
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 30 : 20, // More connections in production
  min: 5, // Minimum number of clients in the pool
  idleTimeoutMillis: 60000, // Close idle clients after 60 seconds (increased for better connection reuse)
  connectionTimeoutMillis: 3000, // Return an error after 3 seconds if connection could not be established
  statementTimeout: 30000, // Cancel queries after 30 seconds
  query_timeout: 30000, // Query timeout
  acquireTimeoutMillis: 60000, // How long to wait for a connection from the pool
  createTimeoutMillis: 3000, // How long to wait when creating a new client
  destroyTimeoutMillis: 5000, // How long to wait when destroying a client
  reapIntervalMillis: 1000, // How often to check for idle clients to destroy
  createRetryIntervalMillis: 200, // How long to wait before retrying to create a connection
  propagateCreateError: false // Don't crash if initial connection fails
});

export const db = drizzle({ client: pool, schema });