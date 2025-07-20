/**
 * Winston Logger Configuration
 *
 * Centralized configuration for Winston logging infrastructure.
 * Supports exactly 3 levels: INFO, WARN, ERROR as required.
 * Configures multiple transports for different environments.
 */

import winston from "winston";

/**
 * Custom log levels - exactly 3 levels as required
 */
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
};

/**
 * Custom log colors for console output
 */
const LOG_COLORS = {
  error: "red",
  warn: "yellow",
  info: "green",
};

/**
 * Environment-based configuration helper
 */
const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || "development";
  const logEnabled = (process.env.ENABLE_LOG || "true") === "true";

  return {
    level: env === "production" ? "warn" : "info",
    silent: !logEnabled,
    env,
  };
};

/**
 * Create console transport configuration
 */
const createConsoleTransport = () => {
  const { env } = getEnvironmentConfig();

  return new winston.transports.Console({
    format:
      env === "development"
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json(),
  });
};

/**
 * Create file transport configuration
 */
const createFileTransport = () => {
  return new winston.transports.File({
    filename: "logs/audit.log",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  });
};

/**
 * Create comprehensive logger configuration
 */
export const createLoggerConfig = (): winston.LoggerOptions => {
  const { level, silent } = getEnvironmentConfig();

  return {
    levels: LOG_LEVELS,
    level,
    silent,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [createConsoleTransport(), createFileTransport()],
    exitOnError: false,
  };
};

/**
 * Configure colors for Winston
 */
winston.addColors(LOG_COLORS);

/**
 * Default logger instance
 */
export const defaultLogger = winston.createLogger(createLoggerConfig());
