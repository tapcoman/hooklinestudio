#!/usr/bin/env tsx

import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "../db";
import { logger } from "../config/logger";
import { validateEnvironment } from "../config/env-validation";
import path from "path";

async function runMigration() {
  try {
    console.log("=== Railway Pre-deployment Migration ===");
    console.log("Starting database migration...");
    
    // Validate environment before running migrations
    console.log("Validating environment variables...");
    const env = validateEnvironment();
    console.log("Environment validation successful");
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    console.log("DATABASE_URL is configured");
    
    // Test database connectivity first, but handle Railway's internal URL timing issues
    console.log("Testing database connectivity...");
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Simple connectivity test using sql`` template
        const { sql } = await import("drizzle-orm");
        await db.execute(sql`SELECT 1 as test`);
        console.log("Database connectivity test passed");
        break;
      } catch (connectError) {
        retryCount++;
        console.warn(`Database connectivity test failed (attempt ${retryCount}/${maxRetries}):`, connectError);
        
        // Check if this is Railway's internal URL connection refused error
        const errorMessage = connectError instanceof Error ? connectError.message : String(connectError);
        const isRailwayInternalError = errorMessage.includes('postgres.railway.internal') && 
                                     errorMessage.includes('ECONNREFUSED');
        
        if (isRailwayInternalError && retryCount < maxRetries) {
          console.log(`Railway internal database URL not ready yet, waiting 5 seconds before retry ${retryCount + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        if (retryCount >= maxRetries) {
          // For Railway deployment, continue with migration even if connectivity test fails
          // The database might be accessible for migrations even if the websocket test fails
          if (process.env.RAILWAY_ENVIRONMENT) {
            console.warn("Skipping connectivity test for Railway deployment - proceeding with migration");
            console.warn("Railway internal URLs may not be accessible during pre-deployment");
            break;
          } else {
            throw new Error(`Database connection failed after ${maxRetries} attempts: ${errorMessage}`);
          }
        }
      }
    }
    
    // Resolve migrations folder path from project root
    const migrationsPath = path.resolve(process.cwd(), "migrations");
    console.log(`Using migrations folder: ${migrationsPath}`);
    
    // Check if migrations folder exists
    const fs = await import('fs');
    if (!fs.existsSync(migrationsPath)) {
      throw new Error(`Migrations folder not found: ${migrationsPath}`);
    }
    
    logger.info("Starting database migration...");
    
    // Retry migration execution in case of transient Railway connectivity issues
    let migrationRetryCount = 0;
    const maxMigrationRetries = 3;
    
    while (migrationRetryCount < maxMigrationRetries) {
      try {
        await migrate(db, { migrationsFolder: migrationsPath });
        console.log("Database migration completed successfully");
        console.log("=== Migration Complete ===");
        logger.info("Database migration completed successfully");
        break;
      } catch (migrationError) {
        migrationRetryCount++;
        const errorMessage = migrationError instanceof Error ? migrationError.message : String(migrationError);
        
        console.warn(`Migration attempt ${migrationRetryCount}/${maxMigrationRetries} failed:`, errorMessage);
        
        // Check for Railway internal connectivity issues
        const isRailwayConnectivity = errorMessage.includes('postgres.railway.internal') || 
                                    errorMessage.includes('ECONNREFUSED') ||
                                    errorMessage.includes('connection refused');
        
        if (isRailwayConnectivity && migrationRetryCount < maxMigrationRetries) {
          console.log(`Railway database connectivity issue detected, waiting 10 seconds before retry ${migrationRetryCount + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
        
        if (migrationRetryCount >= maxMigrationRetries) {
          throw migrationError;
        }
      }
    }
    process.exit(0);
  } catch (error) {
    console.error("=== Migration Failed ===");
    console.error("Database migration failed:");
    console.error("Error details:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Log additional context
    console.error("Environment variables check:");
    console.error("- NODE_ENV:", process.env.NODE_ENV);
    console.error("- DATABASE_URL present:", !!process.env.DATABASE_URL);
    console.error("- RAILWAY_ENVIRONMENT:", process.env.RAILWAY_ENVIRONMENT || "not set");
    console.error("- Current working directory:", process.cwd());
    
    logger.error("Database migration failed", error instanceof Error ? error : new Error(String(error)));
    
    // In Railway pre-deployment, we must exit with non-zero to stop deployment
    console.error("Exiting with error code 1 to prevent deployment with failed migration");
    process.exit(1);
  }
}

runMigration();