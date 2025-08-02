#!/usr/bin/env tsx

import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "../db";
import { logger } from "../config/logger";
import { validateEnvironment } from "../config/env-validation";

async function runMigration() {
  try {
    // Validate environment before running migrations
    validateEnvironment();
    
    logger.info("Starting database migration...");
    
    await migrate(db, { migrationsFolder: "./migrations" });
    
    logger.info("Database migration completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Database migration failed", error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

runMigration();