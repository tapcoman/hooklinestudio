#!/usr/bin/env tsx

import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "../db";
import { logger } from "../config/logger";
import { validateEnvironment } from "../config/env-validation";
import path from "path";

/**
 * Railway-specific migration script that handles connectivity issues
 * This script is designed to work with Railway's deployment timing
 */
async function runRailwayMigration() {
  try {
    console.log("=== Railway Migration Script ===");
    console.log("Starting Railway-optimized database migration...");
    
    // Validate environment before running migrations
    console.log("Validating environment variables...");
    const env = validateEnvironment();
    console.log("Environment validation successful");
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    console.log("DATABASE_URL is configured");
    
    // For Railway, wait a bit to ensure database is fully ready
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log("Railway environment detected, waiting for database readiness...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Resolve migrations folder path from project root
    const migrationsPath = path.resolve(process.cwd(), "migrations");
    console.log(`Using migrations folder: ${migrationsPath}`);
    
    // Check if migrations folder exists
    const fs = await import('fs');
    if (!fs.existsSync(migrationsPath)) {
      throw new Error(`Migrations folder not found: ${migrationsPath}`);
    }
    
    logger.info("Starting Railway database migration...");
    
    // Retry migration execution with longer waits for Railway
    let migrationRetryCount = 0;
    const maxMigrationRetries = 5; // More retries for Railway
    
    while (migrationRetryCount < maxMigrationRetries) {
      try {
        console.log(`Migration attempt ${migrationRetryCount + 1}/${maxMigrationRetries}...`);
        await migrate(db, { migrationsFolder: migrationsPath });
        console.log("Database migration completed successfully");
        console.log("=== Railway Migration Complete ===");
        logger.info("Railway database migration completed successfully");
        process.exit(0);
      } catch (migrationError) {
        migrationRetryCount++;
        const errorMessage = migrationError instanceof Error ? migrationError.message : String(migrationError);
        
        console.warn(`Migration attempt ${migrationRetryCount}/${maxMigrationRetries} failed:`, errorMessage);
        
        // Check for Railway internal connectivity issues
        const isRailwayConnectivity = errorMessage.includes('postgres.railway.internal') || 
                                    errorMessage.includes('ECONNREFUSED') ||
                                    errorMessage.includes('connection refused') ||
                                    errorMessage.includes('network error');
        
        if (isRailwayConnectivity && migrationRetryCount < maxMigrationRetries) {
          const waitTime = migrationRetryCount * 5000 + 10000; // Increasing wait times
          console.log(`Railway database connectivity issue detected, waiting ${waitTime/1000} seconds before retry ${migrationRetryCount + 1}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (migrationRetryCount >= maxMigrationRetries) {
          console.error("=== Railway Migration Failed ===");
          console.error("All migration attempts failed. This might be due to:");
          console.error("1. Railway database not yet accessible");
          console.error("2. Invalid DATABASE_URL");
          console.error("3. Network connectivity issues");
          console.error("4. Database service not ready");
          console.error("Final error:", errorMessage);
          throw migrationError;
        }
      }
    }
  } catch (error) {
    console.error("=== Railway Migration Failed ===");
    console.error("Railway migration failed:");
    console.error("Error details:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Log environment context for debugging
    console.error("Environment variables check:");
    console.error("- NODE_ENV:", process.env.NODE_ENV);
    console.error("- DATABASE_URL present:", !!process.env.DATABASE_URL);
    console.error("- RAILWAY_ENVIRONMENT:", process.env.RAILWAY_ENVIRONMENT || "not set");
    console.error("- Current working directory:", process.cwd());
    
    logger.error("Railway migration failed", error instanceof Error ? error : new Error(String(error)));
    
    // For Railway deployment scripts, we should exit with error to prevent deployment
    console.error("Exiting with error code 1");
    process.exit(1);
  }
}

runRailwayMigration();