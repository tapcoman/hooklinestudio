import { getEnv, isProduction } from "./env-validation";

export interface LogEntry {
  level: "error" | "warn" | "info" | "debug";
  message: string;
  timestamp: string;
  environment: string;
  service: string;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private env = getEnv();
  private service = "hook-line-studio";

  private createLogEntry(
    level: LogEntry["level"], 
    message: string, 
    data?: Record<string, any>, 
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: this.env.NODE_ENV,
      service: this.service,
    };

    if (data) {
      entry.data = data;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: isProduction() ? undefined : error.stack,
      };
    }

    return entry;
  }

  private shouldLog(level: LogEntry["level"]): boolean {
    const levels = ["error", "warn", "info", "debug"];
    const currentLevelIndex = levels.indexOf(this.env.LOG_LEVEL);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex <= currentLevelIndex;
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    if (isProduction()) {
      // Structured JSON logging for production (Railway log aggregation)
      console.log(JSON.stringify(entry));
    } else {
      // Human-readable logging for development
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const prefix = `[${timestamp}] ${entry.level.toUpperCase()}:`;
      
      if (entry.error) {
        console.log(`${prefix} ${entry.message}`);
        console.error(entry.error.stack || entry.error.message);
        if (entry.data) {
          console.log("Data:", entry.data);
        }
      } else {
        const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
        console.log(`${prefix} ${entry.message}${dataStr}`);
      }
    }
  }

  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.output(this.createLogEntry("error", message, data, error));
  }

  warn(message: string, data?: Record<string, any>): void {
    this.output(this.createLogEntry("warn", message, data));
  }

  info(message: string, data?: Record<string, any>): void {
    this.output(this.createLogEntry("info", message, data));
  }

  debug(message: string, data?: Record<string, any>): void {
    this.output(this.createLogEntry("debug", message, data));
  }

  // HTTP request logging
  logRequest(req: any, res: any, duration: number): void {
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    
    this.output(this.createLogEntry(level, "HTTP Request", {
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get?.('User-Agent')?.substring(0, 100),
      userId: req.user?.id || req.firebaseUser?.uid,
    }));
  }

  // Database operation logging
  logDatabase(operation: string, table: string, duration?: number, error?: Error): void {
    if (error) {
      this.error(`Database ${operation} failed`, error, { table, duration });
    } else {
      this.debug(`Database ${operation}`, { table, duration });
    }
  }

  // External API logging
  logExternalAPI(service: string, operation: string, duration?: number, error?: Error): void {
    if (error) {
      this.error(`${service} API call failed`, error, { operation, duration });
    } else {
      this.info(`${service} API call`, { operation, duration });
    }
  }
}

export const logger = new Logger();

// Export convenience functions for compatibility
export const log = (message: string) => logger.info(message);
export const logError = (message: string, error?: Error) => logger.error(message, error);
export const logWarn = (message: string) => logger.warn(message);
export const logDebug = (message: string) => logger.debug(message);