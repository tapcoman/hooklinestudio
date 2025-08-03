import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { productionSecurityHeaders, forceHTTPS } from "./middleware/security-headers";
import { validateEnvironment, isProduction, getEnv } from "./config/env-validation";
import { logger } from "./config/logger";
import { pool } from "./db";
import history from "connect-history-api-fallback";

// Validate environment variables before starting server
validateEnvironment();

const app = express();

// Health check routes MUST come before HTTPS redirect to prevent redirect loops
// These endpoints are used by Railway for health checks and must be accessible via HTTP
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const env = getEnv();
  
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unknown',
      firebase: env.FIREBASE_PROJECT_ID ? 'configured' : 'not_configured',
      stripe: env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
      openai: env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      analytics: env.ANALYTICS_ENABLED ? 'enabled' : 'disabled',
      abTesting: env.AB_TESTING_ENABLED ? 'enabled' : 'disabled'
    },
    conversion: {
      tracking: env.CONVERSION_TRACKING_ENABLED,
      privacy: {
        gdpr: env.GDPR_COMPLIANCE_ENABLED,
        ccpa: env.CCPA_COMPLIANCE_ENABLED,
        anonymizeIps: env.ANONYMIZE_IPS
      },
      performance: {
        monitoring: env.ENABLE_PERFORMANCE_MONITORING,
        threshold: `${env.PERFORMANCE_THRESHOLD_P95}ms`,
        errorThreshold: `${(env.ERROR_RATE_THRESHOLD * 100).toFixed(1)}%`
      }
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
    // Enhanced database health check with better error handling
    const { testDatabaseConnection } = await import('./db');
    
    // Test database connectivity with proper timeout
    const dbTest = await testDatabaseConnection(10000);
    
    if (dbTest.success) {
      healthCheck.services.database = 'connected';
      healthCheck.services.databaseDetails = dbTest.connectionInfo;
    } else {
      throw new Error(dbTest.error || 'Unknown database error');
    }
    
    // Check if conversion tracking tables exist with better error handling
    try {
      const { pool } = await import('./db');
      const conversionTablesCheck = pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('analytics_events', 'ab_tests', 'conversion_funnels', 'user_consent')
      `);
      const conversionTablesResult = await Promise.race([
        conversionTablesCheck,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Conversion tables check timeout')), 5000))
      ]);
      
      const tableNames = conversionTablesResult.rows.map(row => row.table_name);
      healthCheck.conversion = {
        ...healthCheck.conversion,
        tablesReady: conversionTablesResult.rows.length === 4,
        tablesFound: tableNames,
        tableCount: conversionTablesResult.rows.length
      };
    } catch (error) {
      logger.warn('Conversion tables check failed:', error);
      healthCheck.conversion = {
        ...healthCheck.conversion,
        tablesReady: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
  } catch (error) {
    logger.error('Health check database error:', error);
    healthCheck.services.database = 'disconnected';
    healthCheck.services.databaseError = error.message;
    healthCheck.status = 'unhealthy';
    
    // Return 503 for database connection failures in production
    // This allows Railway to detect the issue and potentially restart
    const responseTime = Date.now() - startTime;
    healthCheck.checks = {
      ...healthCheck.checks,
      responseTime: `${responseTime}ms`
    };
    
    if (isProduction()) {
      return res.status(503).json(healthCheck);
    }
  }

  const responseTime = Date.now() - startTime;
  healthCheck.checks = {
    ...healthCheck.checks,
    responseTime: `${responseTime}ms`
  };

  // Always return 200 for Railway health checks to prevent restart loops
  res.status(200).json(healthCheck);
});

// Readiness probe for Railway
app.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe for Railway - simple endpoint that always responds
app.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    railway: process.env.RAILWAY_ENVIRONMENT || 'local'
  });
});

// Production security middleware (applied AFTER health checks)
app.use(forceHTTPS);
app.use(productionSecurityHeaders);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced logging middleware for production monitoring
app.use((req, res, next) => {
  if (!getEnv().ENABLE_REQUEST_LOGGING) {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // Log API calls and errors
    if (req.path.startsWith("/api") || res.statusCode >= 400) {
      logger.logRequest(req, res, duration);
    }
  });

  next();
});

(async () => {
  try {
    logger.info('Starting application server...');
    
    // Initialize database connection with retry logic for Railway
    if (isProduction()) {
      logger.info('Initializing database connection for production...');
      try {
        const { initializeDatabase } = await import('./db');
        await initializeDatabase();
        logger.info('✅ Database connection initialized successfully');
      } catch (error) {
        logger.error('❌ Failed to initialize database connection:', error);
        // Don't exit immediately in production, let health checks handle it
        logger.warn('⚠️ Continuing startup despite database connection failure - health checks will monitor connectivity');
      }
    }
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      logger.error(`HTTP Error ${status}`, err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      // SPA fallback for production - returns index.html for unknown routes
      app.use(history({ 
        disableDotRule: true, 
        htmlAcceptHeaders: ["text/html", "application/xhtml+xml"] 
      }));
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const env = getEnv();
    const port = env.PORT;
    
    // Railway environment detected - no startup delay needed as health checks handle readiness
    
    const httpServer = server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      logger.info(`Server started`, {
        port,
        environment: env.NODE_ENV,
        railway: env.RAILWAY_ENVIRONMENT || "local",
        healthCheck: "/live",
        readinessCheck: "/ready"
      });
    });

    // Graceful shutdown handling for production and Railway deployments
    const gracefulShutdown = (signal: string) => {
      logger.warn(`Received ${signal}. Starting graceful shutdown...`);
      
      httpServer.close((err) => {
        if (err) {
          logger.error("Error during server shutdown", err);
          process.exit(1);
        }
        
        logger.info("Server closed successfully");
        
        // Close database connections
        if (typeof pool?.end === 'function') {
          pool.end().then(() => {
            logger.info("Database connections closed");
            process.exit(0);
          }).catch((error) => {
            logger.error("Error closing database connections", error);
            process.exit(1);
          });
        } else {
          process.exit(0);
        }
      });

      // Railway gives us 30 seconds for graceful shutdown, so force shutdown after 25 seconds
      const shutdownTimeout = env.RAILWAY_ENVIRONMENT ? 25000 : 30000;
      setTimeout(() => {
        logger.error(`Forced shutdown after ${shutdownTimeout / 1000} seconds`);
        process.exit(1);
      }, shutdownTimeout);
    };

    // Listen for shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions in production
    if (isProduction()) {
      process.on("uncaughtException", (error) => {
        logger.error("Uncaught Exception", error);
        gracefulShutdown("UNCAUGHT_EXCEPTION");
      });

      process.on("unhandledRejection", (reason, promise) => {
        logger.error("Unhandled Rejection", reason instanceof Error ? reason : new Error(String(reason)), {
          promise: String(promise)
        });
        gracefulShutdown("UNHANDLED_REJECTION");
      });
    }

  } catch (error) {
    logger.error("Failed to start server", error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
})();
