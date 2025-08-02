CREATE TABLE "favorite_hooks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"generation_id" varchar,
	"hook" text,
	"hook_data" jsonb,
	"framework" text NOT NULL,
	"platform_notes" text NOT NULL,
	"topic" text,
	"platform" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hook_generations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"objective" text NOT NULL,
	"topic" text NOT NULL,
	"model_type" text DEFAULT 'gpt-4o' NOT NULL,
	"hooks" jsonb NOT NULL,
	"top_three_variants" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "platform_values" CHECK ("hook_generations"."platform" IN ('tiktok', 'instagram', 'youtube', 'twitter', 'linkedin')),
	CONSTRAINT "objective_values" CHECK ("hook_generations"."objective" IN ('watch_time', 'shares', 'saves', 'ctr', 'engagement', 'conversions')),
	CONSTRAINT "model_type_values" CHECK ("hook_generations"."model_type" IN ('gpt-4o', 'gpt-4o-mini'))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_recent_hooks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"hook" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar,
	"firebase_uid" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"email_verified" boolean DEFAULT false,
	"profile_image_url" varchar,
	"company" text,
	"industry" text,
	"role" text,
	"audience" text,
	"voice" text,
	"banned_terms" jsonb DEFAULT '[]'::jsonb,
	"safety" text DEFAULT 'standard',
	"pro_generations_used" integer DEFAULT 0,
	"draft_generations_used" integer DEFAULT 0,
	"weekly_draft_reset" timestamp DEFAULT now(),
	"free_credits" integer DEFAULT 5,
	"used_credits" integer DEFAULT 0,
	"is_premium" boolean DEFAULT false,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"subscription_status" varchar DEFAULT 'free',
	"subscription_plan" varchar DEFAULT 'free',
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "email_format" CHECK ("users"."email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$'),
	CONSTRAINT "safety_values" CHECK ("users"."safety" IN ('family-friendly', 'standard', 'edgy')),
	CONSTRAINT "subscription_status_values" CHECK ("users"."subscription_status" IN ('free', 'active', 'canceled', 'past_due', 'trialing', 'unpaid')),
	CONSTRAINT "subscription_plan_values" CHECK ("users"."subscription_plan" IN ('free', 'starter', 'creator', 'pro', 'teams')),
	CONSTRAINT "positive_generations" CHECK ("users"."pro_generations_used" >= 0 AND "users"."draft_generations_used" >= 0),
	CONSTRAINT "positive_credits" CHECK ("users"."free_credits" >= 0 AND "users"."used_credits" >= 0)
);
--> statement-breakpoint
ALTER TABLE "favorite_hooks" ADD CONSTRAINT "favorite_hooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_hooks" ADD CONSTRAINT "favorite_hooks_generation_id_hook_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."hook_generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hook_generations" ADD CONSTRAINT "hook_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recent_hooks" ADD CONSTRAINT "user_recent_hooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_favorite_hooks_user_id" ON "favorite_hooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_favorite_hooks_created_at" ON "favorite_hooks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_favorite_hooks_user_created" ON "favorite_hooks" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_favorite_hooks_generation_id" ON "favorite_hooks" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "idx_favorite_hooks_unique_user_generation" ON "favorite_hooks" USING btree ("user_id","generation_id");--> statement-breakpoint
CREATE INDEX "idx_hook_generations_user_id" ON "hook_generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_hook_generations_created_at" ON "hook_generations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_hook_generations_platform" ON "hook_generations" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_hook_generations_user_platform" ON "hook_generations" USING btree ("user_id","platform");--> statement-breakpoint
CREATE INDEX "idx_hook_generations_user_created" ON "hook_generations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_user_recent_hooks_user_id" ON "user_recent_hooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_recent_hooks_created_at" ON "user_recent_hooks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_recent_hooks_user_created" ON "user_recent_hooks" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_firebase_uid" ON "users" USING btree ("firebase_uid");--> statement-breakpoint
CREATE INDEX "idx_users_stripe_customer_id" ON "users" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_users_subscription_status" ON "users" USING btree ("subscription_status");