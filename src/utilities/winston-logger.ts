/**
 * Winston Logger Wrapper
 *
 * Enhanced logging wrapper providing async capabilities, structured logging,
 * and backward compatibility. Implements exactly 3 levels: INFO, WARN, ERROR.
 */

import winston from "winston";
import { defaultLogger } from "@/config/logger";

/**
 * Logging metadata interface for structured logging
 */
export interface LogMetadata {
  userId?: number | string;
  sessionId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: number | string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Log level type
 */
export type LogLevel = "info" | "warn" | "error";

/**
 * Winston Logger Wrapper Class
 */
export class WinstonLogger {
  private readonly logger: winston.Logger;
  private readonly fallbackEnabled: boolean;

  constructor(config?: winston.LoggerOptions) {
    this.fallbackEnabled = true;

    try {
      this.logger = config ? winston.createLogger(config) : defaultLogger;
    } catch (error) {
      this.handleLoggerCreationError(error);
      // Fallback to default logger
      this.logger = defaultLogger;
    }
  }

  /**
   * Log INFO level messages
   */
  info(message: string, metadata?: LogMetadata): void {
    this.logSafely("info", message, metadata);
  }

  /**
   * Log WARN level messages
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.logSafely("warn", message, metadata);
  }

  /**
   * Log ERROR level messages
   */
  error(
    message: string,
    error?: Error | LogMetadata,
    metadata?: LogMetadata
  ): void {
    if (error instanceof Error) {
      const combinedMetadata = {
        ...metadata,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      };
      this.logSafely("error", message, combinedMetadata);
    } else {
      this.logSafely("error", message, error);
    }
  }

  /**
   * Backward compatibility method - maps to info
   */
  log(message: string, metadata?: LogMetadata): void {
    this.info(message, metadata);
  }

  /**
   * Async INFO logging
   */
  async asyncInfo(message: string, metadata?: LogMetadata): Promise<void> {
    return this.logAsync("info", message, metadata);
  }

  /**
   * Async WARN logging
   */
  async asyncWarn(message: string, metadata?: LogMetadata): Promise<void> {
    return this.logAsync("warn", message, metadata);
  }

  /**
   * Async ERROR logging
   */
  async asyncError(
    message: string,
    error?: Error | LogMetadata,
    metadata?: LogMetadata
  ): Promise<void> {
    if (error instanceof Error) {
      const combinedMetadata = {
        ...metadata,
        error: this.serializeError(error),
      };
      return this.logAsync("error", message, combinedMetadata);
    } else {
      return this.logAsync("error", message, error);
    }
  }

  /**
   * Batch logging for multiple messages
   */
  batchLog(
    entries: Array<{
      level: LogLevel;
      message: string;
      metadata?: LogMetadata;
    }>
  ): void {
    entries.forEach((entry) => {
      this.logSafely(entry.level, entry.message, entry.metadata);
    });
  }

  /**
   * Configure logger level dynamically
   */
  setLevel(level: LogLevel): void {
    try {
      this.logger.level = level;
    } catch (error) {
      this.fallbackToConsole("warn", `Failed to set log level: ${level}`, {
        error,
      });
    }
  }

  /**
   * Get current logger configuration
   */
  getConfig(): { level: string; transports: any[] } {
    return {
      level: this.logger.level,
      transports: this.logger.transports || [],
    };
  }

  /**
   * Safe logging with error handling
   */
  private logSafely(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): void {
    try {
      const sanitizedMetadata = this.sanitizeMetadata(metadata);
      this.logger[level](message, sanitizedMetadata);
    } catch (error) {
      if (this.fallbackEnabled) {
        try {
          this.fallbackToConsole(level, message, metadata);
        } catch (fallbackError) {
          console.error("Critical logging failure with fallback:", message, {
            originalError: error,
            fallbackError,
          });
        }
      }
    }
  }

  /**
   * Async logging implementation
   */
  private async logAsync(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): Promise<void> {
    return new Promise((resolve) => {
      try {
        const sanitizedMetadata = this.sanitizeMetadata(metadata);
        this.logger[level](message, sanitizedMetadata, () => {
          resolve();
        });
      } catch (error) {
        if (this.fallbackEnabled) {
          try {
            this.fallbackToConsole(level, message, metadata);
          } catch (fallbackError) {
            console.error("Critical async logging failure:", message, {
              originalError: error,
              fallbackError,
            });
          }
        }
        resolve();
      }
    });
  }

  /**
   * Sanitize metadata to handle circular references and invalid data
   */
  private sanitizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
    if (!metadata) return undefined;

    try {
      // Test if metadata can be serialized (catches circular references)
      JSON.stringify(metadata);
      return metadata;
    } catch (error) {
      // Handle the error by removing circular references
      this.fallbackToConsole(
        "warn",
        "Metadata contains circular references, sanitizing",
        { error }
      );
      return this.removeCircularReferences(metadata);
    }
  }

  /**
   * Remove circular references from metadata
   */
  private removeCircularReferences(obj: any, seen = new WeakSet()): any {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (seen.has(obj)) {
      return "[Circular Reference]";
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeCircularReferences(item, seen));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      try {
        cleaned[key] = this.removeCircularReferences(value, seen);
      } catch (error) {
        // Log the specific property that couldn't be processed
        this.fallbackToConsole("warn", `Could not process property: ${key}`, {
          error,
        });
        cleaned[key] = "[Unserializable]";
      }
    }

    return cleaned;
  }

  /**
   * Serialize error object safely
   */
  private serializeError(error: Error): object {
    try {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
          acc[key] = (error as any)[key];
          return acc;
        }, {} as any),
      };
    } catch (error) {
      // Handle any errors during error serialization
      this.fallbackToConsole("warn", "Failed to serialize error object", {
        error,
      });
      return { name: "UnknownError", message: "Failed to serialize error" };
    }
  }

  /**
   * Fallback to console logging when Winston fails
   */
  private fallbackToConsole(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): void {
    try {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

      if (metadata) {
        console[level](logMessage, metadata);
      } else {
        console[level](logMessage);
      }
    } catch (error) {
      // Last resort if even console logging fails
      console.error("Critical logging failure:", message, error);
    }
  }

  /**
   * Handle logger creation errors
   */
  private handleLoggerCreationError(error: any): void {
    console.error("[WINSTON] Failed to create logger:", error.message);
    console.error("[WINSTON] Falling back to console logging");
  }
}

/**
 * Default Winston logger instance
 */
export const defaultWinstonLogger = new WinstonLogger();

/**
 * Convenience functions for backward compatibility
 */
export const winstonLogger = {
  info: (message: string, metadata?: LogMetadata) =>
    defaultWinstonLogger.info(message, metadata),
  warn: (message: string, metadata?: LogMetadata) =>
    defaultWinstonLogger.warn(message, metadata),
  error: (
    message: string,
    error?: Error | LogMetadata,
    metadata?: LogMetadata
  ) => defaultWinstonLogger.error(message, error, metadata),
  log: (message: string, metadata?: LogMetadata) =>
    defaultWinstonLogger.log(message, metadata),
};
