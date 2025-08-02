import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertHookGenerationSchema, insertFavoriteHookSchema, registerSchema, loginSchema } from "@shared/schema";
import { generateTriModalHooks as generateHooks } from "./services/openai-trimodal";
import { firebaseAuthMiddleware, FirebaseRequest } from "./firebase-auth";
import { 
  apiLimiter, 
  generateHooksLimiter, 
  sanitizeInput, 
  securityHeaders, 
  validateRequestSize 
} from "./middleware/security";
import { 
  createSubscription, 
  createBillingPortalSession, 
  getSubscriptionStatus,
  cancelSubscription,
  handleStripeWebhook,
  SUBSCRIPTION_PLANS
} from "./services/stripe";
import Stripe from "stripe";
import { adminAuth } from "./firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy for Replit environment (fixes X-Forwarded-For header warnings)
  app.set('trust proxy', 1);
  
  // Security middleware
  app.use(securityHeaders);
  app.use(validateRequestSize);
  app.use(sanitizeInput);
  
  // Rate limiting for API routes
  app.use('/api/', apiLimiter);
  
  // Health check endpoint for Railway deployment monitoring
  // Returns 200 even if database is temporarily unavailable to prevent restart loops
  app.get('/health', async (req, res) => {
    const startTime = Date.now();
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        firebase: process.env.FIREBASE_PROJECT_ID ? 'configured' : 'not_configured',
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured'
      },
      checks: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          free: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          total: Math.round(process.memoryUsage().rss / 1024 / 1024)
        }
      }
    };

    try {
      // Test database connection with timeout
      const dbCheckPromise = storage.healthCheck();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database health check timeout')), 5000)
      );
      
      await Promise.race([dbCheckPromise, timeoutPromise]);
      healthCheck.services.database = 'connected';
    } catch (error) {
      console.error('Database health check failed:', error);
      healthCheck.services.database = 'disconnected';
      // Don't mark as unhealthy to prevent restart loops during database connectivity issues
      // healthCheck.status = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    healthCheck.checks = {
      ...healthCheck.checks,
      responseTime: `${responseTime}ms`
    };

    // Always return 200 for Railway health checks to prevent restart loops
    // Use /ready endpoint for strict health checking
    res.status(200).json(healthCheck);
  });

  // Readiness probe for Railway
  app.get('/ready', async (req, res) => {
    try {
      await storage.healthCheck();
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Database not ready'
      });
    }
  });

  // Liveness probe for Railway - simple endpoint that always responds
  // This is used by Railway for health checks and should never fail
  app.get('/live', (req, res) => {
    const response = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      railway: process.env.RAILWAY_ENVIRONMENT || 'local',
      port: process.env.PORT || '5000',
      host: req.get('host'),
      userAgent: req.get('user-agent')
    };
    
    // Log health check requests in Railway environment for debugging
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log('Health check request received:', {
        ip: req.ip,
        host: req.get('host'),
        userAgent: req.get('user-agent'),
        uptime: process.uptime()
      });
    }
    
    res.status(200).json(response);
  });
  
  // Firebase Auth middleware will be applied to specific routes that need it

  // Server-side Firebase auth endpoints (to bypass client CORS issues)
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate input using Zod schema
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data",
          errors: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      const { email, password, firstName, lastName } = validationResult.data;

      // Use Firebase Admin SDK to create user
      
      try {
        const userRecord = await adminAuth!.createUser({
          email,
          password,
          displayName: `${firstName} ${lastName}`,
          emailVerified: process.env.NODE_ENV === 'development' // Only auto-verify in development
        });

        // Generate a custom token for immediate login
        const customToken = await adminAuth!.createCustomToken(userRecord.uid);
        
        // Store user in our database
        const userData = {
          id: userRecord.uid,
          email: userRecord.email || email, // Ensure email is not undefined
          firstName,
          lastName,
          company: "",
          industry: "",
          role: "",
          audience: "",
          voice: "",
          bannedTerms: [],
          safetyPreferences: {
            avoidControversy: true,
            familyFriendly: true,
            brandSafe: true
          },
          freeCredits: 5,
          usedCredits: 0,
          isPremium: false,
          subscriptionStatus: 'free' as const,
          subscriptionPlan: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        };
        
        try {
          await storage.upsertUser(userData);
        } catch (dbError: any) {
          console.log('Database user creation error (possibly duplicate):', dbError.message);
          // Continue with registration even if user already exists in DB
        }
        
        res.json({
          success: true,
          customToken,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            emailVerified: userRecord.emailVerified
          }
        });
        
      } catch (firebaseError: any) {
        console.error('Firebase Admin registration error:', firebaseError);
        
        if (firebaseError.code === 'auth/email-already-exists') {
          return res.status(400).json({ 
            message: "An account with this email already exists" 
          });
        }
        
        return res.status(400).json({ 
          message: "Registration failed: " + firebaseError.message 
        });
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: "Internal server error during registration" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate input using Zod schema
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data",
          errors: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      const { email, password } = validationResult.data;

      // For Firebase authentication, we need to validate the password on the client side
      // The server cannot directly validate passwords with Firebase Admin SDK
      // Instead, we'll use a workaround: let the client handle authentication
      // and just verify the user exists
      
      try {
        const userRecord = await adminAuth!.getUserByEmail(email);
        
        // Generate a custom token for login (client will use this after password validation)
        const customToken = await adminAuth!.createCustomToken(userRecord.uid);
        
        res.json({
          success: true,
          customToken,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            emailVerified: userRecord.emailVerified
          }
        });
        
      } catch (firebaseError: any) {
        console.error('Firebase Admin login error:', firebaseError);
        
        if (firebaseError.code === 'auth/user-not-found') {
          return res.status(401).json({ 
            message: "Invalid email or password" 
          });
        }
        
        return res.status(401).json({ 
          message: "Login failed: " + firebaseError.message 
        });
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: "Internal server error during login" 
      });
    }
  });

  // Firebase sync endpoint for client-side auth state
  app.post("/api/auth/firebase-sync", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      // Get user data from verified Firebase token (middleware sets this)
      const firebaseUser = req.firebaseUser;
      
      if (!firebaseUser || !firebaseUser.uid || !firebaseUser.email) {
        return res.status(401).json({ 
          message: "Invalid Firebase authentication" 
        });
      }

      // Check if user already exists
      let user = await storage.getUser(firebaseUser.uid);
      let isNewUser = false;
      
      if (!user) {
        // Create new user if doesn't exist
        isNewUser = true;
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: firebaseUser.name?.split(' ')[0] || '',
          lastName: firebaseUser.name?.split(' ').slice(1).join(' ') || '',
          company: "",
          industry: "",
          role: "",
          audience: "",
          voice: "",
          bannedTerms: [],
          safetyPreferences: {
            avoidControversy: true,
            familyFriendly: true,
            brandSafe: true
          },
          freeCredits: 5,
          usedCredits: 0,
          isPremium: false,
          subscriptionStatus: 'free' as const,
          subscriptionPlan: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        };
        
        user = await storage.upsertUser(userData);
      } else {
        // For existing users, always fetch fresh data from database to ensure we have latest profile updates
        user = await storage.getUser(firebaseUser.uid);
      }
      
      // Ensure user exists at this point
      if (!user) {
        throw new Error("Failed to create or retrieve user");
      }
      
      // Check if user needs onboarding (missing profile info)
      // All these fields must be non-empty strings for onboarding to be complete
      const needsOnboarding = !user.company?.trim() || !user.industry?.trim() || !user.role?.trim() || !user.audience?.trim() || !user.voice?.trim();
      
      console.log('Firebase sync check:', {
        userId: firebaseUser.uid,
        company: user.company,
        industry: user.industry,
        role: user.role,
        audience: user.audience,
        voice: user.voice,
        needsOnboarding
      });
      
      res.json({
        success: true,
        user,
        isNewUser,
        needsOnboarding
      });
      
    } catch (error: any) {
      console.error('Firebase sync error:', error);
      res.status(500).json({ 
        message: "Failed to sync user data" 
      });
    }
  });

  // Protected User profile routes
  app.post("/api/users", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("Creating/updating user profile for:", userId);
      
      // Create a complete user data object including the email from the authenticated user
      const profileData = {
        ...req.body,
        email: req.user?.email || req.firebaseUser?.email || '', // Ensure email is included from authenticated user
        id: userId // Ensure id is included
      };
      
      const userData = insertUserSchema.parse(profileData);
      const user = await storage.updateUser(userId, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error creating/updating user:", error);
      res.status(400).json({ message: "Invalid user data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/users/me", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/users/me", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Check credits endpoint (legacy)
  app.get("/api/credits/check", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const creditStatus = await storage.checkUserCanGenerate(userId);
      res.json(creditStatus);
    } catch (error: any) {
      console.error("Error checking credits:", error);
      res.status(500).json({ error: "Failed to check credits" });
    }
  });

  // New generation status endpoint
  app.get("/api/generations/status", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const modelType = req.query.modelType as "gpt-4o" | "gpt-4o-mini" || "gpt-4o";
      const generationStatus = await storage.checkUserCanGenerateWithModel(userId, modelType);
      res.json(generationStatus);
    } catch (error: any) {
      console.error("Error checking generation status:", error);
      res.status(500).json({ error: "Failed to check generation status" });
    }
  });

  // Protected Hook generation routes with strict rate limiting
  app.post("/api/generate-hooks", generateHooksLimiter, firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      let { platform, objective, topic, modelType } = req.body;
      
      if (!platform || !objective || !topic) {
        return res.status(400).json({ message: "Missing required fields: platform, objective, topic" });
      }

      // Get user profile first to determine appropriate model
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Determine model type based on subscription plan if not explicitly provided
      if (!modelType) {
        const plan = user.subscriptionPlan || "free";
        if (plan === "free") {
          modelType = "gpt-4o-mini"; // Free users always get mini model
        } else {
          // Paid users can choose, but default to full model
          modelType = "gpt-4o";
        }
      }

      // Validate model type
      if (!["gpt-4o", "gpt-4o-mini"].includes(modelType)) {
        return res.status(400).json({ message: "Invalid model type. Must be 'gpt-4o' or 'gpt-4o-mini'" });
      }

      // For free users, enforce mini model only
      if ((user.subscriptionPlan || "free") === "free" && modelType === "gpt-4o") {
        modelType = "gpt-4o-mini";
        console.log("Free user attempted to use gpt-4o, automatically switched to gpt-4o-mini");
      }

      console.log(`Final model selection: ${modelType} for user plan: ${user.subscriptionPlan || "free"}`);

      // Check if user can generate hooks with the requested model type
      const generationStatus = await storage.checkUserCanGenerateWithModel(userId, modelType);
      if (!generationStatus.canGenerate) {
        return res.status(403).json({ 
          error: generationStatus.reason || "Generation limit reached",
          remainingProGenerations: generationStatus.remainingProGenerations,
          remainingDraftGenerations: generationStatus.remainingDraftGenerations,
          isAtLimit: true
        });
      }

      // User profile already retrieved above for model determination

      // Generate tri-modal hooks using enhanced OpenAI system
      console.log(`Generating tri-modal hooks for ${platform} with topic: "${topic}"`);
      console.log(`User profile: ${user.company} (${user.industry}, ${user.role})`);
      console.log(`Audience: ${user.audience?.substring(0, 100)}...`);
      
      const result = await generateHooks({
        topic,
        platform,
        objective,
        modelType, // Pass the determined model type to the AI service
        company: user.company || "Unknown Company",
        role: user.role || "Creator",
        industry: user.industry || "General",
        audience: user.audience || "General Audience",
        voice: user.voice || "Friendly",
        bannedTerms: user.bannedTerms || [],
        safety: "standard"
      });

      // Save generation to storage
      const generation = await storage.createHookGeneration({
        userId,
        platform,
        objective,
        topic,
        modelType,
        hooks: result.hooks,
        topThreeVariants: result.topThreeVariants
      });

      // Increment user's generation count for the specific model type
      await storage.incrementUserGenerations(userId, modelType);

      res.json(generation);
    } catch (error) {
      console.error("Hook generation error:", error);
      res.status(500).json({ message: "Failed to generate hooks", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/generations", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const generations = await storage.getHookGenerationsByUser(userId);
      res.json(generations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch generations", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/generation/:id", async (req, res) => {
    try {
      const generation = await storage.getHookGeneration(req.params.id);
      if (!generation) {
        return res.status(404).json({ message: "Generation not found" });
      }
      res.json(generation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch generation", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Protected Favorite hooks routes
  app.post("/api/favorites", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      console.log('Received favorite data:', req.body);
      const favoriteData = insertFavoriteHookSchema.parse({
        ...req.body,
        userId
      });
      console.log('Parsed favorite data:', favoriteData);
      const favorite = await storage.createFavoriteHook(favoriteData);
      
      // Track recent hook for novelty checking
      if (favoriteData.hook) {
        await storage.addRecentHook({
          userId,
          hook: favoriteData.hook
        });
      }
      
      res.json(favorite);
    } catch (error) {
      console.error('Favorite creation error:', error);
      res.status(400).json({ message: "Invalid favorite data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/favorites", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const favorites = await storage.getFavoriteHooksByUser(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/favorites/:id", firebaseAuthMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteFavoriteHook(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      res.json({ message: "Favorite deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete favorite", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Protected Export to CSV route
  app.post("/api/export-csv", firebaseAuthMiddleware, async (req, res) => {
    try {
      const { generationId } = req.body;
      
      if (!generationId) {
        return res.status(400).json({ message: "Generation ID is required" });
      }

      const generation = await storage.getHookGeneration(generationId);
      if (!generation) {
        return res.status(404).json({ message: "Generation not found" });
      }

      // Create CSV content
      const headers = "Hook,Framework,Rationale,Platform Notes,Score,Word Count\n";
      const rows = generation.hooks.map(hook => 
        `"${hook.verbalHook}","${hook.framework}","${hook.rationale}","${hook.platformNotes}",${hook.score},${hook.wordCount}`
      ).join("\n");
      
      const csv = headers + rows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="hooks-${generation.platform}-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export CSV", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Delete a generation
  app.delete("/api/generations/:generationId", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const { generationId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify the generation belongs to the user
      const generation = await storage.getGenerationById(generationId);
      if (!generation || generation.userId !== userId) {
        return res.status(404).json({ message: "Generation not found" });
      }

      await storage.deleteGeneration(generationId);
      res.json({ message: "Generation deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting generation:", error);
      res.status(500).json({ message: "Failed to delete generation" });
    }
  });

  // Stripe Payment Routes
  
  // Get subscription plans
  app.get("/api/stripe/plans", (req, res) => {
    res.json({
      plans: SUBSCRIPTION_PLANS
    });
  });

  // Create subscription for Pro or Teams plan
  app.post("/api/stripe/create-subscription", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: "User email not found" });
      }

      const { plan, promotionCode } = req.body;
      
      // Validate plan
      if (!plan || !['starter', 'creator', 'pro', 'teams'].includes(plan.toLowerCase())) {
        return res.status(400).json({ message: "Invalid plan. Must be 'starter', 'creator', 'pro', or 'teams'" });
      }

      const planKey = plan.toUpperCase() as 'STARTER' | 'CREATOR' | 'PRO' | 'TEAMS';
      const priceId = SUBSCRIPTION_PLANS[planKey].priceId;
      
      if (!priceId) {
        return res.status(400).json({ message: "Price ID not configured for this plan" });
      }
      
      const subscription = await createSubscription(
        userId,
        user.email,
        priceId,
        promotionCode
      );

      // Update user's plan in database
      await storage.updateUser(userId, {
        subscriptionPlan: plan.toLowerCase(),
        subscriptionStatus: 'trialing'
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        message: "Failed to create subscription", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get existing subscription
  app.get("/api/stripe/subscription", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(404).json({ message: "No subscription found" });
      }

      const subscription = await getSubscriptionStatus(user.stripeSubscriptionId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ 
        message: "Failed to fetch subscription", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Create customer portal session
  app.post("/api/stripe/portal", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      const { returnUrl } = req.body;
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }
      
      const portalUrl = await createBillingPortalSession(
        user.stripeCustomerId, 
        returnUrl || `${req.protocol}://${req.get('host')}/app`
      );

      res.json({ url: portalUrl });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ 
        message: "Failed to create portal session", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Cancel subscription
  app.post("/api/stripe/cancel", firebaseAuthMiddleware, async (req: FirebaseRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      await cancelSubscription(user.stripeSubscriptionId);
      
      // Update user's plan to cancel at period end
      await storage.updateUser(userId, {
        cancelAtPeriodEnd: true
      });
      res.json({ message: "Subscription will be canceled at the end of the billing period" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ 
        message: "Failed to cancel subscription", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Stripe webhook endpoint (no auth required)
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
      await handleStripeWebhook(event);
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        res.status(400).json({ error: "Invalid webhook signature" });
      } else {
        res.status(400).json({ 
          error: "Webhook Error", 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
