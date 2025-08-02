-- Database Optimization Migration
-- Adds indexes, constraints, and optimizes data types for better performance
-- This migration is backwards compatible

BEGIN;

-- =============================================================================
-- STEP 1: Add Performance Indexes
-- =============================================================================

-- Users table indexes for frequent lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Hook generations table indexes for user queries and analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hook_generations_user_id ON hook_generations(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hook_generations_created_at ON hook_generations(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hook_generations_platform ON hook_generations(platform);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hook_generations_user_platform ON hook_generations(user_id, platform);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hook_generations_user_created ON hook_generations(user_id, created_at);

-- Favorite hooks table indexes for user favorites
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorite_hooks_user_id ON favorite_hooks(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorite_hooks_created_at ON favorite_hooks(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorite_hooks_user_created ON favorite_hooks(user_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorite_hooks_generation_id ON favorite_hooks(generation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorite_hooks_unique_user_generation ON favorite_hooks(user_id, generation_id);

-- Recent hooks table indexes for novelty checking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_recent_hooks_user_id ON user_recent_hooks(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_recent_hooks_created_at ON user_recent_hooks(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_recent_hooks_user_created ON user_recent_hooks(user_id, created_at);

-- =============================================================================
-- STEP 2: Add Data Integrity Constraints
-- =============================================================================

-- Email format validation constraint
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Safety level constraint
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS safety_values 
CHECK (safety IN ('family-friendly', 'standard', 'edgy'));

-- Subscription status constraint
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS subscription_status_values 
CHECK (subscription_status IN ('free', 'active', 'canceled', 'past_due', 'trialing', 'unpaid'));

-- Subscription plan constraint
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS subscription_plan_values 
CHECK (subscription_plan IN ('free', 'starter', 'creator', 'pro', 'teams'));

-- Positive generations constraint
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS positive_generations 
CHECK (pro_generations_used >= 0 AND draft_generations_used >= 0);

-- Platform constraint for hook generations
ALTER TABLE hook_generations 
ADD CONSTRAINT IF NOT EXISTS platform_values 
CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'twitter', 'linkedin'));

-- Objective constraint for hook generations
ALTER TABLE hook_generations 
ADD CONSTRAINT IF NOT EXISTS objective_values 
CHECK (objective IN ('watch_time', 'shares', 'saves', 'ctr', 'engagement', 'conversions'));

-- Model type constraint for hook generations
ALTER TABLE hook_generations 
ADD CONSTRAINT IF NOT EXISTS model_type_values 
CHECK (model_type IN ('gpt-4o', 'gpt-4o-mini'));

-- =============================================================================
-- STEP 3: Improve Foreign Key Constraints with Cascade Options
-- =============================================================================

-- First, drop existing foreign key constraints if they exist
ALTER TABLE hook_generations DROP CONSTRAINT IF EXISTS hook_generations_user_id_users_id_fk;
ALTER TABLE favorite_hooks DROP CONSTRAINT IF EXISTS favorite_hooks_user_id_users_id_fk;
ALTER TABLE favorite_hooks DROP CONSTRAINT IF EXISTS favorite_hooks_generation_id_hook_generations_id_fk;
ALTER TABLE user_recent_hooks DROP CONSTRAINT IF EXISTS user_recent_hooks_user_id_users_id_fk;

-- Add improved foreign key constraints with proper cascade behavior
ALTER TABLE hook_generations 
ADD CONSTRAINT hook_generations_user_id_users_id_fk 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE favorite_hooks 
ADD CONSTRAINT favorite_hooks_user_id_users_id_fk 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE favorite_hooks 
ADD CONSTRAINT favorite_hooks_generation_id_hook_generations_id_fk 
FOREIGN KEY (generation_id) REFERENCES hook_generations(id) ON DELETE SET NULL;

ALTER TABLE user_recent_hooks 
ADD CONSTRAINT user_recent_hooks_user_id_users_id_fk 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 4: Data Type Migration for Credit Fields (Backwards Compatible)
-- =============================================================================

-- First, add new integer columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_credits_int INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS used_credits_int INTEGER;

-- Migrate data from varchar to integer columns
UPDATE users 
SET 
  free_credits_int = CASE 
    WHEN free_credits ~ '^[0-9]+$' THEN free_credits::INTEGER 
    ELSE 5 
  END,
  used_credits_int = CASE 
    WHEN used_credits ~ '^[0-9]+$' THEN used_credits::INTEGER 
    ELSE 0 
  END
WHERE free_credits_int IS NULL OR used_credits_int IS NULL;

-- Add NOT NULL constraints and defaults to new columns
ALTER TABLE users ALTER COLUMN free_credits_int SET NOT NULL;
ALTER TABLE users ALTER COLUMN free_credits_int SET DEFAULT 5;
ALTER TABLE users ALTER COLUMN used_credits_int SET NOT NULL;
ALTER TABLE users ALTER COLUMN used_credits_int SET DEFAULT 0;

-- Add positive credits constraint for new columns
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS positive_credits_int 
CHECK (free_credits_int >= 0 AND used_credits_int >= 0);

-- =============================================================================
-- STEP 5: NOT NULL Constraints for Required Foreign Keys
-- =============================================================================

-- Ensure user_id is NOT NULL in all related tables (where it should be required)
UPDATE hook_generations SET user_id = gen_random_uuid() WHERE user_id IS NULL;
ALTER TABLE hook_generations ALTER COLUMN user_id SET NOT NULL;

UPDATE favorite_hooks SET user_id = gen_random_uuid() WHERE user_id IS NULL;
ALTER TABLE favorite_hooks ALTER COLUMN user_id SET NOT NULL;

UPDATE user_recent_hooks SET user_id = gen_random_uuid() WHERE user_id IS NULL;
ALTER TABLE user_recent_hooks ALTER COLUMN user_id SET NOT NULL;

-- =============================================================================
-- STEP 6: Performance Statistics Update
-- =============================================================================

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE hook_generations;
ANALYZE favorite_hooks;
ANALYZE user_recent_hooks;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- These queries can be run to verify the migration was successful
-- Check indexes exist
-- SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE 'idx_%';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'hook_generations' AND indexname LIKE 'idx_%';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'favorite_hooks' AND indexname LIKE 'idx_%';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'user_recent_hooks' AND indexname LIKE 'idx_%';

-- Check constraints exist
-- SELECT conname FROM pg_constraint WHERE contype = 'c' AND conrelid = 'users'::regclass;
-- SELECT conname FROM pg_constraint WHERE contype = 'c' AND conrelid = 'hook_generations'::regclass;

-- Check foreign keys exist with proper cascade options
-- SELECT conname, confdeltype FROM pg_constraint WHERE contype = 'f' AND conrelid IN ('hook_generations'::regclass, 'favorite_hooks'::regclass, 'user_recent_hooks'::regclass);