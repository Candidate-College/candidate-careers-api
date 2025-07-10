/**
 * Authentication Middleware Unit Tests
 *
 * Tests for JWT token authentication middleware including token validation,
 * user context extraction, and comprehensive error handling scenarios.
 */

// Jest globals are available without import in Jest environment
// Using global Jest functions: describe, test, expect, beforeEach, jest

// Mock dependencies before importing the middleware
jest.mock("@/utilities/jwt");
jest.mock("@/services/auth/JwtService");

const mockJwtMiddleware = {
  access: {
    verify: jest.fn(),
  },
  refresh: {
    verify: jest.fn(),
  },
  verification: {
    verify: jest.fn(),
  },
};

const mockJwtServiceMiddleware = {
  TokenType: {
    ACCESS: "access",
    REFRESH: "refresh",
    VERIFICATION: "verification",
  },
};

jest.doMock("@/utilities/jwt", () => mockJwtMiddleware);
jest.doMock("@/services/auth/JwtService", () => mockJwtServiceMiddleware);

// Import the middleware after mocking
const authMiddleware = require("@/middlewares/auth-middleware");

describe("Authentication Middleware", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    req = {
      headers: {},
      cookies: {},
      body: {},
      user: undefined,
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      error: jest.fn(),
      setHeader: jest.fn(),
    };

    // Mock next function
    next = jest.fn();
  });

  describe("Access Token Middleware", () => {
    test("should authenticate valid token", () => {
      const token = "valid.access.token";
      const payload = { id: 1, email: "test@example.com", role: "user" };

      req.headers.authorization = `Bearer ${token}`;
      mockJwtMiddleware.access.verify.mockReturnValue(payload);

      authMiddleware.accessToken(req, res, next);

      expect(req.user).toEqual({
        id: 1,
        email: "test@example.com",
        role: "user",
        sessionId: undefined,
        iat: undefined,
        exp: undefined,
      });
      expect(req.body.id).toBe(1);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should extract user context correctly", () => {
      const token = "valid.access.token";
      const payload = {
        sessionId: "session-123",
        email: "user@example.com",
        iat: 1609459200,
        exp: 1609462800,
      };

      req.headers.authorization = `Bearer ${token}`;
      mockJwtMiddleware.access.verify.mockReturnValue(payload);

      authMiddleware.accessToken(req, res, next);

      expect(req.user).toEqual({
        id: "session-123",
        email: "user@example.com",
        role: undefined,
        sessionId: "session-123",
        iat: 1609459200,
        exp: 1609462800,
      });
      expect(req.body.id).toBe("session-123");
      expect(next).toHaveBeenCalled();
    });

    test("should reject request without token", () => {
      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Authentication token is required",
        error: {
          type: "NO_TOKEN",
          code: "AUTH_NO_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject request with invalid token format", () => {
      req.headers.authorization = "Bearer invalid-token-format";

      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: "Malformed authentication token",
        error: {
          type: "MALFORMED_TOKEN",
          code: "AUTH_MALFORMED_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject request with expired token", () => {
      const token = "valid.format.token";
      req.headers.authorization = `Bearer ${token}`;

      mockJwtMiddleware.access.verify.mockImplementation(() => {
        throw new Error("Token has expired");
      });

      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Authentication token has expired",
        error: {
          type: "EXPIRED_TOKEN",
          code: "AUTH_EXPIRED_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject request with invalid signature", () => {
      const token = "valid.format.token";
      req.headers.authorization = `Bearer ${token}`;

      mockJwtMiddleware.access.verify.mockImplementation(() => {
        throw new Error("Invalid token signature");
      });

      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Invalid authentication token",
        error: {
          type: "INVALID_TOKEN",
          code: "AUTH_INVALID_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle malformed authorization header", () => {
      req.headers.authorization = "InvalidFormat token";

      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Authentication token is required",
        error: {
          type: "NO_TOKEN",
          code: "AUTH_NO_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle missing authorization header", () => {
      req.headers.authorization = undefined;

      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle token verification failure", () => {
      const token = "valid.format.token";
      req.headers.authorization = `Bearer ${token}`;

      mockJwtMiddleware.access.verify.mockImplementation(() => {
        throw new Error("Unexpected verification error");
      });

      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Unexpected verification error",
        error: {
          type: "TOKEN_VERIFICATION_FAILED",
          code: "AUTH_TOKEN_VERIFICATION_FAILED",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Refresh Token Middleware", () => {
    test("should authenticate valid refresh token", () => {
      const refreshToken = "valid.refresh.token";
      const payload = { id: "session-123", exp: 1609462800, iat: 1609459200 };

      req.cookies["refresh_token"] = refreshToken;
      mockJwtMiddleware.refresh.verify.mockReturnValue(payload);

      authMiddleware.refreshToken(req, res, next);

      expect(req.user).toEqual({
        session: payload,
        sessionId: "session-123",
        exp: 1609462800,
        iat: 1609459200,
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should handle expired refresh token", () => {
      const refreshToken = "expired.refresh.token";
      req.cookies["refresh_token"] = refreshToken;

      mockJwtMiddleware.refresh.verify.mockImplementation(() => {
        const error = new Error("Token has expired");
        error.name = "TokenExpiredError";
        throw error;
      });

      authMiddleware.refreshToken(req, res, next);

      expect(req.user).toEqual({
        session: {
          id: "",
          exp: 0,
          iat: 0,
          expired: true,
        },
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should reject request without refresh token", () => {
      authMiddleware.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Refresh token is required",
        error: {
          type: "NO_TOKEN",
          code: "AUTH_NO_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject request with invalid refresh token format", () => {
      req.cookies["refresh_token"] = "invalid-format";

      authMiddleware.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: "Invalid refresh token format",
        error: {
          type: "MALFORMED_TOKEN",
          code: "AUTH_MALFORMED_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject request with invalid refresh token", () => {
      const refreshToken = "valid.format.token";
      req.cookies["refresh_token"] = refreshToken;

      mockJwtMiddleware.refresh.verify.mockImplementation(() => {
        throw new Error("Invalid token signature");
      });

      authMiddleware.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Invalid refresh token",
        error: {
          type: "INVALID_TOKEN",
          code: "AUTH_INVALID_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Verification Token Middleware", () => {
    test("should authenticate valid verification token", () => {
      const verificationToken = "valid.verification.token";
      const payload = { email: "test@example.com", action: "verify" };

      req.body.token = verificationToken;
      mockJwtMiddleware.verification.verify.mockReturnValue(payload);

      authMiddleware.verificationToken(req, res, next);

      expect(req.user).toEqual(payload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should reject request without verification token", () => {
      authMiddleware.verificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Verification token is required",
        error: {
          type: "NO_TOKEN",
          code: "AUTH_NO_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject request with expired verification token", () => {
      const verificationToken = "expired.verification.token";
      req.body.token = verificationToken;

      mockJwtMiddleware.verification.verify.mockImplementation(() => {
        throw new Error("Token has expired");
      });

      authMiddleware.verificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Authentication token has expired",
        error: {
          type: "EXPIRED_TOKEN",
          code: "AUTH_EXPIRED_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject request with invalid verification token", () => {
      const verificationToken = "invalid.verification.token";
      req.body.token = verificationToken;

      mockJwtMiddleware.verification.verify.mockImplementation(() => {
        throw new Error("Invalid token signature");
      });

      authMiddleware.verificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Invalid authentication token",
        error: {
          type: "INVALID_TOKEN",
          code: "AUTH_INVALID_TOKEN",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Middleware Chain Integration", () => {
    test("should pass control to next middleware on success", () => {
      const token = "valid.access.token";
      const payload = { id: 1, email: "test@example.com" };

      req.headers.authorization = `Bearer ${token}`;
      mockJwtMiddleware.access.verify.mockReturnValue(payload);

      authMiddleware.accessToken(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test("should stop chain and return error on authentication failure", () => {
      authMiddleware.accessToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("should properly initialize request body", () => {
      const token = "valid.access.token";
      const payload = { id: 1, email: "test@example.com" };

      req.headers.authorization = `Bearer ${token}`;
      req.body = undefined; // Simulate missing body
      mockJwtMiddleware.access.verify.mockReturnValue(payload);

      authMiddleware.accessToken(req, res, next);

      expect(req.body).toBeDefined();
      expect(req.body.id).toBe(1);
      expect(next).toHaveBeenCalled();
    });

    test("should preserve existing body properties", () => {
      const token = "valid.access.token";
      const payload = { id: 1, email: "test@example.com" };

      req.headers.authorization = `Bearer ${token}`;
      req.body = { existingProperty: "value" };
      mockJwtMiddleware.access.verify.mockReturnValue(payload);

      authMiddleware.accessToken(req, res, next);

      expect(req.body.existingProperty).toBe("value");
      expect(req.body.id).toBe(1);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Error Handling Edge Cases", () => {
    test("should handle null authorization header", () => {
      req.headers.authorization = null;

      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle empty authorization header", () => {
      req.headers.authorization = "";

      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle authorization header with only Bearer", () => {
      req.headers.authorization = "Bearer";

      authMiddleware.accessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle authorization header with extra spaces", () => {
      const token = "valid.format.token";
      const payload = { id: 1, email: "test@example.com" };

      req.headers.authorization = "  Bearer  valid.format.token  ";
      mockJwtMiddleware.access.verify.mockReturnValue(payload);

      authMiddleware.accessToken(req, res, next);

      expect(next).toHaveBeenCalled(); // Should normalize spaces and work correctly
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should handle missing cookie object", () => {
      req.cookies = undefined;

      authMiddleware.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
