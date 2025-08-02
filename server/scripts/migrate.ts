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
    
    // Test database connectivity first
    console.log("Testing database connectivity...");
    try {
      // Simple connectivity test
      await db.execute({ sql: "SELECT 1 as test", args: [] });
      console.log("Database connectivity test passed");
    } catch (connectError) {
      console.error("Database connectivity test failed:", connectError);
      throw new Error(`Database connection failed: ${connectError instanceof Error ? connectError.message : String(connectError)}`);
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
    
    await migrate(db, { migrationsFolder: migrationsPath });
    
    console.log("Database migration completed successfully");
    console.log("=== Migration Complete ===");
    logger.info("Database migration completed successfully");
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