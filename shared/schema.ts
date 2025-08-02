import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, index, integer, serial, check, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password"), // Optional for Firebase users
  firebaseUid: varchar("firebase_uid").unique(), // Firebase UID
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  emailVerified: boolean("email_verified").default(false),
  profileImageUrl: varchar("profile_image_url"),
  // Hook Line Studio specific fields
  company: text("company"),
  industry: text("industry"),
  role: text("role"),
  audience: text("audience"),
  voice: text("voice"),
  bannedTerms: jsonb("banned_terms").$type<string[]>().default([]),
  safety: text("safety").default("standard"), // family-friendly, standard, edgy
  // Generation tracking system
  proGenerationsUsed: integer("pro_generations_used").default(0), // GPT-4o generations used this period
  draftGenerationsUsed: integer("draft_generations_used").default(0), // GPT-4o-mini generations used this period
  weeklyDraftReset: timestamp("weekly_draft_reset").defaultNow(), // Reset date for free tier weekly limit
  // Fixed credit system data types (backwards compatible)
  freeCredits: integer("free_credits").default(5),
  usedCredits: integer("used_credits").default(0),
  isPremium: boolean("is_premium").default(false),
  // Stripe integration
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, active, canceled, past_due
  subscriptionPlan: varchar("subscription_plan").default("free"), // free, starter, creator, pro, teams
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_users_email").on(table.email),
  index("idx_users_firebase_uid").on(table.firebaseUid),
  index("idx_users_stripe_customer_id").on(table.stripeCustomerId),
  index("idx_users_created_at").on(table.createdAt),
  index("idx_users_subscription_status").on(table.subscriptionStatus),
  // Data integrity constraints
  check("email_format", sql`${table.email} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
  check("safety_values", sql`${table.safety} IN ('family-friendly', 'standard', 'edgy')`),
  check("subscription_status_values", sql`${table.subscriptionStatus} IN ('free', 'active', 'canceled', 'past_due', 'trialing', 'unpaid')`),
  check("subscription_plan_values", sql`${table.subscriptionPlan} IN ('free', 'starter', 'creator', 'pro', 'teams')`),
  check("positive_generations", sql`${table.proGenerationsUsed} >= 0 AND ${table.draftGenerationsUsed} >= 0`),
  check("positive_credits", sql`${table.freeCredits} >= 0 AND ${table.usedCredits} >= 0`)
]);

export const hookGenerations = pgTable("hook_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // tiktok, instagram, youtube
  objective: text("objective").notNull(), // watch_time, shares, saves, ctr
  topic: text("topic").notNull(),
  modelType: text("model_type").notNull().default("gpt-4o"), // gpt-4o (pro), gpt-4o-mini (draft)
  hooks: jsonb("hooks").$type<{
    // Tri-modal hook architecture
    verbalHook: string;           // Primary spoken/written hook
    visualHook?: string;          // Visual direction/suggestion
    textualHook?: string;         // On-screen text overlay
    
    // Enhanced framework and psychological data
    framework: string;            // Primary copywriting framework
    psychologicalDriver: string;  // Core psychological trigger (curiosity_gap, value_hit, etc.)
    hookCategory: string;         // Category from research taxonomy (Question-Based, Statement-Based, etc.)
    riskFactor: "low" | "medium" | "high"; // Risk assessment
    
    // Performance metrics
    score: number;               // AI composite score (0-5)
    wordCount: number;           // Word count for verbal hook
    scoreBreakdown: string;      // Detailed scoring explanation
    
    // Context and strategy
    rationale: string;           // Why this hook works
    platformNotes: string;       // Platform-specific guidance
    contentTypeStrategy: "curiosity_gap" | "value_hit"; // Strategic approach
    
    // Enhanced platform-specific elements
    platformSpecific?: {
      tiktokColdOpen?: string;    // TikTok visual cold-open suggestion
      instagramOverlay?: string;  // Instagram text overlay (≤24 chars)
      youtubeProofCue?: string;   // YouTube proof element
    };
    
    // Failure point mitigation
    promiseContentMatch: boolean; // Ensures hook promise matches content capability
    specificityScore: number;     // Measures concrete vs vague language (0-1)
    freshnessScore: number;       // Novelty vs hook fatigue (0-1)
  }[]>().notNull(),
  topThreeVariants: jsonb("top_three_variants").$type<{
    // Enhanced top variants with full tri-modal data
    verbalHook: string;
    visualHook?: string;
    textualHook?: string;
    variants: string[];           // Alternative versions of the verbal hook
    framework: string;
    psychologicalDriver: string;
    score: number;
    scoreBreakdown: string;
    reHookStrategy?: string;      // Strategy for sustaining momentum
  }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_hook_generations_user_id").on(table.userId),
  index("idx_hook_generations_created_at").on(table.createdAt),
  index("idx_hook_generations_platform").on(table.platform),
  index("idx_hook_generations_user_platform").on(table.userId, table.platform),
  index("idx_hook_generations_user_created").on(table.userId, table.createdAt),
  // Data integrity constraints
  check("platform_values", sql`${table.platform} IN ('tiktok', 'instagram', 'youtube', 'twitter', 'linkedin')`),
  check("objective_values", sql`${table.objective} IN ('watch_time', 'shares', 'saves', 'ctr', 'engagement', 'conversions')`),
  check("model_type_values", sql`${table.modelType} IN ('gpt-4o', 'gpt-4o-mini')`)
]);

export const favoriteHooks = pgTable("favorite_hooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  generationId: varchar("generation_id").references(() => hookGenerations.id, { onDelete: "set null" }),
  // Legacy single hook field (deprecated)
  hook: text("hook"),
  // New tri-modal hook data
  hookData: jsonb("hook_data").$type<{
    verbalHook: string;           // Primary spoken/written hook
    visualHook?: string;          // Visual direction/suggestion
    textualHook?: string;         // On-screen text overlay
    framework: string;            // Primary copywriting framework
    psychologicalDriver?: string; // Core psychological trigger
    hookCategory?: string;        // Category from research taxonomy
    score?: number;              // AI composite score (0-5)
    scoreBreakdown?: string;     // Detailed scoring explanation
    rationale?: string;          // Why this hook works
    platformNotes?: string;      // Platform-specific guidance
    platformSpecific?: {
      tiktokColdOpen?: string;    // TikTok visual cold-open suggestion
      instagramOverlay?: string;  // Instagram text overlay (≤24 chars)
      youtubeProofCue?: string;   // YouTube proof element
    };
  }>(),
  framework: text("framework").notNull(),
  platformNotes: text("platform_notes").notNull(),
  topic: text("topic"), // Add topic field
  platform: text("platform"), // Add platform field
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_favorite_hooks_user_id").on(table.userId),
  index("idx_favorite_hooks_created_at").on(table.createdAt),
  index("idx_favorite_hooks_user_created").on(table.userId, table.createdAt),
  index("idx_favorite_hooks_generation_id").on(table.generationId),
  // Prevent duplicate favorites for same generation
  index("idx_favorite_hooks_unique_user_generation").on(table.userId, table.generationId)
]);

// Recent hooks for novelty checking
export const userRecentHooks = pgTable("user_recent_hooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hook: text("hook").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_user_recent_hooks_user_id").on(table.userId),
  index("idx_user_recent_hooks_created_at").on(table.createdAt),
  index("idx_user_recent_hooks_user_created").on(table.userId, table.createdAt)
]);

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Enhanced validation schemas with security constraints
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  password: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Make these fields optional since they might come from onboarding data
  platforms: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  examples: z.string().optional(),
});

// For Replit Auth upsert operations
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertHookGenerationSchema = createInsertSchema(hookGenerations).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteHookSchema = z.object({
  userId: z.string(),
  hook: z.string().optional(),
  generationId: z.string().optional(),
  framework: z.string(),
  platformNotes: z.string(),
  topic: z.string().optional(),
  platform: z.string().optional(),
  hookData: z.object({
    verbalHook: z.string(),
    visualHook: z.string().optional(),
    textualHook: z.string().optional(),
    framework: z.string(),
    psychologicalDriver: z.string().optional(),
    hookCategory: z.string().optional(),
    score: z.number().optional(),
    scoreBreakdown: z.string().optional(),
    rationale: z.string().optional(),
    platformNotes: z.string().optional(),
    platformSpecific: z.object({
      tiktokColdOpen: z.string().optional(),
      instagramOverlay: z.string().optional(),
      youtubeProofCue: z.string().optional(),
    }).optional(),
  }).optional()
});

export const insertUserRecentHookSchema = createInsertSchema(userRecentHooks).omit({
  id: true,
  createdAt: true,
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertHookGeneration = z.infer<typeof insertHookGenerationSchema>;
export type HookGeneration = typeof hookGenerations.$inferSelect;
export type InsertFavoriteHook = z.infer<typeof insertFavoriteHookSchema>;
export type FavoriteHook = typeof favoriteHooks.$inferSelect;
export type InsertUserRecentHook = z.infer<typeof insertUserRecentHookSchema>;
export type UserRecentHook = typeof userRecentHooks.$inferSelect;
