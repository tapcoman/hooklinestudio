import { users, hookGenerations, favoriteHooks, userRecentHooks, type User, type InsertUser, type UpsertUser, type HookGeneration, type InsertHookGeneration, type FavoriteHook, type InsertFavoriteHook, type UserRecentHook, type InsertUserRecentHook } from "@shared/schema";
import { db } from "./db";
import { eq, desc, inArray, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: { email: string; password: string; firstName: string; lastName: string }): Promise<User>;
  createUserFromFirebase(user: { firebaseUid: string; email: string; firstName: string; lastName: string; emailVerified: boolean }): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  // For Replit Auth
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Credit system (legacy)
  incrementUserCredits(userId: string): Promise<User | undefined>;
  checkUserCanGenerate(userId: string): Promise<{ canGenerate: boolean; remainingCredits: number; isAtLimit: boolean }>;
  resetUserCredits(userId: string): Promise<User | undefined>;
  
  // New generation tracking system
  incrementUserGenerations(userId: string, modelType: "gpt-4o" | "gpt-4o-mini"): Promise<User | undefined>;
  checkUserCanGenerateWithModel(userId: string, modelType: "gpt-4o" | "gpt-4o-mini"): Promise<{
    canGenerate: boolean;
    reason?: string;
    remainingProGenerations: number;
    remainingDraftGenerations: number;
    planLimits: any;
  }>;
  resetUserGenerationCounts(userId: string): Promise<User | undefined>;

  // Hook generation operations
  createHookGeneration(generation: InsertHookGeneration): Promise<HookGeneration>;
  getHookGenerationsByUser(userId: string): Promise<HookGeneration[]>;
  getHookGeneration(id: string): Promise<HookGeneration | undefined>;

  // Favorite hooks operations
  createFavoriteHook(favorite: InsertFavoriteHook): Promise<FavoriteHook>;
  getFavoriteHooksByUser(userId: string): Promise<FavoriteHook[]>;
  deleteFavoriteHook(id: string): Promise<boolean>;

  // Recent hooks for novelty checking
  addRecentHook(recentHook: InsertUserRecentHook): Promise<UserRecentHook>;
  getRecentHooksByUser(userId: string): Promise<UserRecentHook[]>;
  cleanupOldRecentHooks(userId: string): Promise<void>;

  // Stripe operations
  updateStripeCustomerId(userId: string, customerId: string): Promise<User | null>;
  updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId: string; stripeSubscriptionId: string }): Promise<User | null>;
  updateUserSubscriptionStatus(userId: string, status: { status: string; currentPeriodEnd: number; cancelAtPeriodEnd: boolean }): Promise<User | null>;
  getUserByStripeCustomerId(customerId: string): Promise<User | null>;

  // Optimized batch operations to reduce N+1 queries
  getUsersWithGenerationsCount(userIds: string[]): Promise<Array<User & { generationsCount: number }>>;
  getHookGenerationsWithUserData(userId: string, limit?: number): Promise<Array<HookGeneration & { user: User }>>;
  getFavoriteHooksWithUserAndGenerationData(userId: string): Promise<Array<FavoriteHook & { user: User; generation?: HookGeneration }>>;
  getPopularHooksAnalytics(dateFrom?: Date, dateTo?: Date): Promise<Array<{ platform: string; totalGenerations: number; avgScore: number }>>;
  
  // Health check
  healthCheck(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.company, username));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async createUserFromFirebase(userData: { firebaseUid: string; email: string; firstName: string; lastName: string; emailVerified: boolean }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: null, // Firebase users don't have passwords in our system
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        bannedTerms: updates.bannedTerms ? updates.bannedTerms as string[] : undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by email or firebaseUid
    let existingUser;
    if (userData.email) {
      existingUser = await this.getUserByEmail(userData.email);
    }
    if (!existingUser && userData.firebaseUid) {
      existingUser = await this.getUserByFirebaseUid(userData.firebaseUid);
    }

    if (existingUser) {
      // Update existing user
      return this.updateUser(existingUser.id, userData);
    } else {
      // Create new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }
  }

  async incrementUserCredits(userId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const currentUsed = user.usedCredits || 0;
    const newUsedCredits = currentUsed + 1;
    
    return this.updateUser(userId, { usedCredits: newUsedCredits });
  }

  async checkUserCanGenerate(userId: string): Promise<{ canGenerate: boolean; remainingCredits: number; isAtLimit: boolean }> {
    const user = await this.getUser(userId);
    if (!user) return { canGenerate: false, remainingCredits: 0, isAtLimit: true };
    
    if (user.isPremium) {
      return { canGenerate: true, remainingCredits: 999, isAtLimit: false };
    }
    
    const freeCredits = user.freeCredits || 5;
    const usedCredits = user.usedCredits || 0;
    const remainingCredits = Math.max(0, freeCredits - usedCredits);
    const isAtLimit = remainingCredits === 0;
    
    return { 
      canGenerate: remainingCredits > 0, 
      remainingCredits, 
      isAtLimit 
    };
  }



  // New generation tracking system implementation
  async incrementUserGenerations(userId: string, modelType: "gpt-4o" | "gpt-4o-mini"): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    if (modelType === "gpt-4o") {
      const currentUsed = user.proGenerationsUsed || 0;
      return this.updateUser(userId, { proGenerationsUsed: currentUsed + 1 });
    } else {
      const currentUsed = user.draftGenerationsUsed || 0;
      return this.updateUser(userId, { draftGenerationsUsed: currentUsed + 1 });
    }
  }

  async checkUserCanGenerateWithModel(userId: string, modelType: "gpt-4o" | "gpt-4o-mini"): Promise<{
    canGenerate: boolean;
    reason?: string;
    remainingProGenerations: number;
    remainingDraftGenerations: number;
    planLimits: any;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      return {
        canGenerate: false,
        reason: "User not found",
        remainingProGenerations: 0,
        remainingDraftGenerations: 0,
        planLimits: null
      };
    }

    const plan = user.subscriptionPlan || "free";
    const { SUBSCRIPTION_PLANS } = await import("./services/stripe");
    const planKey = plan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS;
    const planLimits = SUBSCRIPTION_PLANS[planKey]?.limits;

    if (!planLimits) {
      return {
        canGenerate: false,
        reason: "Invalid subscription plan",
        remainingProGenerations: 0,
        remainingDraftGenerations: 0,
        planLimits: null
      };
    }

    const proUsed = user.proGenerationsUsed || 0;
    const draftUsed = user.draftGenerationsUsed || 0;

    // Calculate remaining generations based on plan
    let remainingProGenerations = 0;
    let remainingDraftGenerations = 0;

    if (plan === "free") {
      // Free tier: 20 draft generations per week, no pro generations
      const weeklyReset = new Date(user.weeklyDraftReset || user.createdAt || new Date());
      const weeksSinceReset = Math.floor((Date.now() - weeklyReset.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      if (weeksSinceReset >= 1) {
        // Reset weekly count
        await this.updateUser(userId, { 
          draftGenerationsUsed: 0, 
          weeklyDraftReset: new Date() 
        });
        remainingDraftGenerations = 20;
      } else {
        remainingDraftGenerations = Math.max(0, 20 - draftUsed);
      }
      
      remainingProGenerations = 0;
    } else {
      // Paid plans
      if (planLimits.proGenerationsPerMonth === -1) {
        remainingProGenerations = 999; // Unlimited
      } else {
        remainingProGenerations = Math.max(0, planLimits.proGenerationsPerMonth - proUsed);
      }

      if (planLimits.draftGenerationsPerMonth === -1) {
        remainingDraftGenerations = 999; // Unlimited
      } else {
        remainingDraftGenerations = Math.max(0, planLimits.draftGenerationsPerMonth - draftUsed);
      }
    }

    // Check if user can generate with requested model
    let canGenerate = false;
    let reason: string | undefined;

    if (modelType === "gpt-4o") {
      if (plan === "free") {
        canGenerate = false;
        reason = "Pro generations require a paid subscription";
      } else {
        canGenerate = remainingProGenerations > 0;
        if (!canGenerate) {
          reason = `Pro generation limit reached (${planLimits.proGenerationsPerMonth}/month)`;
        }
      }
    } else {
      // gpt-4o-mini
      if (plan === "free") {
        canGenerate = remainingDraftGenerations > 0;
        if (!canGenerate) {
          reason = "Weekly draft generation limit reached (20/week)";
        }
      } else {
        canGenerate = remainingDraftGenerations > 0;
        if (!canGenerate) {
          reason = "Draft generation limit reached";
        }
      }
    }

    return {
      canGenerate,
      reason,
      remainingProGenerations,
      remainingDraftGenerations,
      planLimits
    };
  }

  async resetUserGenerationCounts(userId: string): Promise<User | undefined> {
    return this.updateUser(userId, { 
      proGenerationsUsed: 0, 
      draftGenerationsUsed: 0,
      weeklyDraftReset: new Date()
    });
  }

  async createHookGeneration(insertGeneration: InsertHookGeneration): Promise<HookGeneration> {
    const [generation] = await db
      .insert(hookGenerations)
      .values({
        ...insertGeneration,
        hooks: insertGeneration.hooks as any,
        topThreeVariants: insertGeneration.topThreeVariants as any
      })
      .returning();
    return generation;
  }

  async getHookGenerationsByUser(userId: string): Promise<HookGeneration[]> {
    return await db
      .select()
      .from(hookGenerations)
      .where(eq(hookGenerations.userId, userId))
      .orderBy(desc(hookGenerations.createdAt));
  }

  async getGenerationsByUserId(userId: string): Promise<HookGeneration[]> {
    return this.getHookGenerationsByUser(userId);
  }

  async getGenerationById(id: string): Promise<HookGeneration | null> {
    const [generation] = await db.select().from(hookGenerations).where(eq(hookGenerations.id, id));
    return generation || null;
  }

  async deleteGeneration(id: string): Promise<boolean> {
    const result = await db.delete(hookGenerations).where(eq(hookGenerations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getHookGeneration(id: string): Promise<HookGeneration | undefined> {
    const [generation] = await db.select().from(hookGenerations).where(eq(hookGenerations.id, id));
    return generation || undefined;
  }



  async createFavoriteHook(insertFavorite: InsertFavoriteHook): Promise<FavoriteHook> {
    const [favorite] = await db
      .insert(favoriteHooks)
      .values(insertFavorite)
      .returning();
    return favorite;
  }

  async getFavoriteHooksByUser(userId: string): Promise<FavoriteHook[]> {
    return await db
      .select()
      .from(favoriteHooks)
      .where(eq(favoriteHooks.userId, userId))
      .orderBy(desc(favoriteHooks.createdAt));
  }

  async deleteFavoriteHook(id: string): Promise<boolean> {
    try {
      await db.delete(favoriteHooks).where(eq(favoriteHooks.id, id));
      return true;
    } catch {
      return false;
    }
  }

  async addRecentHook(insertRecentHook: InsertUserRecentHook): Promise<UserRecentHook> {
    // Add the new recent hook
    const [recentHook] = await db
      .insert(userRecentHooks)
      .values(insertRecentHook)
      .returning();
    
    // Clean up old hooks (keep only last 10)
    await this.cleanupOldRecentHooks(insertRecentHook.userId!);
    
    return recentHook;
  }

  async getRecentHooksByUser(userId: string): Promise<UserRecentHook[]> {
    return await db
      .select()
      .from(userRecentHooks)
      .where(eq(userRecentHooks.userId, userId))
      .orderBy(desc(userRecentHooks.createdAt))
      .limit(10);
  }

  async cleanupOldRecentHooks(userId: string): Promise<void> {
    // Get all recent hooks for user, ordered by creation date
    const allRecentHooks = await db
      .select()
      .from(userRecentHooks)
      .where(eq(userRecentHooks.userId, userId))
      .orderBy(desc(userRecentHooks.createdAt));
    
    // If more than 10, delete the oldest ones
    if (allRecentHooks.length > 10) {
      const hooksToDelete = allRecentHooks.slice(10);
      for (const hook of hooksToDelete) {
        await db.delete(userRecentHooks).where(eq(userRecentHooks.id, hook.id));
      }
    }
  }

  async resetUserCredits(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        usedCredits: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }



  async updateStripeCustomerId(userId: string, customerId: string): Promise<User | null> {
    try {
      const [updated] = await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, userId))
        .returning();
      return updated || null;
    } catch (error) {
      console.error("Error updating stripe customer ID:", error);
      throw error;
    }
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId: string; stripeSubscriptionId: string }): Promise<User | null> {
    try {
      const [updated] = await db
        .update(users)
        .set({ 
          stripeCustomerId: stripeInfo.stripeCustomerId,
          stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
          isPremium: true 
        })
        .where(eq(users.id, userId))
        .returning();
      return updated || null;
    } catch (error) {
      console.error("Error updating user stripe info:", error);
      throw error;
    }
  }

  async updateUserSubscriptionStatus(userId: string, status: { status: string; currentPeriodEnd: number; cancelAtPeriodEnd: boolean }): Promise<User | null> {
    try {
      const [updated] = await db
        .update(users)
        .set({ 
          isPremium: status.status === 'active',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return updated || null;
    } catch (error) {
      console.error("Error updating user subscription status:", error);
      throw error;
    }
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1);
      return user || null;
    } catch (error) {
      console.error("Error finding user by stripe customer ID:", error);
      throw error;
    }
  }

  // Optimized batch operations to reduce N+1 queries
  async getUsersWithGenerationsCount(userIds: string[]): Promise<Array<User & { generationsCount: number }>> {
    if (userIds.length === 0) return [];
    
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        company: users.company,
        subscriptionPlan: users.subscriptionPlan,
        subscriptionStatus: users.subscriptionStatus,
        createdAt: users.createdAt,
        generationsCount: sql<number>`COUNT(${hookGenerations.id})::int`.as('generations_count')
      })
      .from(users)
      .leftJoin(hookGenerations, eq(users.id, hookGenerations.userId))
      .where(inArray(users.id, userIds))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    return result as Array<User & { generationsCount: number }>;
  }

  async getHookGenerationsWithUserData(userId: string, limit: number = 50): Promise<Array<HookGeneration & { user: User }>> {
    const result = await db
      .select({
        // Hook generation fields
        id: hookGenerations.id,
        userId: hookGenerations.userId,
        platform: hookGenerations.platform,
        objective: hookGenerations.objective,
        topic: hookGenerations.topic,
        modelType: hookGenerations.modelType,
        hooks: hookGenerations.hooks,
        topThreeVariants: hookGenerations.topThreeVariants,
        createdAt: hookGenerations.createdAt,
        // User fields
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          company: users.company,
          subscriptionPlan: users.subscriptionPlan,
          subscriptionStatus: users.subscriptionStatus
        }
      })
      .from(hookGenerations)
      .innerJoin(users, eq(hookGenerations.userId, users.id))
      .where(eq(hookGenerations.userId, userId))
      .orderBy(desc(hookGenerations.createdAt))
      .limit(limit);

    return result as Array<HookGeneration & { user: User }>;
  }

  async getFavoriteHooksWithUserAndGenerationData(userId: string): Promise<Array<FavoriteHook & { user: User; generation?: HookGeneration }>> {
    const result = await db
      .select({
        // Favorite hook fields
        id: favoriteHooks.id,
        userId: favoriteHooks.userId,
        generationId: favoriteHooks.generationId,
        hook: favoriteHooks.hook,
        hookData: favoriteHooks.hookData,
        framework: favoriteHooks.framework,
        platformNotes: favoriteHooks.platformNotes,
        topic: favoriteHooks.topic,
        platform: favoriteHooks.platform,
        createdAt: favoriteHooks.createdAt,
        // User fields
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          company: users.company
        },
        // Generation fields (optional)
        generation: {
          id: hookGenerations.id,
          platform: hookGenerations.platform,
          topic: hookGenerations.topic,
          modelType: hookGenerations.modelType,
          createdAt: hookGenerations.createdAt
        }
      })
      .from(favoriteHooks)
      .innerJoin(users, eq(favoriteHooks.userId, users.id))
      .leftJoin(hookGenerations, eq(favoriteHooks.generationId, hookGenerations.id))
      .where(eq(favoriteHooks.userId, userId))
      .orderBy(desc(favoriteHooks.createdAt));

    return result as Array<FavoriteHook & { user: User; generation?: HookGeneration }>;
  }

  async getPopularHooksAnalytics(dateFrom?: Date, dateTo?: Date): Promise<Array<{ platform: string; totalGenerations: number; avgScore: number }>> {
    let query = db
      .select({
        platform: hookGenerations.platform,
        totalGenerations: sql<number>`COUNT(*)::int`.as('total_generations'),
        avgScore: sql<number>`AVG((hooks::jsonb->0->>'score')::numeric)::float`.as('avg_score')
      })
      .from(hookGenerations);

    if (dateFrom && dateTo) {
      query = query.where(
        and(
          gte(hookGenerations.createdAt, dateFrom),
          lte(hookGenerations.createdAt, dateTo)
        )
      );
    }

    const result = await query
      .groupBy(hookGenerations.platform)
      .orderBy(desc(sql`COUNT(*)`));

    return result as Array<{ platform: string; totalGenerations: number; avgScore: number }>;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple query to test database connectivity
      await db.select().from(users).limit(1);
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
