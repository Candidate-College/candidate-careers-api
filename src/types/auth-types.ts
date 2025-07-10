/**
 * Authentication Types and Interfaces
 *
 * Defines core types, enums, and interfaces for authentication middleware
 * following Interface Segregation Principle (ISP).
 * @module types/authTypes
 */

// Import from the new generic error handler for consistency
import { ErrorType, AppError } from "@/utilities/error-handler";

/**
 * Authentication error types for standardized error handling
 * @deprecated Use ErrorType from @/utilities/error-handler instead
 */
export enum AuthErrorType {
  NO_TOKEN = "NO_TOKEN",
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  MALFORMED_TOKEN = "MALFORMED_TOKEN",
  TOKEN_VERIFICATION_FAILED = "TOKEN_VERIFICATION_FAILED",
}

/**
 * Enhanced error response structure
 * @deprecated Use AppError from @/utilities/error-handler instead
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  statusCode: number;
}

/**
 * User context interface for authenticated requests
 */
export interface UserContext {
  id?: string;
  email?: string;
  role?: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Session context interface for refresh token handling
 */
export interface SessionContext {
  session: {
    id: string;
    exp: number;
    iat: number;
    expired?: boolean;
  };
  sessionId?: string;
  exp?: number;
  iat?: number;
}

/**
 * Token payload interface for type safety
 */
export interface TokenPayload {
  id?: string;
  sessionId?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

// Re-export modern types for forward compatibility
export { ErrorType, AppError } from "@/utilities/error-handler";
