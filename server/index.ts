import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { productionSecurityHeaders, forceHTTPS } from "./middleware/security-headers";
import { validateEnvironment, isProduction, getEnv } from "./config/env-validation";
import { logger } from "./config/logger";
import history from "connect-history-api-fallback";

// Validate environment variables before starting server
validateEnvironment();

const app = express();

// Production security middleware
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
    // Run migrations on server startup for Railway compatibility
    // Railway's pre-deployment phase doesn't have reliable database access
    if (isProduction()) {
      logger.info('Running database migrations...');
      try {
        const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
        const { db } = await import("./db");
        const path = await import("path");
        
        // Resolve migrations folder path from project root
        const migrationsPath = path.resolve(process.cwd(), "migrations");
        
        // Check if migrations folder exists
        const fs = await import('fs');
        if (fs.existsSync(migrationsPath)) {
          console.log("Running database migrations...");
          
          // Retry migration execution for Railway connectivity issues
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              await migrate(db, { migrationsFolder: migrationsPath });
              console.log("Database migrations completed successfully");
              logger.info("Database migrations completed successfully");
              break;
            } catch (migrationError) {
              retryCount++;
              const errorMessage = migrationError instanceof Error ? migrationError.message : String(migrationError);
              
              console.warn(`Migration attempt ${retryCount}/${maxRetries} failed:`, errorMessage);
              
              // Check for Railway internal connectivity issues
              const isRailwayConnectivity = errorMessage.includes('postgres.railway.internal') || 
                                          errorMessage.includes('ECONNREFUSED') ||
                                          errorMessage.includes('connection refused');
              
              if (isRailwayConnectivity && retryCount < maxRetries) {
                console.log(`Railway database connectivity issue detected, waiting 10 seconds before retry ${retryCount + 1}...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
              }
              
              if (retryCount >= maxRetries) {
                // Don't crash the server, but log the error
                logger.error("Failed to run migrations, but continuing server startup", migrationError instanceof Error ? migrationError : new Error(String(migrationError)));
                console.error("Failed to run migrations, but continuing server startup");
                break;
              }
            }
          }
        } else {
          console.log("No migrations folder found, skipping migrations");
        }
      } catch (migrationError) {
        // Don't crash the server on migration errors
        logger.error("Error during migration setup", migrationError instanceof Error ? migrationError : new Error(String(migrationError)));
        console.error("Error during migration setup, continuing with server startup");
      }
    }
    
    logger.info('Starting application server...');
    
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
    const httpServer = server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      logger.info(`Server started`, {
        port,
        environment: env.NODE_ENV,
        railway: env.RAILWAY_ENVIRONMENT || "local",
        healthCheck: "/health"
      });
    });

    // Graceful shutdown handling for production
    const gracefulShutdown = (signal: string) => {
      logger.warn(`Received ${signal}. Starting graceful shutdown...`);
      
      httpServer.close((err) => {
        if (err) {
          logger.error("Error during server shutdown", err);
          process.exit(1);
        }
        
        logger.info("Server closed successfully");
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after 30 seconds");
        process.exit(1);
      }, 30000);
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
