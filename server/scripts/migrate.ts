#!/usr/bin/env tsx

import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "../db";
import { logger } from "../config/logger";
import { validateEnvironment } from "../config/env-validation";
import path from "path";

async function runMigration() {
  try {
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
    
    // Resolve migrations folder path from project root
    const migrationsPath = path.resolve(process.cwd(), "migrations");
    console.log(`Using migrations folder: ${migrationsPath}`);
    
    logger.info("Starting database migration...");
    
    await migrate(db, { migrationsFolder: migrationsPath });
    
    console.log("Database migration completed successfully");
    logger.info("Database migration completed successfully");
    process.exit(0);
  } catch (error) {
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
    console.error("- Current working directory:", process.cwd());
    
    logger.error("Database migration failed", error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

runMigration();