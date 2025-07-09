/**
 * JWT Service Unit Tests
 *
 * Tests for JWT token generation, verification, and refresh functionality
 * covering both successful operations and error scenarios.
 */

// Jest globals are available without import in Jest environment
// Using global Jest functions: describe, test, expect, beforeEach, jest

// Mock the JWT utilities before importing the service
jest.mock("@/utilities/jwt");
jest.mock("@/config/jwt");

const mockJwt = {
  access: {
    sign: jest.fn(),
    verify: jest.fn(),
    getExpiration: jest.fn(),
  },
  refresh: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
  verification: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
};

// Mock the config
const mockJwtConfig = {
  access: {
    ttl: "15m",
    secret: "test-access-secret",
  },
  refresh: {
    ttl: "7d",
    secret: "test-refresh-secret",
  },
  verification: {
    ttl: "30m",
    secret: "test-verification-secret",
  },
};

jest.doMock("@/utilities/jwt", () => mockJwt);
jest.doMock("@/config/jwt", () => mockJwtConfig);

// Import the service after mocking
const JwtService = require("@/services/auth/JwtService");
const { TokenType } = JwtService;

describe("JWT Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Token Generation", () => {
    test("should generate valid access token", () => {
      const payload = { id: 1, email: "test@example.com" };
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
      const mockExpiration = Date.now() + 15 * 60 * 1000; // 15 minutes

      mockJwt.access.sign.mockReturnValue(mockToken);
      mockJwt.access.getExpiration.mockReturnValue(mockExpiration);

      const result = JwtService.generateAccessToken(payload);

      expect(result).toEqual({
        token: mockToken,
        expiresAt: mockExpiration,
        type: TokenType.ACCESS,
      });

      expect(mockJwt.access.sign).toHaveBeenCalledWith(payload);
      expect(mockJwt.access.getExpiration).toHaveBeenCalled();
    });

    test("should generate valid refresh token", () => {
      const payload = { id: "session-123" };
      const mockToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.signature";

      mockJwt.refresh.sign.mockReturnValue(mockToken);

      const result = JwtService.generateRefreshToken(payload);

      expect(result).toEqual({
        token: mockToken,
        expiresAt: expect.any(Number),
        type: TokenType.REFRESH,
      });

      expect(mockJwt.refresh.sign).toHaveBeenCalledWith(payload);
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    test("should generate valid verification token", () => {
      const payload = { email: "test@example.com", action: "verify" };
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.verify.signature";

      mockJwt.verification.sign.mockReturnValue(mockToken);

      const result = JwtService.generateVerificationToken(payload);

      expect(result).toEqual({
        token: mockToken,
        expiresAt: expect.any(Number),
        type: TokenType.VERIFICATION,
      });

      expect(mockJwt.verification.sign).toHaveBeenCalledWith(payload);
    });

    test("should fail when payload is invalid", () => {
      expect(() => {
        JwtService.generateAccessToken(null);
      }).toThrow("Token payload must be a valid object");

      expect(() => {
        JwtService.generateAccessToken("invalid");
      }).toThrow("Token payload must be a valid object");

      expect(() => {
        JwtService.generateRefreshToken(undefined);
      }).toThrow("Token payload must be a valid object");
    });

    test("should handle token generation errors", () => {
      const payload = { id: 1 };
      mockJwt.access.sign.mockImplementation(() => {
        throw new Error("Signing failed");
      });

      expect(() => {
        JwtService.generateAccessToken(payload);
      }).toThrow("Access token generation failed: Signing failed");
    });
  });

  describe("Token Verification", () => {
    test("should verify valid access token", () => {
      const token = "valid.access.token";
      const expectedPayload = { id: 1, email: "test@example.com" };

      mockJwt.access.verify.mockReturnValue(expectedPayload);

      const result = JwtService.verifyToken(token, TokenType.ACCESS);

      expect(result).toEqual(expectedPayload);
      expect(mockJwt.access.verify).toHaveBeenCalledWith(token);
    });

    test("should verify valid refresh token", () => {
      const token = "valid.refresh.token";
      const expectedPayload = { id: "session-123" };

      mockJwt.refresh.verify.mockReturnValue(expectedPayload);

      const result = JwtService.verifyToken(token, TokenType.REFRESH);

      expect(result).toEqual(expectedPayload);
      expect(mockJwt.refresh.verify).toHaveBeenCalledWith(token);
    });

    test("should verify valid verification token", () => {
      const token = "valid.verification.token";
      const expectedPayload = { email: "test@example.com" };

      mockJwt.verification.verify.mockReturnValue(expectedPayload);

      const result = JwtService.verifyToken(token, TokenType.VERIFICATION);

      expect(result).toEqual(expectedPayload);
      expect(mockJwt.verification.verify).toHaveBeenCalledWith(token);
    });

    test("should fail with expired token", () => {
      const token = "expired.token";
      mockJwt.access.verify.mockImplementation(() => {
        throw new Error("Token has expired");
      });

      expect(() => {
        JwtService.verifyToken(token, TokenType.ACCESS);
      }).toThrow("Token verification failed: Token has expired");
    });

    test("should fail with invalid signature", () => {
      const token = "invalid.signature.token";
      mockJwt.access.verify.mockImplementation(() => {
        throw new Error("Invalid token signature");
      });

      expect(() => {
        JwtService.verifyToken(token, TokenType.ACCESS);
      }).toThrow("Token verification failed: Invalid token signature");
    });

    test("should fail with malformed token", () => {
      expect(() => {
        JwtService.verifyToken("", TokenType.ACCESS);
      }).toThrow("Token must be a valid string");

      expect(() => {
        JwtService.verifyToken(null as any, TokenType.ACCESS);
      }).toThrow("Token must be a valid string");
    });

    test("should fail with invalid token type", () => {
      expect(() => {
        JwtService.verifyToken("valid.token", "invalid-type" as any);
      }).toThrow("Invalid token type specified");
    });
  });

  describe("Token Refresh", () => {
    test("should generate new access token from valid refresh token", () => {
      const refreshToken = "valid.refresh.token";
      const refreshPayload = { id: "session-123" };
      const newAccessToken = "new.access.token";
      const mockExpiration = Date.now() + 15 * 60 * 1000;

      // Mock the verifyToken call
      jest.spyOn(JwtService, "verifyToken").mockReturnValue(refreshPayload);

      // Mock the generateAccessToken call
      jest.spyOn(JwtService, "generateAccessToken").mockReturnValue({
        token: newAccessToken,
        expiresAt: mockExpiration,
        type: TokenType.ACCESS,
      });

      const result = JwtService.refreshAccessToken(refreshToken);

      expect(result).toEqual({
        accessToken: newAccessToken,
        user: { sessionId: "session-123" },
        expiresAt: mockExpiration,
      });

      expect(JwtService.verifyToken).toHaveBeenCalledWith(
        refreshToken,
        TokenType.REFRESH
      );
      expect(JwtService.generateAccessToken).toHaveBeenCalledWith({
        sessionId: "session-123",
      });
    });

    test("should fail with expired refresh token", () => {
      const refreshToken = "expired.refresh.token";

      jest.spyOn(JwtService, "verifyToken").mockImplementation(() => {
        throw new Error("Token has expired");
      });

      expect(() => {
        JwtService.refreshAccessToken(refreshToken);
      }).toThrow("Access token refresh failed: Token has expired");
    });

    test("should fail with invalid refresh token", () => {
      const refreshToken = "invalid.refresh.token";

      jest.spyOn(JwtService, "verifyToken").mockImplementation(() => {
        throw new Error("Invalid token signature");
      });

      expect(() => {
        JwtService.refreshAccessToken(refreshToken);
      }).toThrow("Access token refresh failed: Invalid token signature");
    });

    test("should fail with missing session ID in refresh token", () => {
      const refreshToken = "valid.refresh.token";
      const refreshPayload = { email: "test@example.com" }; // Missing id

      jest.spyOn(JwtService, "verifyToken").mockReturnValue(refreshPayload);

      expect(() => {
        JwtService.refreshAccessToken(refreshToken);
      }).toThrow(
        "Access token refresh failed: Invalid refresh token payload - missing session ID"
      );
    });

    test("should fail with invalid refresh token input", () => {
      expect(() => {
        JwtService.refreshAccessToken("");
      }).toThrow("Refresh token must be a valid string");

      expect(() => {
        JwtService.refreshAccessToken(null as any);
      }).toThrow("Refresh token must be a valid string");
    });
  });

  describe("Utility Functions", () => {
    test("should check if token is near expiration", () => {
      const token = "valid.token";
      const payload = { exp: Math.floor(Date.now() / 1000) + 30 * 60 }; // 30 minutes from now

      jest.spyOn(JwtService, "verifyToken").mockReturnValue(payload);

      // Token expires in 30 minutes, threshold is 60 minutes
      const result = JwtService.isTokenNearExpiration(
        token,
        TokenType.ACCESS,
        60
      );
      expect(result).toBe(true);

      // Token expires in 30 minutes, threshold is 15 minutes
      const result2 = JwtService.isTokenNearExpiration(
        token,
        TokenType.ACCESS,
        15
      );
      expect(result2).toBe(false);
    });

    test("should return true for verification failure", () => {
      const token = "invalid.token";

      jest.spyOn(JwtService, "verifyToken").mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = JwtService.isTokenNearExpiration(token, TokenType.ACCESS);
      expect(result).toBe(true);
    });

    test("should extract user ID from access token", () => {
      const token = "valid.access.token";
      const payload = { id: 123, email: "test@example.com" };

      jest.spyOn(JwtService, "verifyToken").mockReturnValue(payload);

      const result = JwtService.extractUserIdFromToken(token);
      expect(result).toBe(123);
    });

    test("should extract session ID when user ID not present", () => {
      const token = "valid.access.token";
      const payload = { sessionId: "session-123", email: "test@example.com" };

      jest.spyOn(JwtService, "verifyToken").mockReturnValue(payload);

      const result = JwtService.extractUserIdFromToken(token);
      expect(result).toBe("session-123");
    });

    test("should return null for invalid token", () => {
      const token = "invalid.token";

      jest.spyOn(JwtService, "verifyToken").mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = JwtService.extractUserIdFromToken(token);
      expect(result).toBeNull();
    });

    test("should validate token format correctly", () => {
      expect(JwtService.isValidTokenFormat("header.payload.signature")).toBe(
        true
      );
      expect(
        JwtService.isValidTokenFormat(
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        )
      ).toBe(true);

      expect(JwtService.isValidTokenFormat("")).toBe(false);
      expect(JwtService.isValidTokenFormat("invalid")).toBe(false);
      expect(JwtService.isValidTokenFormat("header.payload")).toBe(false);
      expect(
        JwtService.isValidTokenFormat("header.payload.signature.extra")
      ).toBe(false);
      expect(JwtService.isValidTokenFormat(null as any)).toBe(false);
    });
  });
});
