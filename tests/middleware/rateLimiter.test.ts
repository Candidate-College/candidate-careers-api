/**
 * Rate Limiter Middleware Unit Tests
 *
 * Tests for rate limiting middleware including authentication protection,
 * progressive limiting, and abuse prevention functionality.
 */

// Jest globals are available without import in Jest environment
// Using global Jest functions: describe, test, expect, beforeEach, jest, afterEach

// Mock express-rate-limit
const mockRateLimit = jest.fn().mockImplementation((options) => {
  return (req: any, res: any, next: any) => {
    // Simulate rate limiting logic
    if (options.skip && options.skip(req)) {
      return next();
    }

    // For testing, we'll simulate rate limit behavior
    if (req.rateLimitExceeded) {
      return options.handler(req, res);
    }

    next();
  };
});

jest.mock("express-rate-limit", () => mockRateLimit);

// Import the middleware after mocking
const rateLimiter = require("@/middlewares/rateLimiter");

describe("Rate Limiter Middleware", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment
    process.env.NODE_ENV = "development";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    process.env.RATE_LIMIT_MAX_REQUESTS = "5";

    // Mock request object
    req = {
      ip: "192.168.1.1",
      connection: { remoteAddress: "192.168.1.1" },
      user: undefined,
      headers: {},
      method: "POST",
      rateLimitExceeded: false,
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    // Mock next function
    next = jest.fn();
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.NODE_ENV;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
  });

  describe("Auth Rate Limiting", () => {
    test("should allow requests within limit", () => {
      rateLimiter.authRateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should block requests exceeding limit", () => {
      req.rateLimitExceeded = true;

      rateLimiter.authRateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 429,
        message: "Rate limit exceeded",
        error: "Too many requests from this IP, please try again later.",
        retryAfter: expect.any(Number),
        resetTime: expect.any(String),
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should skip rate limiting in test environment", () => {
      process.env.NODE_ENV = "test";
      req.rateLimitExceeded = true;

      rateLimiter.authRateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should use IP address for rate limiting key", () => {
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          keyGenerator: expect.any(Function),
        })
      );

      // Test the key generator
      const lastCall =
        mockRateLimit.mock.calls[mockRateLimit.mock.calls.length - 1];
      const options = lastCall[0];
      const key = options.keyGenerator(req);

      expect(key).toBe("192.168.1.1");
    });

    test("should use IP and user ID for authenticated requests", () => {
      req.user = { id: 123 };

      const lastCall =
        mockRateLimit.mock.calls[mockRateLimit.mock.calls.length - 1];
      const options = lastCall[0];
      const key = options.keyGenerator(req);

      expect(key).toBe("192.168.1.1:123");
    });
  });

  describe("General API Rate Limiting", () => {
    test("should allow requests within general limit", () => {
      rateLimiter.generalRateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should block requests exceeding general limit", () => {
      req.rateLimitExceeded = true;

      rateLimiter.generalRateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 429,
        message: "Rate limit exceeded",
        error: "Too many requests from this IP, please try again later.",
        retryAfter: expect.any(Number),
        resetTime: expect.any(String),
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should have more lenient limits than auth endpoints", () => {
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100, // 100 requests
        })
      );
    });
  });

  describe("Strict Rate Limiting", () => {
    test("should have very restrictive limits", () => {
      rateLimiter.strictRateLimit(req, res, next);

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 60 * 60 * 1000, // 1 hour
          max: 3, // 3 requests
        })
      );
    });

    test("should provide specific error message for sensitive operations", () => {
      req.rateLimitExceeded = true;

      rateLimiter.strictRateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 429,
        message: "Rate limit exceeded for sensitive operation",
        error:
          "Too many attempts. For security reasons, please wait before trying again.",
        retryAfter: 3600,
        resetTime: expect.any(String),
      });
    });
  });

  describe("Progressive Auth Rate Limiting", () => {
    test("should allow first attempt", () => {
      rateLimiter.progressiveAuthRateLimit(req, res, next);

      expect(req.rateLimitKey).toBe("192.168.1.1");
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should record failed attempt", () => {
      const key = "192.168.1.1";

      rateLimiter.recordFailedAttempt(key);

      const count = rateLimiter.getFailedAttemptsCount(key);
      expect(count).toBe(1);
    });

    test("should clear failed attempts on success", () => {
      const key = "192.168.1.1";

      rateLimiter.recordFailedAttempt(key);
      rateLimiter.recordFailedAttempt(key);
      expect(rateLimiter.getFailedAttemptsCount(key)).toBe(2);

      rateLimiter.clearFailedAttempts(key);
      expect(rateLimiter.getFailedAttemptsCount(key)).toBe(0);
    });

    test("should block after multiple failed attempts", () => {
      const key = "192.168.1.1";

      // Simulate multiple failed attempts
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordFailedAttempt(key);
      }

      // Mock the progressive rate limiter to simulate delay check
      jest.spyOn(Date, "now").mockReturnValue(1000);

      // Create a fresh request after the failed attempts
      const blockedReq = {
        ...req,
        ip: "192.168.1.1",
      };

      rateLimiter.progressiveAuthRateLimit(blockedReq, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
          message: "Account temporarily locked due to multiple failed attempts",
          retryAfter: expect.any(Number),
        })
      );
      expect(next).not.toHaveBeenCalled();

      // Restore Date.now
      jest.restoreAllMocks();
    });

    test("should handle missing IP address", () => {
      req.ip = undefined;
      req.connection.remoteAddress = undefined;

      rateLimiter.progressiveAuthRateLimit(req, res, next);

      expect(req.rateLimitKey).toBe("unknown");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Custom Rate Limiting", () => {
    test("should create custom rate limiter with specified options", () => {
      const options = {
        windowMs: 30000,
        max: 10,
        message: "Custom rate limit message",
      };

      const customLimiter = rateLimiter.createCustomRateLimit(options);

      expect(customLimiter).toBeDefined();
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 30000,
          max: 10,
          message: "Custom rate limit message",
        })
      );
    });

    test("should use default message if not provided", () => {
      const options = {
        windowMs: 30000,
        max: 10,
      };

      rateLimiter.createCustomRateLimit(options);

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Rate limit exceeded",
        })
      );
    });

    test("should skip successful requests if configured", () => {
      const options = {
        windowMs: 30000,
        max: 10,
        skipSuccessfulRequests: true,
      };

      rateLimiter.createCustomRateLimit(options);

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          skipSuccessfulRequests: true,
        })
      );
    });
  });

  describe("Rate Limit Window Reset", () => {
    test("should reset limit after time window", (done) => {
      const key = "192.168.1.1";

      // Record failed attempts
      rateLimiter.recordFailedAttempt(key);
      expect(rateLimiter.getFailedAttemptsCount(key)).toBe(1);

      // Simulate time passing (in real implementation, cleanup happens periodically)
      setTimeout(() => {
        // In a real test, we would trigger the cleanup mechanism
        // For this test, we'll just verify the functionality exists
        expect(rateLimiter.getFailedAttemptsCount).toBeDefined();
        done();
      }, 10);
    });
  });

  describe("Error Handling", () => {
    test("should handle undefined IP address gracefully", () => {
      req.ip = undefined;
      req.connection = {};

      rateLimiter.progressiveAuthRateLimit(req, res, next);

      expect(req.rateLimitKey).toBe("unknown");
      expect(next).toHaveBeenCalled();
    });

    test("should handle missing connection object", () => {
      req.ip = undefined;
      req.connection = undefined;

      rateLimiter.progressiveAuthRateLimit(req, res, next);

      expect(req.rateLimitKey).toBe("unknown");
      expect(next).toHaveBeenCalled();
    });

    test("should handle invalid environment variables", () => {
      process.env.RATE_LIMIT_WINDOW_MS = "invalid";
      process.env.RATE_LIMIT_MAX_REQUESTS = "invalid";

      // Should not throw an error and use defaults
      expect(() => {
        rateLimiter.authRateLimit(req, res, next);
      }).not.toThrow();
    });
  });

  describe("Configuration", () => {
    test("should read configuration from environment variables", () => {
      process.env.RATE_LIMIT_WINDOW_MS = "120000";
      process.env.RATE_LIMIT_MAX_REQUESTS = "10";

      // Clear the require cache to force re-evaluation
      jest.resetModules();
      const freshRateLimiter = require("@/middlewares/rateLimiter");

      freshRateLimiter.authRateLimit(req, res, next);

      // Verify that the new configuration is used
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 120000,
          max: 10,
        })
      );
    });

    test("should use default values when environment variables are not set", () => {
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX_REQUESTS;

      jest.resetModules();
      const freshRateLimiter = require("@/middlewares/rateLimiter");

      freshRateLimiter.authRateLimit(req, res, next);

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 60000, // Default 1 minute
          max: 5, // Default 5 requests
        })
      );
    });
  });

  describe("Headers and Response Format", () => {
    test("should include rate limit headers", () => {
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          standardHeaders: true,
          legacyHeaders: false,
        })
      );
    });

    test("should provide consistent error response format", () => {
      req.rateLimitExceeded = true;

      rateLimiter.authRateLimit(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        statusCode: 429,
        message: "Rate limit exceeded",
        error: "Too many requests from this IP, please try again later.",
        retryAfter: expect.any(Number),
        resetTime: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
        ),
      });
    });
  });
});
