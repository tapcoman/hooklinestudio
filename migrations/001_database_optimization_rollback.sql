-- Rollback Migration for Database Optimization
-- This script safely removes the optimization changes if needed
-- WARNING: Only run this if you need to rollback the optimization changes

BEGIN;

-- =============================================================================
-- STEP 1: Remove Performance Indexes
-- =============================================================================

-- Users table indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_users_email;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_firebase_uid;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_stripe_customer_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_subscription_status;

-- Hook generations table indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_hook_generations_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_hook_generations_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_hook_generations_platform;
DROP INDEX CONCURRENTLY IF EXISTS idx_hook_generations_user_platform;
DROP INDEX CONCURRENTLY IF EXISTS idx_hook_generations_user_created;

-- Favorite hooks table indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_favorite_hooks_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_favorite_hooks_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_favorite_hooks_user_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_favorite_hooks_generation_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_favorite_hooks_unique_user_generation;

-- Recent hooks table indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_user_recent_hooks_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_user_recent_hooks_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_user_recent_hooks_user_created;

-- =============================================================================
-- STEP 2: Remove Data Integrity Constraints
-- =============================================================================

-- Users table constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS email_format;
ALTER TABLE users DROP CONSTRAINT IF EXISTS safety_values;
ALTER TABLE users DROP CONSTRAINT IF EXISTS subscription_status_values;
ALTER TABLE users DROP CONSTRAINT IF EXISTS subscription_plan_values;
ALTER TABLE users DROP CONSTRAINT IF EXISTS positive_generations;
ALTER TABLE users DROP CONSTRAINT IF EXISTS positive_credits_int;

-- Hook generations table constraints
ALTER TABLE hook_generations DROP CONSTRAINT IF EXISTS platform_values;
ALTER TABLE hook_generations DROP CONSTRAINT IF EXISTS objective_values;
ALTER TABLE hook_generations DROP CONSTRAINT IF EXISTS model_type_values;

-- =============================================================================
-- STEP 3: Restore Original Foreign Key Constraints
-- =============================================================================

-- Remove the improved foreign key constraints
ALTER TABLE hook_generations DROP CONSTRAINT IF EXISTS hook_generations_user_id_users_id_fk;
ALTER TABLE favorite_hooks DROP CONSTRAINT IF EXISTS favorite_hooks_user_id_users_id_fk;
ALTER TABLE favorite_hooks DROP CONSTRAINT IF EXISTS favorite_hooks_generation_id_hook_generations_id_fk;
ALTER TABLE user_recent_hooks DROP CONSTRAINT IF EXISTS user_recent_hooks_user_id_users_id_fk;

-- Add back original foreign key constraints (basic ones without cascade)
ALTER TABLE hook_generations 
ADD CONSTRAINT hook_generations_user_id_users_id_fk 
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE favorite_hooks 
ADD CONSTRAINT favorite_hooks_user_id_users_id_fk 
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE favorite_hooks 
ADD CONSTRAINT favorite_hooks_generation_id_hook_generations_id_fk 
FOREIGN KEY (generation_id) REFERENCES hook_generations(id);

ALTER TABLE user_recent_hooks 
ADD CONSTRAINT user_recent_hooks_user_id_users_id_fk 
FOREIGN KEY (user_id) REFERENCES users(id);

-- =============================================================================
-- STEP 4: Handle Data Type Changes (Optional - Keep New Integer Columns)
-- =============================================================================

-- Note: We keep the new integer columns (free_credits_int, used_credits_int) 
-- but remove their constraints. The original varchar columns remain unchanged.
-- This ensures no data loss while allowing rollback of constraints.

-- Remove constraints on new columns
ALTER TABLE users DROP CONSTRAINT IF EXISTS positive_credits_int;

-- Optionally remove the new columns entirely (UNCOMMENT if you want full rollback)
-- ALTER TABLE users DROP COLUMN IF EXISTS free_credits_int;
-- ALTER TABLE users DROP COLUMN IF EXISTS used_credits_int;

-- =============================================================================
-- STEP 5: Remove NOT NULL Constraints if needed
-- =============================================================================

-- Note: We keep the NOT NULL constraints on user_id fields as they are logically required
-- Removing them would allow invalid data. Only uncomment if absolutely necessary.

-- ALTER TABLE hook_generations ALTER COLUMN user_id DROP NOT NULL;
-- ALTER TABLE favorite_hooks ALTER COLUMN user_id DROP NOT NULL;
-- ALTER TABLE user_recent_hooks ALTER COLUMN user_id DROP NOT NULL;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES FOR ROLLBACK
-- =============================================================================

-- Check that indexes are removed
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('users', 'hook_generations', 'favorite_hooks', 'user_recent_hooks') AND indexname LIKE 'idx_%';

-- Check that constraints are removed
-- SELECT conname FROM pg_constraint WHERE contype = 'c' AND conrelid IN ('users'::regclass, 'hook_generations'::regclass);