/**
 * JWT Service
 *
 * Provides JWT token generation, verification, and refresh functionality
 * for the authentication system.
 *
 * @module services/auth/JwtService
 */

const jwt = require("@/utilities/jwt");

/**
 * JWT token type enum
 */
export enum TokenType {
  ACCESS = "access",
  REFRESH = "refresh",
  VERIFICATION = "verification",
}

/**
 * Token generation result interface
 */
export interface TokenResult {
  token: string;
  expiresAt: number;
  type: TokenType;
}

/**
 * Refresh token result interface
 */
export interface RefreshResult {
  accessToken: string;
  user: any;
  expiresAt: number;
}

/**
 * Generate short-lived access token (15 minutes)
 *
 * @param payload - User data to include in token (should be minimal)
 * @returns TokenResult containing access token and expiration
 * @throws Error if payload is invalid or generation fails
 */
exports.generateAccessToken = (payload: object): TokenResult => {
  // More robust payload validation - reject arrays and null objects
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    payload.constructor !== Object
  ) {
    throw new Error("Token payload must be a valid object (not array or null)");
  }

  try {
    const token = jwt.access.sign(payload);
    const expiresAt = jwt.access.getExpiration();

    return {
      token,
      expiresAt,
      type: TokenType.ACCESS,
    };
  } catch (error: any) {
    throw new Error(`Access token generation failed: ${error.message}`);
  }
};

/**
 * Generate long-lived refresh token (7 days)
 *
 * @param payload - Session data to include in token
 * @returns TokenResult containing refresh token and expiration
 * @throws Error if payload is invalid or generation fails
 */
exports.generateRefreshToken = (payload: object): TokenResult => {
  // More robust payload validation - reject arrays and null objects
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    payload.constructor !== Object
  ) {
    throw new Error("Token payload must be a valid object (not array or null)");
  }

  try {
    const token = jwt.refresh.sign(payload);

    // Use JWT library's expiration mechanism instead of hardcoded calculation
    const expiresAt = jwt.refresh.getExpiration
      ? jwt.refresh.getExpiration()
      : Date.now() + 7 * 24 * 60 * 60 * 1000;

    return {
      token,
      expiresAt,
      type: TokenType.REFRESH,
    };
  } catch (error: any) {
    throw new Error(`Refresh token generation failed: ${error.message}`);
  }
};

/**
 * Verify and decode JWT token
 *
 * @param token - JWT token to verify
 * @param type - Type of token (access, refresh, verification)
 * @returns Decoded token payload
 * @throws Error if token is invalid, expired, or verification fails
 */
exports.verifyToken = (token: string, type: TokenType): any => {
  if (!token || typeof token !== "string") {
    throw new Error("Token must be a valid string");
  }

  if (!Object.values(TokenType).includes(type)) {
    throw new Error("Invalid token type specified");
  }

  try {
    switch (type) {
      case TokenType.ACCESS:
        return jwt.access.verify(token);
      case TokenType.REFRESH:
        return jwt.refresh.verify(token);
      case TokenType.VERIFICATION:
        return jwt.verification.verify(token);
      default:
        throw new Error("Unsupported token type");
    }
  } catch (error: any) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Generate new access token from refresh token
 *
 * @param refreshToken - Valid refresh token
 * @returns RefreshResult containing new access token and user data
 * @throws Error if refresh token is invalid or generation fails
 */
exports.refreshAccessToken = (refreshToken: string): RefreshResult => {
  if (!refreshToken || typeof refreshToken !== "string") {
    throw new Error("Refresh token must be a valid string");
  }

  try {
    // Verify the refresh token first
    const decoded = exports.verifyToken(refreshToken, TokenType.REFRESH);

    if (!decoded || !decoded.id) {
      throw new Error("Invalid refresh token payload - missing session ID");
    }

    // Generate new access token with minimal user data
    const userPayload = {
      sessionId: decoded.id,
      // Add other non-sensitive data as needed
    };

    const accessTokenResult = exports.generateAccessToken(userPayload);

    return {
      accessToken: accessTokenResult.token,
      user: userPayload,
      expiresAt: accessTokenResult.expiresAt,
    };
  } catch (error: any) {
    throw new Error(`Access token refresh failed: ${error.message}`);
  }
};

/**
 * Check if a token is near expiration
 *
 * @param token - Token to check
 * @param type - Type of token
 * @param thresholdMinutes - Minutes before expiration to consider "near" (default: 60)
 * @returns boolean indicating if token is near expiration
 */
exports.isTokenNearExpiration = (
  token: string,
  type: TokenType,
  thresholdMinutes: number = 60
): boolean => {
  try {
    const decoded = exports.verifyToken(token, type);

    if (!decoded.exp) {
      return false; // Token without expiration
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const thresholdTime = Date.now() + thresholdMinutes * 60 * 1000;

    return expirationTime <= thresholdTime;
  } catch (error) {
    return true; // If verification fails, consider it near expiration
  }
};

/**
 * Extract user ID from access token
 *
 * @param accessToken - Access token to extract user ID from
 * @returns User ID or null if not found
 */
exports.extractUserIdFromToken = (
  accessToken: string
): string | number | null => {
  try {
    const decoded = exports.verifyToken(accessToken, TokenType.ACCESS);
    return decoded.id || decoded.sessionId || null;
  } catch (error) {
    return null;
  }
};

/**
 * Generate verification token for email verification
 *
 * @param payload - User data for verification
 * @returns TokenResult containing verification token
 */
exports.generateVerificationToken = (payload: object): TokenResult => {
  // More robust payload validation - reject arrays and null objects
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    payload.constructor !== Object
  ) {
    throw new Error("Token payload must be a valid object (not array or null)");
  }

  try {
    const token = jwt.verification.sign(payload);

    // Use JWT library's expiration mechanism if available, otherwise fallback to calculation
    const expiresAt = jwt.verification.getExpiration
      ? jwt.verification.getExpiration()
      : Date.now() + 30 * 60 * 1000;

    return {
      token,
      expiresAt,
      type: TokenType.VERIFICATION,
    };
  } catch (error: any) {
    throw new Error(`Verification token generation failed: ${error.message}`);
  }
};

/**
 * Validate token format (basic JWT structure check)
 *
 * @param token - Token to validate
 * @returns boolean indicating if token has valid JWT format
 */
exports.isValidTokenFormat = (token: string): boolean => {
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
