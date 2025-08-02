-- Drizzle Migration: Database Optimization
-- Generated from schema changes for performance improvements

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_firebase_uid" ON "users" ("firebase_uid");
CREATE INDEX IF NOT EXISTS "idx_users_stripe_customer_id" ON "users" ("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_users_subscription_status" ON "users" ("subscription_status");

-- Add indexes for hook_generations table  
CREATE INDEX IF NOT EXISTS "idx_hook_generations_user_id" ON "hook_generations" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_hook_generations_created_at" ON "hook_generations" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_hook_generations_platform" ON "hook_generations" ("platform");
CREATE INDEX IF NOT EXISTS "idx_hook_generations_user_platform" ON "hook_generations" ("user_id","platform");
CREATE INDEX IF NOT EXISTS "idx_hook_generations_user_created" ON "hook_generations" ("user_id","created_at");

-- Add indexes for favorite_hooks table
CREATE INDEX IF NOT EXISTS "idx_favorite_hooks_user_id" ON "favorite_hooks" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_favorite_hooks_created_at" ON "favorite_hooks" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_favorite_hooks_user_created" ON "favorite_hooks" ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "idx_favorite_hooks_generation_id" ON "favorite_hooks" ("generation_id");
CREATE INDEX IF NOT EXISTS "idx_favorite_hooks_unique_user_generation" ON "favorite_hooks" ("user_id","generation_id");

-- Add indexes for user_recent_hooks table
CREATE INDEX IF NOT EXISTS "idx_user_recent_hooks_user_id" ON "user_recent_hooks" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_recent_hooks_created_at" ON "user_recent_hooks" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_user_recent_hooks_user_created" ON "user_recent_hooks" ("user_id","created_at");

-- Add data integrity constraints
ALTER TABLE "users" ADD CONSTRAINT "email_format" CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE "users" ADD CONSTRAINT "safety_values" CHECK ("safety" IN ('family-friendly', 'standard', 'edgy'));
ALTER TABLE "users" ADD CONSTRAINT "subscription_status_values" CHECK ("subscription_status" IN ('free', 'active', 'canceled', 'past_due', 'trialing', 'unpaid'));
ALTER TABLE "users" ADD CONSTRAINT "subscription_plan_values" CHECK ("subscription_plan" IN ('free', 'starter', 'creator', 'pro', 'teams'));
ALTER TABLE "users" ADD CONSTRAINT "positive_generations" CHECK ("pro_generations_used" >= 0 AND "draft_generations_used" >= 0);
ALTER TABLE "users" ADD CONSTRAINT "positive_credits" CHECK ("free_credits" >= 0 AND "used_credits" >= 0);

-- Add platform constraints for hook_generations
ALTER TABLE "hook_generations" ADD CONSTRAINT "platform_values" CHECK ("platform" IN ('tiktok', 'instagram', 'youtube', 'twitter', 'linkedin'));
ALTER TABLE "hook_generations" ADD CONSTRAINT "objective_values" CHECK ("objective" IN ('watch_time', 'shares', 'saves', 'ctr', 'engagement', 'conversions'));
ALTER TABLE "hook_generations" ADD CONSTRAINT "model_type_values" CHECK ("model_type" IN ('gpt-4o', 'gpt-4o-mini'));

-- Alter columns to be NOT NULL where required
ALTER TABLE "hook_generations" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "favorite_hooks" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "user_recent_hooks" ALTER COLUMN "user_id" SET NOT NULL;

-- Update foreign key constraints with CASCADE options
ALTER TABLE "hook_generations" DROP CONSTRAINT IF EXISTS "hook_generations_user_id_users_id_fk";
ALTER TABLE "hook_generations" ADD CONSTRAINT "hook_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "favorite_hooks" DROP CONSTRAINT IF EXISTS "favorite_hooks_user_id_users_id_fk";
ALTER TABLE "favorite_hooks" ADD CONSTRAINT "favorite_hooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "favorite_hooks" DROP CONSTRAINT IF EXISTS "favorite_hooks_generation_id_hook_generations_id_fk";
ALTER TABLE "favorite_hooks" ADD CONSTRAINT "favorite_hooks_generation_id_hook_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "hook_generations"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "user_recent_hooks" DROP CONSTRAINT IF EXISTS "user_recent_hooks_user_id_users_id_fk";
ALTER TABLE "user_recent_hooks" ADD CONSTRAINT "user_recent_hooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

-- Alter credit columns to use integer type (backwards compatible approach)
ALTER TABLE "users" ALTER COLUMN "free_credits" TYPE integer USING CASE WHEN "free_credits" ~ '^[0-9]+$' THEN "free_credits"::integer ELSE 5 END;
ALTER TABLE "users" ALTER COLUMN "used_credits" TYPE integer USING CASE WHEN "used_credits" ~ '^[0-9]+$' THEN "used_credits"::integer ELSE 0 END;
ALTER TABLE "users" ALTER COLUMN "free_credits" SET DEFAULT 5;
ALTER TABLE "users" ALTER COLUMN "used_credits" SET DEFAULT 0;