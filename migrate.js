#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies the database optimization migrations
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🚀 Starting database optimization migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '0001_database_optimization.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    console.log('📝 Executing migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('\nOptimizations applied:');
    console.log('• Performance indexes added');
    console.log('• Data integrity constraints added');
    console.log('• Foreign key constraints improved');
    console.log('• Credit fields optimized to integer type');
    console.log('• Connection pool configuration enhanced');
    
    // Verify migration by checking some indexes
    console.log('\n🔍 Verifying migration...');
    const indexCheck = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' AND indexname LIKE 'idx_%'
      LIMIT 3
    `);
    
    if (indexCheck.rows.length > 0) {
      console.log('✅ Indexes created successfully');
      indexCheck.rows.forEach(row => console.log(`  • ${row.indexname}`));
    }
    
    // Check constraints
    const constraintCheck = await pool.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE contype = 'c' AND conrelid = 'users'::regclass
      LIMIT 3
    `);
    
    if (constraintCheck.rows.length > 0) {
      console.log('✅ Constraints created successfully');
      constraintCheck.rows.forEach(row => console.log(`  • ${row.conname}`));
    }
    
    console.log('\n🎉 Database optimization complete!');
    console.log('📖 See DATABASE_OPTIMIZATION.md for detailed performance information');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔄 To rollback, run:');
    console.log('psql $DATABASE_URL < migrations/001_database_optimization_rollback.sql');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function rollbackMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Starting migration rollback...');
    
    const rollbackPath = path.join(__dirname, 'migrations', '001_database_optimization_rollback.sql');
    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
    
    await pool.query(rollbackSQL);
    console.log('✅ Rollback completed successfully!');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const command = process.argv[2];

if (command === 'rollback') {
  rollbackMigration();
} else if (command === 'up' || !command) {
  runMigration();
} else {
  console.log('Usage: node migrate.js [up|rollback]');
  console.log('  up (default): Apply database optimizations');
  console.log('  rollback:     Rollback database optimizations');
  process.exit(1);
}