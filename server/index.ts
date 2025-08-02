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
