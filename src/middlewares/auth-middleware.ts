/**
 * Authentication Middleware
 *
 * Main entry point for authentication middleware functions with enhanced
 * error handling and user context extraction. Refactored to use the new
 * generic middleware factory system following SOLID principles.
 *
 * @module middlewares/authMiddleware
 */

import {
  createAccessTokenMiddleware,
  createRefreshTokenMiddleware,
  createVerificationTokenMiddleware,
} from "@/factories/auth-middleware-factory";

// Export authentication middleware functions using the new factory system
export const accessToken = createAccessTokenMiddleware();
export const refreshToken = createRefreshTokenMiddleware();
export const verificationToken = createVerificationTokenMiddleware();

// CommonJS exports for backward compatibility
exports.accessToken = accessToken;
exports.refreshToken = refreshToken;
exports.verificationToken = verificationToken;
