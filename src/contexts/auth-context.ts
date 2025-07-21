/**
 * Authentication Context Module
 *
 * Provides user context extraction and validation for authenticated requests
 * following Single Responsibility Principle (SRP).
 * @module contexts/authContext
 */

import { AuthenticatedUser } from "@/types/express-extension";
import { SessionContext, TokenPayload } from "@/types/auth-types";

/**
 * Convert string ID to number for database compatibility
 * @param id - String ID from JWT token
 * @returns Number ID or undefined if conversion fails
 */
const convertIdToNumber = (id: string | undefined): number | undefined => {
  if (!id) return undefined;
  const numId = parseInt(id, 10);
  return isNaN(numId) ? undefined : numId;
};

/**
 * Extract and validate user context from token payload
 * @param payload - Token payload object
 * @returns Validated user context compatible with AuthenticatedUser interface
 * @throws Error if payload is invalid or missing required fields
 */
export const extractUserContext = (
  payload: TokenPayload
): AuthenticatedUser => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid token payload");
  }

  // Ensure required fields exist
  if (!payload.id && !payload.sessionId) {
    throw new Error("Token payload missing user identification");
  }

  const userId = payload.id || payload.sessionId;

  return {
    id: convertIdToNumber(userId),
    email: payload.email,
    role: { name: payload.role },
    sessionId: payload.sessionId,
    iat: payload.iat,
    exp: payload.exp,
  };
};

/**
 * Create session context from payload
 * @param payload - Token payload object
 * @returns Session context object
 */
export const createSessionContext = (
  payload: TokenPayload
): AuthenticatedUser => {
  return {
    session: {
      id: payload.id || payload.sessionId || "",
      exp: payload.exp || 0,
      iat: payload.iat || 0,
    },
    sessionId: payload.id || payload.sessionId,
    exp: payload.exp,
    iat: payload.iat,
  };
};

/**
 * Create expired session context from payload
 * @param payload - Token payload object (can be null)
 * @returns Session context marked as expired
 */
export const createExpiredSessionContext = (
  payload: TokenPayload | null
): AuthenticatedUser => {
  if (payload && payload.id) {
    return {
      session: {
        id: payload.id,
        exp: payload.exp || 0,
        iat: payload.iat || 0,
        expired: true,
      },
      sessionId: payload.id,
      exp: payload.exp,
      iat: payload.iat,
    };
  }

  // Fallback if we can't decode the token or no token available
  return {
    session: {
      id: "",
      exp: 0,
      iat: 0,
      expired: true,
    },
  };
};

/**
 * Add user ID to request body for backward compatibility
 * @param body - Request body object
 * @param userContext - User context with ID
 */
export const addUserIdToBody = (
  body: any,
  userContext: AuthenticatedUser
): void => {
  // Initialize req.body if it doesn't exist
  if (!body) {
    return;
  }

  // Add user ID to request body for backward compatibility
  if (userContext.id) {
    body.id = userContext.id;
  }
};
