#!/usr/bin/env node

/**
 * Database Health Monitoring Script for Railway Deployment
 * Monitors database connectivity, performs health checks, and provides operational insights
 */

import { Pool } from 'pg';

// Configuration
const DB_URL = process.env.DATABASE_URL;
const CHECK_INTERVAL = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'); // 30 seconds
const RETRY_ATTEMPTS = parseInt(process.env.DB_HEALTH_RETRY_ATTEMPTS || '3');
const CONNECTION_TIMEOUT = parseInt(process.env.DB_HEALTH_TIMEOUT || '10000'); // 10 seconds

if (!DB_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Initialize connection pool with health monitoring settings
const pool = new Pool({
  connectionString: DB_URL,
  max: 5, // Minimal pool for health checks
  min: 1,
  connectionTimeoutMillis: CONNECTION_TIMEOUT,
  idleTimeoutMillis: 30000,
  statement_timeout: 20000,
  query_timeout: 20000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Health check queries
const HEALTH_QUERIES = {
  basic: 'SELECT 1 as health_check, NOW() as current_time',
  version: 'SELECT version() as db_version',
  tables: `
    SELECT 
      schemaname, 
      tablename, 
      hasindexes, 
      hasrules, 
      hastriggers 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `,
  connections: `
    SELECT 
      count(*) as total_connections,
      count(*) FILTER (WHERE state = 'active') as active_connections,
      count(*) FILTER (WHERE state = 'idle') as idle_connections
    FROM pg_stat_activity 
    WHERE datname = current_database()
  `,
  tableStats: `
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_tuples,
      n_dead_tup as dead_tuples,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables 
    ORDER BY n_live_tup DESC
    LIMIT 10
  `
};

async function executeHealthCheck(queryName, query, timeout = CONNECTION_TIMEOUT) {
  try {
    const queryPromise = pool.query(query);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Query timeout after ${timeout}ms`)), timeout)
    );
    
    const result = await Promise.race([queryPromise, timeoutPromise]);
    return { success: true, data: result.rows, queryName };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      queryName,
      timestamp: new Date().toISOString()
    };
  }
}

async function performFullHealthCheck() {
  const healthReport = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: {
      environment: process.env.RAILWAY_ENVIRONMENT || 'local',
      projectId: process.env.RAILWAY_PROJECT_ID || 'unknown',
      serviceId: process.env.RAILWAY_SERVICE_ID || 'unknown'
    },
    database: {
      url: DB_URL ? 'SET' : 'NOT_SET',
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    },
    checks: {}
  };

  console.log(`\n🔍 Starting database health check at ${healthReport.timestamp}`);
  console.log(`📍 Environment: ${healthReport.environment} (Railway: ${healthReport.railway.environment})`);

  // Execute health checks
  for (const [name, query] of Object.entries(HEALTH_QUERIES)) {
    console.log(`  ⏳ Running ${name} check...`);
    const result = await executeHealthCheck(name, query);
    
    if (result.success) {
      console.log(`  ✅ ${name} check passed`);
      healthReport.checks[name] = { status: 'success', data: result.data };
      
      // Log specific insights
      if (name === 'basic' && result.data[0]) {
        console.log(`    📅 Database time: ${result.data[0].current_time}`);
      }
      
      if (name === 'version' && result.data[0]) {
        const version = result.data[0].db_version.split(' ')[0];
        console.log(`    🐘 PostgreSQL version: ${version}`);
      }
      
      if (name === 'tables' && result.data.length > 0) {
        console.log(`    📊 Found ${result.data.length} tables in public schema`);
        result.data.forEach(table => {
          console.log(`      - ${table.tablename} (indexes: ${table.hasindexes}, triggers: ${table.hastriggers})`);
        });
      }
      
      if (name === 'connections' && result.data[0]) {
        const conn = result.data[0];
        console.log(`    🔗 Connections - Total: ${conn.total_connections}, Active: ${conn.active_connections}, Idle: ${conn.idle_connections}`);
      }
      
      if (name === 'tableStats' && result.data.length > 0) {
        console.log(`    📈 Top tables by live tuples:`);
        result.data.slice(0, 5).forEach(stat => {
          console.log(`      - ${stat.tablename}: ${stat.live_tuples} live, ${stat.dead_tuples} dead`);
        });
      }
      
    } else {
      console.log(`  ❌ ${name} check failed: ${result.error}`);
      healthReport.checks[name] = { status: 'failed', error: result.error };
    }
  }

  // Overall health assessment
  const successfulChecks = Object.values(healthReport.checks).filter(check => check.status === 'success').length;
  const totalChecks = Object.keys(healthReport.checks).length;
  const healthPercentage = Math.round((successfulChecks / totalChecks) * 100);
  
  healthReport.overall = {
    status: healthPercentage >= 80 ? 'healthy' : healthPercentage >= 50 ? 'degraded' : 'unhealthy',
    successfulChecks,
    totalChecks,
    healthPercentage
  };

  console.log(`\n📊 Health Check Summary:`);
  console.log(`  Status: ${healthReport.overall.status.toUpperCase()}`);
  console.log(`  Success Rate: ${healthPercentage}% (${successfulChecks}/${totalChecks})`);
  console.log(`  Pool Stats: ${healthReport.database.poolStats.totalCount} total, ${healthReport.database.poolStats.idleCount} idle, ${healthReport.database.poolStats.waitingCount} waiting`);

  return healthReport;
}

async function monitorDatabaseHealth() {
  console.log('🚀 Starting Database Health Monitor for Railway');
  console.log(`📊 Check interval: ${CHECK_INTERVAL}ms`);
  console.log(`⏱️ Connection timeout: ${CONNECTION_TIMEOUT}ms`);
  console.log(`🔄 Retry attempts: ${RETRY_ATTEMPTS}`);

  let consecutiveFailures = 0;
  
  while (true) {
    try {
      const healthReport = await performFullHealthCheck();
      
      if (healthReport.overall.status === 'healthy') {
        consecutiveFailures = 0;
        console.log('✅ Database is healthy\n');
      } else {
        consecutiveFailures++;
        console.log(`⚠️ Database health is ${healthReport.overall.status} (failure #${consecutiveFailures})\n`);
        
        if (consecutiveFailures >= RETRY_ATTEMPTS) {
          console.error(`🚨 Database has failed ${consecutiveFailures} consecutive health checks`);
          console.error('🔧 Consider checking Railway database service status');
          
          // In production, you might want to trigger alerts here
          if (process.env.NODE_ENV === 'production') {
            console.error('💀 Exiting due to persistent database connectivity issues');
            process.exit(1);
          }
        }
      }
      
    } catch (error) {
      console.error(`💥 Health check monitor error: ${error.message}`);
      consecutiveFailures++;
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down database health monitor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down database health monitor...');
  await pool.end();
  process.exit(0);
});

// Export for use in other scripts
export { performFullHealthCheck, executeHealthCheck };

// Run monitor if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  monitorDatabaseHealth().catch(error => {
    console.error('💥 Database health monitor crashed:', error);
    process.exit(1);
  });
}