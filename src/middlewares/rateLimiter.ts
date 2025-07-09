/**
 * Rate Limiting Middleware
 *
 * Provides rate limiting functionality to prevent abuse of authentication
 * endpoints and general API endpoints.
 *
 * @module middlewares/rateLimiter
 */

import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Rate limit configuration interface
 */
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

/**
 * Get rate limit configuration from environment variables
 */
const getRateLimitConfig = (): RateLimitConfig => {
  return {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "5"), // 5 requests default
    message: "Too many requests, please try again later.",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  };
};

/**
 * Custom key generator for rate limiting based on IP and user ID
 */
const generateKey = (req: Request): string => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const userId = (req as any).user?.id;

  // If user is authenticated, use user ID + IP for more precise limiting
  if (userId) {
    return `${ip}:${userId}`;
  }

  // For unauthenticated requests, use IP only
  return ip;
};

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req: Request, res: Response): void => {
  const resetTime = new Date(Date.now() + getRateLimitConfig().windowMs);

  res.status(429).json({
    statusCode: 429,
    message: "Rate limit exceeded",
    error: "Too many requests from this IP, please try again later.",
    retryAfter: Math.ceil(getRateLimitConfig().windowMs / 1000),
    resetTime: resetTime.toISOString(),
  });

  return;
};

/**
 * Rate limiting middleware for authentication endpoints
 * Limits to 5 requests per minute per IP/User
 */
exports.authRateLimit = rateLimit({
  windowMs: getRateLimitConfig().windowMs,
  max: getRateLimitConfig().max,
  message: getRateLimitConfig().message,
  standardHeaders: getRateLimitConfig().standardHeaders,
  legacyHeaders: getRateLimitConfig().legacyHeaders,
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  skip: (req: Request): boolean => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === "test";
  },
});

/**
 * General API rate limiting middleware
 * More lenient limits for general API usage
 */
exports.generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many API requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  skip: (req: Request): boolean => {
    return process.env.NODE_ENV === "test";
  },
});

/**
 * Strict rate limiting for sensitive endpoints (password reset, etc.)
 */
exports.strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour for sensitive operations
  message:
    "Too many attempts for this sensitive operation, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: (req: Request, res: Response): void => {
    const resetTime = new Date(Date.now() + 60 * 60 * 1000);

    res.status(429).json({
      statusCode: 429,
      message: "Rate limit exceeded for sensitive operation",
      error:
        "Too many attempts. For security reasons, please wait before trying again.",
      retryAfter: 3600, // 1 hour in seconds
      resetTime: resetTime.toISOString(),
    });
  },
  skip: (req: Request): boolean => {
    return process.env.NODE_ENV === "test";
  },
});

/**
 * Progressive rate limiting that increases restrictions based on failed attempts
 */
let failedAttempts: Map<string, { count: number; lastAttempt: number }> =
  new Map();

/**
 * Clean up old failed attempts (run this periodically)
 */
const cleanupFailedAttempts = (): void => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [key, data] of failedAttempts.entries()) {
    if (data.lastAttempt < oneHourAgo) {
      failedAttempts.delete(key);
    }
  }
};

/**
 * Progressive rate limiting middleware for login attempts
 */
exports.progressiveAuthRateLimit = (
  req: Request,
  res: Response,
  next: any
): void => {
  const key = generateKey(req);
  const now = Date.now();
  const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: 0 };

  // Clean up old attempts periodically
  if (Math.random() < 0.1) {
    // 10% chance to trigger cleanup
    cleanupFailedAttempts();
  }

  // Calculate delay based on failed attempts
  let requiredDelay = 0;
  if (attempts.count >= 3) {
    requiredDelay = Math.min(attempts.count * 60 * 1000, 30 * 60 * 1000); // Max 30 minutes
  }

  const timeSinceLastAttempt = now - attempts.lastAttempt;

  if (attempts.count >= 3 && timeSinceLastAttempt < requiredDelay) {
    const remainingDelay = Math.ceil(
      (requiredDelay - timeSinceLastAttempt) / 1000
    );

    res.status(429).json({
      statusCode: 429,
      message: "Account temporarily locked due to multiple failed attempts",
      error: `Please wait ${remainingDelay} seconds before trying again.`,
      retryAfter: remainingDelay,
      resetTime: new Date(now + requiredDelay).toISOString(),
    });
    return;
  }

  // Store this request for potential future rate limiting
  req.rateLimitKey = key;

  next();
};

/**
 * Record a failed authentication attempt
 */
exports.recordFailedAttempt = (key: string): void => {
  const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: 0 };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  failedAttempts.set(key, attempts);
};

/**
 * Clear failed attempts for successful authentication
 */
exports.clearFailedAttempts = (key: string): void => {
  failedAttempts.delete(key);
};

/**
 * Get current failed attempts count for a key
 */
exports.getFailedAttemptsCount = (key: string): number => {
  return failedAttempts.get(key)?.count || 0;
};

/**
 * Custom rate limiting for specific endpoints
 */
exports.createCustomRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}): any => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || "Rate limit exceeded",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skip: (req: Request): boolean => {
      return process.env.NODE_ENV === "test";
    },
  });
};

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      rateLimitKey?: string;
    }
  }
}
