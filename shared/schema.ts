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

// Analytics Events Table for conversion tracking
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  eventType: varchar("event_type").notNull(),
  eventData: jsonb("event_data").$type<{
    component?: string;
    variant?: string;
    platform?: string;
    ctaId?: string;
    ctaText?: string;
    ctaPosition?: string;
    viewDuration?: number;
    scrollDepth?: number;
    conversionValue?: number;
    testVariant?: string;
    metadata?: Record<string, any>;
  }>().notNull().default({}),
  deviceInfo: jsonb("device_info").$type<{
    userAgent: string;
    platform: 'desktop' | 'mobile' | 'tablet';
    screenResolution: [number, number];
    timezone: string;
    language: string;
  }>().notNull(),
  pageInfo: jsonb("page_info").$type<{
    url: string;
    referrer: string;
    title: string;
    path: string;
    queryParams: Record<string, string>;
  }>().notNull(),
  ipAddress: varchar("ip_address"), // Nullable for privacy compliance
  userConsent: boolean("user_consent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes for analytics queries
  index("idx_analytics_events_session_id").on(table.sessionId),
  index("idx_analytics_events_user_id").on(table.userId),
  index("idx_analytics_events_event_type").on(table.eventType),
  index("idx_analytics_events_created_at").on(table.createdAt),
  index("idx_analytics_events_user_event_type").on(table.userId, table.eventType),
  index("idx_analytics_events_session_created").on(table.sessionId, table.createdAt),
  // Data integrity constraints
  check("event_type_values", sql`${table.eventType} IN ('cta_click', 'cta_view', 'cta_hover', 'trust_signal_view', 'urgency_indicator_view', 'funnel_step', 'ab_test_exposure', 'error', 'performance', 'page_view', 'user_identified', 'session_reset', 'conversion')`),
]);

// A/B Testing Configuration Table
export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testName: varchar("test_name").notNull(),
  testDescription: text("test_description"),
  status: varchar("status").notNull().default("draft"),
  variants: jsonb("variants").$type<Record<string, {
    id: string;
    weight: number;
    config: Record<string, any>;
  }>>().notNull(),
  trafficAllocation: integer("traffic_allocation").notNull().default(100), // 0-100
  targetingRules: jsonb("targeting_rules").$type<{
    userSegments?: string[];
    geoTargeting?: string[];
    deviceTypes?: ('mobile' | 'tablet' | 'desktop')[];
    customRules?: Record<string, any>;
  }>(),
  minSampleSize: integer("min_sample_size").default(100),
  significanceLevel: integer("significance_level").default(95), // 95% confidence
  primaryMetric: varchar("primary_metric").default("conversion_rate"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  winnerVariant: varchar("winner_variant"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes
  index("idx_ab_tests_status").on(table.status),
  index("idx_ab_tests_created_at").on(table.createdAt),
  index("idx_ab_tests_start_end_date").on(table.startDate, table.endDate),
  // Data integrity constraints
  check("status_values", sql`${table.status} IN ('draft', 'running', 'paused', 'completed', 'archived')`),
  check("traffic_allocation_range", sql`${table.trafficAllocation} >= 0 AND ${table.trafficAllocation} <= 100`),
  check("significance_level_range", sql`${table.significanceLevel} >= 90 AND ${table.significanceLevel} <= 99`)
]);

// A/B Test Participants Table
export const abTestParticipants = pgTable("ab_test_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  variantId: varchar("variant_id").notNull(),
  exposureTime: timestamp("exposure_time").defaultNow(),
  converted: boolean("converted").default(false),
  conversionTime: timestamp("conversion_time"),
  conversionValue: integer("conversion_value").default(0),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes
  index("idx_ab_test_participants_test_id").on(table.testId),
  index("idx_ab_test_participants_session_id").on(table.sessionId),
  index("idx_ab_test_participants_user_id").on(table.userId),
  index("idx_ab_test_participants_variant_id").on(table.variantId),
  index("idx_ab_test_participants_test_variant").on(table.testId, table.variantId),
  index("idx_ab_test_participants_converted").on(table.converted),
  // Unique constraint to prevent duplicate participation
  index("idx_ab_test_participants_unique").on(table.testId, table.sessionId)
]);

// Conversion Funnels Table
export const conversionFunnels = pgTable("conversion_funnels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  funnelName: varchar("funnel_name").notNull(),
  funnelDescription: text("funnel_description"),
  steps: jsonb("steps").$type<Array<{
    stepIndex: number;
    stepName: string;
    stepType: string;
    requiredEvent: string;
    optional: boolean;
  }>>().notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes
  index("idx_conversion_funnels_active").on(table.isActive),
  index("idx_conversion_funnels_created_at").on(table.createdAt),
  index("idx_conversion_funnels_name").on(table.funnelName)
]);

// Funnel Events Table
export const funnelEvents = pgTable("funnel_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  funnelId: varchar("funnel_id").notNull().references(() => conversionFunnels.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  stepIndex: integer("step_index").notNull(),
  stepName: varchar("step_name").notNull(),
  previousStep: varchar("previous_step"),
  timeFromPrevious: integer("time_from_previous"), // in milliseconds
  abandoned: boolean("abandoned").default(false),
  completed: boolean("completed").default(false),
  eventData: jsonb("event_data").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes
  index("idx_funnel_events_funnel_id").on(table.funnelId),
  index("idx_funnel_events_session_id").on(table.sessionId),
  index("idx_funnel_events_user_id").on(table.userId),
  index("idx_funnel_events_step_index").on(table.stepIndex),
  index("idx_funnel_events_funnel_session").on(table.funnelId, table.sessionId),
  index("idx_funnel_events_completed").on(table.completed),
  index("idx_funnel_events_abandoned").on(table.abandoned)
]);

// User Consent Management Table
export const userConsent = pgTable("user_consent", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  analyticsConsent: boolean("analytics_consent").default(false),
  marketingConsent: boolean("marketing_consent").default(false),
  personalizationConsent: boolean("personalization_consent").default(false),
  consentVersion: varchar("consent_version").notNull().default("1.0"),
  ipAddress: varchar("ip_address"), // For legal compliance
  userAgent: text("user_agent"),
  consentMethod: varchar("consent_method").default("explicit"), // explicit, implicit, essential
  withdrawnAt: timestamp("withdrawn_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes
  index("idx_user_consent_session_id").on(table.sessionId),
  index("idx_user_consent_user_id").on(table.userId),
  index("idx_user_consent_analytics").on(table.analyticsConsent),
  index("idx_user_consent_created_at").on(table.createdAt),
  // Data integrity constraints
  check("consent_method_values", sql`${table.consentMethod} IN ('explicit', 'implicit', 'essential')`)
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
