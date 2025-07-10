/**
 * Authentication Error Handler Module (Legacy)
 *
 * Provides backward compatibility for authentication error handling.
 * This module now uses the centralized error handler utility.
 *
 * @deprecated Use @/utilities/error-handler instead for new code
 * @module middlewares/auth/errorHandler
 */

import { JsonResponse } from "@/types/express-extension";
import {
  createError,
  sendErrorResponse,
  parseJwtError,
  ErrorType,
  AppError,
} from "@/utilities/error-handler";

// Re-export types for backward compatibility with existing auth code
export { ErrorType as AuthErrorType } from "@/utilities/error-handler";
export type AuthError = AppError;

/**
 * Create standardized authentication error
 * @deprecated Use createError from @/utilities/error-handler instead
 * @param type - Type of authentication error
 * @param message - Optional custom error message
 * @returns Standardized AuthError object
 */
export const createAuthError = (
  type: ErrorType,
  message?: string
): AppError => {
  return createError(type, message);
};

/**
 * Send authentication error response
 * @deprecated Use sendErrorResponse from @/utilities/error-handler instead
 * @param res - Express JSON response object
 * @param error - AuthError object to send
 */
export const sendAuthError = (res: JsonResponse, error: AppError): void => {
  return sendErrorResponse(res, error);
};

/**
 * Parse JWT error and create appropriate AuthError
 * @deprecated Use parseJwtError from @/utilities/error-handler instead
 * @param error - Error object from JWT verification
 * @param customMessage - Optional custom error message
 * @returns Appropriate AuthError object
 */
export { parseJwtError } from "@/utilities/error-handler";
