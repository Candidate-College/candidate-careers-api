/**
 * Authentication Middleware
 *
 * Provides middleware functions for verifying JWT tokens with enhanced
 * error handling and user context extraction.
 * @module middlewares/authMiddleware
 */

import { NextFunction } from "express";
import { AuthenticatedRequest, JsonResponse } from "@/types/express-extension";

const jwt = require("@/utilities/jwt");
const { TokenType } = require("@/services/auth/JwtService");

/**
 * Authentication error types
 */
enum AuthErrorType {
  NO_TOKEN = "NO_TOKEN",
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  MALFORMED_TOKEN = "MALFORMED_TOKEN",
  TOKEN_VERIFICATION_FAILED = "TOKEN_VERIFICATION_FAILED",
}

/**
 * Enhanced error response structure
 */
interface AuthError {
  type: AuthErrorType;
  message: string;
  statusCode: number;
}

/**
 * Extract token from Authorization header
 */
const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
};

/**
 * Create standardized authentication error
 */
const createAuthError = (type: AuthErrorType, message?: string): AuthError => {
  const errors: Record<AuthErrorType, { message: string; statusCode: number }> =
    {
      [AuthErrorType.NO_TOKEN]: {
        message: "Authentication token is required",
        statusCode: 401,
      },
      [AuthErrorType.INVALID_TOKEN]: {
        message: "Invalid authentication token",
        statusCode: 401,
      },
      [AuthErrorType.EXPIRED_TOKEN]: {
        message: "Authentication token has expired",
        statusCode: 401,
      },
      [AuthErrorType.MALFORMED_TOKEN]: {
        message: "Malformed authentication token",
        statusCode: 400,
      },
      [AuthErrorType.TOKEN_VERIFICATION_FAILED]: {
        message: "Token verification failed",
        statusCode: 401,
      },
    };

  const defaultError = errors[type];
  return {
    type,
    message: message || defaultError.message,
    statusCode: defaultError.statusCode,
  };
};

/**
 * Extract and validate user context from token payload
 */
const extractUserContext = (payload: any): any => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid token payload");
  }

  // Ensure required fields exist
  if (!payload.id && !payload.sessionId) {
    throw new Error("Token payload missing user identification");
  }

  return {
    id: payload.id || payload.sessionId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
    iat: payload.iat,
    exp: payload.exp,
  };
};

/**
 * Send authentication error response
 */
const sendAuthError = (res: JsonResponse, error: AuthError): void => {
  res.status(error.statusCode).json({
    statusCode: error.statusCode,
    message: error.message,
    error: {
      type: error.type,
      code: `AUTH_${error.type}`,
    },
  });
};

/**
 * Validate JWT token format
 */
const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== "string") {
    return false;
  }

  // Basic JWT format check: header.payload.signature
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  // Check if each part is base64url encoded
  const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
  return parts.every((part) => base64UrlPattern.test(part));
};

/**
 * Middleware to verify access tokens in the Authorization header
 * @param {AuthenticatedRequest} req - Express request object
 * @param {JsonResponse} res - Express JSON response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
exports.accessToken = (
  req: AuthenticatedRequest,
  res: JsonResponse,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      const error = createAuthError(AuthErrorType.NO_TOKEN);
      return sendAuthError(res, error);
    }

    // Verify token format before attempting verification
    if (!isValidTokenFormat(token)) {
      const error = createAuthError(AuthErrorType.MALFORMED_TOKEN);
      return sendAuthError(res, error);
    }

    // Verify the access token
    const payload = jwt.access.verify(token);

    // Extract and validate user context
    const userContext = extractUserContext(payload);

    // Set user context on request
    req.user = userContext;

    // Initialize req.body if it doesn't exist
    if (!req.body) {
      req.body = {};
    }

    // Add user ID to request body for backward compatibility
    if (userContext.id) {
      req.body.id = userContext.id;
    }

    next();
  } catch (error: any) {
    let authError: AuthError;

    if (error.message.includes("expired")) {
      authError = createAuthError(AuthErrorType.EXPIRED_TOKEN);
    } else if (
      error.message.includes("invalid") ||
      error.message.includes("signature")
    ) {
      authError = createAuthError(AuthErrorType.INVALID_TOKEN);
    } else {
      authError = createAuthError(
        AuthErrorType.TOKEN_VERIFICATION_FAILED,
        error.message
      );
    }

    return sendAuthError(res, authError);
  }
};

/**
 * Middleware to verify refresh tokens in the request body
 * @param {AuthenticatedRequest} req - Express request object
 * @param {JsonResponse} res - Express JSON response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
exports.refreshToken = (
  req: AuthenticatedRequest,
  res: JsonResponse,
  next: NextFunction
): void => {
  try {
    const refreshToken = req.cookies["refresh_token"];

    if (!refreshToken) {
      const error = createAuthError(
        AuthErrorType.NO_TOKEN,
        "Refresh token is required"
      );
      return sendAuthError(res, error);
    }

    // Verify token format
    if (!isValidTokenFormat(refreshToken)) {
      const error = createAuthError(
        AuthErrorType.MALFORMED_TOKEN,
        "Invalid refresh token format"
      );
      return sendAuthError(res, error);
    }

    // Verify the refresh token
    const payload = jwt.refresh.verify(refreshToken);

    // Set session data on request
    req.user = {
      session: payload,
      sessionId: payload.id,
      exp: payload.exp,
      iat: payload.iat,
    };

    next();
  } catch (error: any) {
    // For refresh tokens, we want to handle expired tokens differently
    // Let the controller handle expired tokens for token rotation
    if (
      error.message.includes("expired") ||
      error.name === "TokenExpiredError"
    ) {
      req.user = {
        session: {
          id: "",
          exp: 0,
          iat: 0,
          expired: true,
        },
      };
      return next();
    }

    let authError: AuthError;

    if (
      error.message.includes("invalid") ||
      error.message.includes("signature")
    ) {
      authError = createAuthError(
        AuthErrorType.INVALID_TOKEN,
        "Invalid refresh token"
      );
    } else {
      authError = createAuthError(
        AuthErrorType.TOKEN_VERIFICATION_FAILED,
        error.message
      );
    }

    return sendAuthError(res, authError);
  }
};

/**
 * Middleware to verify email verification tokens in the request body
 * @param {AuthenticatedRequest} req - Express request object
 * @param {JsonResponse} res - Express JSON response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
exports.verificationToken = (
  req: AuthenticatedRequest,
  res: JsonResponse,
  next: NextFunction
): void => {
  const { token: verificationToken } = req.body;

  if (!verificationToken) {
    res.error(401, "Token is required!");
    return;
  }

  try {
    const payload = jwt.verification.verify(verificationToken);
    req.user = payload;
    next();
  } catch (error: any) {
    res.error(401, "Invalid or expired verification token");
    return; // Properly handle the exception by stopping execution
  }
};
