/**
 * Global Error Handler Utility
 *
 * Provides centralized error creation, categorization, and response handling
 * for all types of errors across the application. Follows Single Responsibility
 * Principle (SRP) and supports extensible error handling patterns.
 * @module utilities/errorHandler
 */

import { JsonResponse } from "@/types/express-extension";

/**
 * Core error categories for the application
 */
export enum ErrorCategory {
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  DATABASE = "DATABASE",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  INTERNAL_SERVER = "INTERNAL_SERVER",
  BAD_REQUEST = "BAD_REQUEST",
}

/**
 * Specific error types within each category
 */
export enum ErrorType {
  // Authentication errors
  NO_TOKEN = "NO_TOKEN",
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  MALFORMED_TOKEN = "MALFORMED_TOKEN",
  TOKEN_VERIFICATION_FAILED = "TOKEN_VERIFICATION_FAILED",

  // Authorization errors
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  ACCESS_DENIED = "ACCESS_DENIED",

  // Validation errors
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Resource errors
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",

  // Rate limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS",

  // Database errors
  DATABASE_CONNECTION_FAILED = "DATABASE_CONNECTION_FAILED",
  DATABASE_QUERY_FAILED = "DATABASE_QUERY_FAILED",

  // External service errors
  EXTERNAL_API_FAILED = "EXTERNAL_API_FAILED",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Internal errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
}

/**
 * Standardized error structure
 */
export interface AppError {
  category: ErrorCategory;
  type: ErrorType;
  message: string;
  statusCode: number;
  details?: any;
  retryAfter?: number;
  retryable?: boolean;
}

/**
 * Error configuration mapping
 */
const ERROR_CONFIG: Record<
  ErrorType,
  {
    category: ErrorCategory;
    statusCode: number;
    defaultMessage: string;
    retryable?: boolean;
  }
> = {
  // Authentication errors
  [ErrorType.NO_TOKEN]: {
    category: ErrorCategory.AUTHENTICATION,
    statusCode: 401,
    defaultMessage: "Authentication token is required",
  },
  [ErrorType.INVALID_TOKEN]: {
    category: ErrorCategory.AUTHENTICATION,
    statusCode: 401,
    defaultMessage: "Invalid authentication token",
  },
  [ErrorType.EXPIRED_TOKEN]: {
    category: ErrorCategory.AUTHENTICATION,
    statusCode: 401,
    defaultMessage: "Authentication token has expired",
    retryable: true,
  },
  [ErrorType.MALFORMED_TOKEN]: {
    category: ErrorCategory.AUTHENTICATION,
    statusCode: 400,
    defaultMessage: "Malformed authentication token",
  },
  [ErrorType.TOKEN_VERIFICATION_FAILED]: {
    category: ErrorCategory.AUTHENTICATION,
    statusCode: 401,
    defaultMessage: "Token verification failed",
  },

  // Authorization errors
  [ErrorType.INSUFFICIENT_PERMISSIONS]: {
    category: ErrorCategory.AUTHORIZATION,
    statusCode: 403,
    defaultMessage: "Insufficient permissions to access this resource",
  },
  [ErrorType.ACCESS_DENIED]: {
    category: ErrorCategory.AUTHORIZATION,
    statusCode: 403,
    defaultMessage: "Access denied",
  },

  // Validation errors
  [ErrorType.VALIDATION_FAILED]: {
    category: ErrorCategory.VALIDATION,
    statusCode: 400,
    defaultMessage: "Validation failed",
  },
  [ErrorType.INVALID_INPUT]: {
    category: ErrorCategory.VALIDATION,
    statusCode: 400,
    defaultMessage: "Invalid input provided",
  },
  [ErrorType.MISSING_REQUIRED_FIELD]: {
    category: ErrorCategory.VALIDATION,
    statusCode: 400,
    defaultMessage: "Required field is missing",
  },

  // Resource errors
  [ErrorType.RESOURCE_NOT_FOUND]: {
    category: ErrorCategory.NOT_FOUND,
    statusCode: 404,
    defaultMessage: "Resource not found",
  },
  [ErrorType.RESOURCE_CONFLICT]: {
    category: ErrorCategory.CONFLICT,
    statusCode: 409,
    defaultMessage: "Resource conflict",
  },

  // Rate limiting
  [ErrorType.RATE_LIMIT_EXCEEDED]: {
    category: ErrorCategory.RATE_LIMIT,
    statusCode: 429,
    defaultMessage: "Rate limit exceeded",
    retryable: true,
  },
  [ErrorType.TOO_MANY_ATTEMPTS]: {
    category: ErrorCategory.RATE_LIMIT,
    statusCode: 429,
    defaultMessage: "Too many attempts",
    retryable: true,
  },

  // Database errors
  [ErrorType.DATABASE_CONNECTION_FAILED]: {
    category: ErrorCategory.DATABASE,
    statusCode: 503,
    defaultMessage: "Database connection failed",
    retryable: true,
  },
  [ErrorType.DATABASE_QUERY_FAILED]: {
    category: ErrorCategory.DATABASE,
    statusCode: 500,
    defaultMessage: "Database query failed",
    retryable: true,
  },

  // External service errors
  [ErrorType.EXTERNAL_API_FAILED]: {
    category: ErrorCategory.EXTERNAL_SERVICE,
    statusCode: 502,
    defaultMessage: "External service failed",
    retryable: true,
  },
  [ErrorType.SERVICE_UNAVAILABLE]: {
    category: ErrorCategory.EXTERNAL_SERVICE,
    statusCode: 503,
    defaultMessage: "Service temporarily unavailable",
    retryable: true,
  },

  // Internal errors
  [ErrorType.INTERNAL_SERVER_ERROR]: {
    category: ErrorCategory.INTERNAL_SERVER,
    statusCode: 500,
    defaultMessage: "Internal server error",
  },
  [ErrorType.CONFIGURATION_ERROR]: {
    category: ErrorCategory.INTERNAL_SERVER,
    statusCode: 500,
    defaultMessage: "Configuration error",
  },
};

/**
 * Create a standardized application error
 * @param type - Type of error
 * @param message - Optional custom error message
 * @param details - Optional additional error details
 * @param retryAfter - Optional retry delay in seconds
 * @returns Standardized AppError object
 */
export const createError = (
  type: ErrorType,
  message?: string,
  details?: any,
  retryAfter?: number
): AppError => {
  const config = ERROR_CONFIG[type];

  return {
    category: config.category,
    type,
    message: message || config.defaultMessage,
    statusCode: config.statusCode,
    details,
    retryAfter,
    retryable: config.retryable,
  };
};

/**
 * Send standardized error response
 * @param res - Express JSON response object
 * @param error - AppError object to send
 */
export const sendErrorResponse = (res: JsonResponse, error: AppError): void => {
  const response: any = {
    statusCode: error.statusCode,
    message: error.message,
    error: {
      category: error.category,
      type: error.type,
      code: `${error.category}_${error.type}`,
    },
  };

  // Add additional fields for specific error types
  if (error.details) {
    response.error.details = error.details;
  }

  if (error.retryAfter) {
    response.retryAfter = error.retryAfter;
    response.error.retryable = true;
  }

  if (error.retryable) {
    response.error.retryable = error.retryable;
  }

  res.status(error.statusCode).json(response);
};

/**
 * Parse JWT errors and create appropriate AppError
 * @param error - Error object from JWT verification
 * @param customMessage - Optional custom error message
 * @returns Appropriate AppError object
 */
export const parseJwtError = (error: any, customMessage?: string): AppError => {
  if (
    error.message?.includes("expired") ||
    error.name === "TokenExpiredError"
  ) {
    return createError(ErrorType.EXPIRED_TOKEN, customMessage);
  }

  if (
    error.message?.includes("invalid") ||
    error.message?.includes("signature")
  ) {
    return createError(ErrorType.INVALID_TOKEN, customMessage);
  }

  return createError(
    ErrorType.TOKEN_VERIFICATION_FAILED,
    customMessage || error.message
  );
};

/**
 * Parse database errors and create appropriate AppError
 * @param error - Database error object
 * @param customMessage - Optional custom error message
 * @returns Appropriate AppError object
 */
export const parseDatabaseError = (
  error: any,
  customMessage?: string
): AppError => {
  if (error.code === "ECONNREFUSED" || error.message?.includes("connection")) {
    return createError(ErrorType.DATABASE_CONNECTION_FAILED, customMessage);
  }

  if (error.constraint || error.code === "23505") {
    return createError(
      ErrorType.RESOURCE_CONFLICT,
      customMessage || "Duplicate resource"
    );
  }

  return createError(
    ErrorType.DATABASE_QUERY_FAILED,
    customMessage || error.message
  );
};

/**
 * Parse validation errors and create appropriate AppError
 * @param validationErrors - Validation error details
 * @param customMessage - Optional custom error message
 * @returns Appropriate AppError object
 */
export const parseValidationError = (
  validationErrors: any,
  customMessage?: string
): AppError => {
  return createError(
    ErrorType.VALIDATION_FAILED,
    customMessage || "Input validation failed",
    validationErrors
  );
};

/**
 * Create rate limit error with retry information
 * @param retryAfter - Retry delay in seconds
 * @param customMessage - Optional custom error message
 * @returns AppError object with retry information
 */
export const createRateLimitError = (
  retryAfter: number,
  customMessage?: string
): AppError => {
  return createError(
    ErrorType.RATE_LIMIT_EXCEEDED,
    customMessage,
    undefined,
    retryAfter
  );
};

/**
 * Create resource not found error
 * @param resourceType - Type of resource that was not found
 * @param identifier - Resource identifier
 * @returns AppError object
 */
export const createNotFoundError = (
  resourceType: string,
  identifier?: string
): AppError => {
  const message = identifier
    ? `${resourceType} with identifier '${identifier}' not found`
    : `${resourceType} not found`;

  return createError(ErrorType.RESOURCE_NOT_FOUND, message);
};

/**
 * Create generic internal server error (fallback for unhandled errors)
 * @param error - Original error object
 * @param customMessage - Optional custom error message
 * @returns AppError object
 */
export const createInternalError = (
  error?: any,
  customMessage?: string
): AppError => {
  const message =
    customMessage ||
    (process.env.NODE_ENV === "development"
      ? error?.message
      : "Internal server error");

  return createError(ErrorType.INTERNAL_SERVER_ERROR, message);
};

// Legacy compatibility exports for authentication errors
export { ErrorType as AuthErrorType };
export type AuthError = AppError;
export const createAuthError = createError;
export const sendAuthError = sendErrorResponse;
