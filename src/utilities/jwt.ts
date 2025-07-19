const jwt = require("jsonwebtoken");
const jwtConfig = require("@/config/jwt");

/**
 * Custom JWT Error types for better error handling
 */
interface JWTError extends Error {
  name: string;
  message: string;
  expiredAt?: Date;
}

/**
 * Signs JWT token with enhanced error handling
 *
 * @param payload - Token payload (should not contain sensitive data)
 * @param secret - JWT secret key
 * @param expiresIn - Token expiration time
 * @returns Signed JWT token
 */
const signToken = (
  payload: object,
  secret: string,
  expiresIn?: string | number
): string => {
  if (!payload || typeof payload !== "object") {
    throw new Error("JWT payload must be a valid object");
  }

  // if (!secret || typeof secret !== "string" || secret.length < 32) {
  //   throw new Error("JWT secret must be a string with at least 32 characters");
  // }

  try {
    // Let the JWT library handle exp claim automatically via expiresIn option
    // Remove manual exp calculation to prevent conflicts
    const tokenPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    };

    if (expiresIn) {
      return jwt.sign(tokenPayload, secret, { expiresIn });
    } else {
      return jwt.sign(tokenPayload, secret);
    }
  } catch (error: any) {
    throw new Error(`Failed to sign JWT token: ${error.message}`);
  }
};

/**
 * Verifies JWT token with enhanced error handling
 *
 * @param token - JWT token to verify
 * @param secret - JWT secret key
 * @returns Decoded token payload
 */
const verifyToken = (token: string, secret: string): any => {
  if (!token || typeof token !== "string") {
    throw new Error("Token must be a valid string");
  }

  if (!secret || typeof secret !== "string") {
    throw new Error("Secret must be a valid string");
  }

  try {
    return jwt.verify(token, secret);
  } catch (error: any) {
    const jwtError = error as JWTError;

    switch (jwtError.name) {
      case "TokenExpiredError":
        throw new Error("Token has expired");
      case "JsonWebTokenError":
        throw new Error("Invalid token signature");
      case "NotBeforeError":
        throw new Error("Token not active yet");
      default:
        throw new Error(`Token verification failed: ${jwtError.message}`);
    }
  }
};

/**
 * Access token.
 */
exports.access = {
  sign: (payload: object) =>
    signToken(payload, jwtConfig.access.secret, jwtConfig.access.ttl),
  verify: (token: string) => verifyToken(token, jwtConfig.access.secret),
  getExpiration: (): number => {
    // Parse the TTL to get the number of seconds/minutes/hours
    const ttl = jwtConfig.access.ttl;
    const value = parseInt(ttl);
    const unit = ttl.replace(/[0-9]/g, "");

    // Calculate expiration time based on unit
    let expiryMs = 0;
    switch (unit) {
      case "s":
        expiryMs = value * 1000;
        break;
      case "m":
        expiryMs = value * 60 * 1000;
        break;
      case "h":
        expiryMs = value * 60 * 60 * 1000;
        break;
      case "d":
        expiryMs = value * 24 * 60 * 60 * 1000;
        break;
      default:
        expiryMs = 3600 * 1000; // Default to 1 hour if format not recognized
    }

    return Date.now() + expiryMs;
  },
};

/**
 * Refresh token with enhanced functionality.
 */
exports.refresh = {
  sign: (payload: object, exp?: number): string => {
    if (exp) {
      // Convert Unix timestamp to seconds from now for expiresIn
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = exp - currentTime;

      if (expiresIn <= 0) {
        throw new Error("Expiration time must be in the future");
      }

      return signToken(payload, jwtConfig.refresh.secret, expiresIn);
    } else {
      return signToken(
        payload,
        jwtConfig.refresh.secret,
        jwtConfig.refresh.ttl
      );
    }
  },
  verify: (token: string) => verifyToken(token, jwtConfig.refresh.secret),

  /**
   * Generate new access token from refresh token
   * @param refreshToken - Valid refresh token
   * @returns Object containing new access token and user data
   */
  generateAccessToken: (
    refreshToken: string
  ): { accessToken: string; user: any } => {
    try {
      const decoded = verifyToken(refreshToken, jwtConfig.refresh.secret);

      if (!decoded || !decoded.id) {
        throw new Error("Invalid refresh token payload");
      }

      // Extract user data for new access token (should be minimal)
      const userPayload = {
        id: decoded.id,
        // Add other non-sensitive user data as needed
      };

      const accessToken = signToken(
        userPayload,
        jwtConfig.access.secret,
        jwtConfig.access.ttl
      );

      return {
        accessToken,
        user: userPayload,
      };
    } catch (error: any) {
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  },

  /**
   * Check if refresh token is near expiration (within 24 hours)
   * @param token - Refresh token to check
   * @returns boolean indicating if token should be rotated
   */
  shouldRotate: (token: string): boolean => {
    try {
      const decoded = verifyToken(token, jwtConfig.refresh.secret);

      if (!decoded.exp) {
        return false;
      }

      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const oneDayFromNow = Date.now() + 24 * 60 * 60 * 1000;

      return expirationTime <= oneDayFromNow;
    } catch (error) {
      return true; // If there's an error, recommend rotation
    }
  },
};

/**
 * Verification token.
 */
exports.verification = {
  sign: (payload: object) =>
    signToken(
      payload,
      jwtConfig.verification.secret,
      jwtConfig.verification.ttl
    ),
  verify: (token: string) => verifyToken(token, jwtConfig.verification.secret),
};
