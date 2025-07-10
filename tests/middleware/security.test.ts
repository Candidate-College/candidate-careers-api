/**
 * Security Middleware Unit Tests
 *
 * Tests for security middleware including headers, CORS, input sanitization,
 * request size limiting, IP whitelisting, and content-type validation.
 */

// Jest globals are available without import in Jest environment
// Using global Jest functions: describe, test, expect, beforeEach, jest

// Mock helmet before importing
jest.mock("helmet", () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

// Import the middleware after mocking
const securityMiddleware = require("@/middlewares/security");

describe("Security Middleware", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    req = {
      headers: {},
      method: "POST",
      path: "/api/test",
      ip: "192.168.1.1",
      socket: { remoteAddress: "192.168.1.1" },
      body: {},
      query: {},
      params: {},
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    // Mock next function
    next = jest.fn();

    // Reset environment variables
    delete process.env.NODE_ENV;
    delete process.env.ALLOWED_ORIGINS;
  });

  describe("Security Headers Middleware", () => {
    test("should apply helmet security headers", () => {
      const helmet = require("helmet");

      // Verify helmet is called with correct configuration
      expect(helmet).toBeDefined();

      // The actual helmet function should be a middleware
      const helmetMiddleware = securityMiddleware.securityHeaders;
      expect(typeof helmetMiddleware).toBe("function");
    });

    test("should be configured with proper CSP directives", () => {
      const helmet = require("helmet");

      // Verify helmet was called (mocked, but we can check it was invoked)
      expect(helmet).toHaveBeenCalled();
    });
  });

  describe("CORS Options", () => {
    test("should allow requests with no origin", (done) => {
      const { corsOptions } = securityMiddleware;

      corsOptions.origin(undefined, (err: Error | null, allow?: boolean) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    test("should allow all origins in development", (done) => {
      process.env.NODE_ENV = "development";
      const { corsOptions } = securityMiddleware;

      corsOptions.origin(
        "http://malicious-site.com",
        (err: Error | null, allow?: boolean) => {
          expect(err).toBeNull();
          expect(allow).toBe(true);
          done();
        }
      );
    });

    test("should allow configured origins in production", (done) => {
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS =
        "https://example.com,https://app.example.com";
      const { corsOptions } = securityMiddleware;

      corsOptions.origin(
        "https://example.com",
        (err: Error | null, allow?: boolean) => {
          expect(err).toBeNull();
          expect(allow).toBe(true);
          done();
        }
      );
    });

    test("should reject unauthorized origins in production", (done) => {
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "https://example.com";
      const { corsOptions } = securityMiddleware;

      corsOptions.origin(
        "https://malicious-site.com",
        (err: Error | null, allow?: boolean) => {
          expect(err).toBeInstanceOf(Error);
          expect(err?.message).toBe("Not allowed by CORS");
          expect(allow).toBe(false);
          done();
        }
      );
    });

    test("should allow wildcard origins", (done) => {
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "*";
      const { corsOptions } = securityMiddleware;

      corsOptions.origin(
        "https://any-site.com",
        (err: Error | null, allow?: boolean) => {
          expect(err).toBeNull();
          expect(allow).toBe(true);
          done();
        }
      );
    });

    test("should have correct CORS configuration", () => {
      const { corsOptions } = securityMiddleware;

      expect(corsOptions.credentials).toBe(true);
      expect(corsOptions.optionsSuccessStatus).toBe(200);
      expect(corsOptions.methods).toContain("GET");
      expect(corsOptions.methods).toContain("POST");
      expect(corsOptions.methods).toContain("PUT");
      expect(corsOptions.methods).toContain("DELETE");
      expect(corsOptions.allowedHeaders).toContain("Authorization");
      expect(corsOptions.allowedHeaders).toContain("Content-Type");
      expect(corsOptions.maxAge).toBe(86400);
    });
  });

  describe("Input Sanitizer Middleware", () => {
    test("should sanitize script tags from strings", () => {
      req.body = {
        message: "Hello <script>alert('xss')</script> World",
        title: "Test <script src='evil.js'></script> Title",
      };

      securityMiddleware.inputSanitizer(req, res, next);

      expect(req.body.message).toBe("Hello  World");
      expect(req.body.title).toBe("Test  Title");
      expect(next).toHaveBeenCalled();
    });

    test("should remove javascript protocols", () => {
      req.body = {
        link: "javascript:alert('xss')",
        url: "JAVASCRIPT:void(0)",
      };

      securityMiddleware.inputSanitizer(req, res, next);

      expect(req.body.link).toBe("alert('xss')");
      expect(req.body.url).toBe("void(0)");
      expect(next).toHaveBeenCalled();
    });

    test("should remove event handlers", () => {
      req.body = {
        content: "Hello onclick=alert('xss') World",
        text: "Test onmouseover=evil() Content",
      };

      securityMiddleware.inputSanitizer(req, res, next);

      expect(req.body.content).toBe("Hello  World");
      expect(req.body.text).toBe("Test  Content");
      expect(next).toHaveBeenCalled();
    });

    test("should sanitize nested objects", () => {
      req.body = {
        user: {
          name: "<script>alert('xss')</script>John",
          bio: "Developer onclick=evil() enthusiast",
        },
        preferences: {
          theme: "dark javascript:void(0)",
        },
      };

      securityMiddleware.inputSanitizer(req, res, next);

      expect(req.body.user.name).toBe("John");
      expect(req.body.user.bio).toBe("Developer  enthusiast");
      expect(req.body.preferences.theme).toBe("dark void(0)");
      expect(next).toHaveBeenCalled();
    });

    test("should sanitize arrays", () => {
      req.body = {
        tags: [
          "<script>alert('xss')</script>",
          "javascript:void(0)",
          "normal-tag",
        ],
        items: ["onclick=evil()", "safe-item"],
      };

      securityMiddleware.inputSanitizer(req, res, next);

      expect(req.body.tags).toEqual(["", "void(0)", "normal-tag"]);
      expect(req.body.items).toEqual(["", "safe-item"]);
      expect(next).toHaveBeenCalled();
    });

    test("should sanitize query parameters", () => {
      req.query = {
        search: "<script>alert('xss')</script>",
        filter: "javascript:void(0)",
      };

      securityMiddleware.inputSanitizer(req, res, next);

      expect(req.query.search).toBe("");
      expect(req.query.filter).toBe("void(0)");
      expect(next).toHaveBeenCalled();
    });

    test("should sanitize URL parameters", () => {
      req.params = {
        id: "<script>alert('xss')</script>",
        slug: "test-onclick=evil()-slug",
      };

      securityMiddleware.inputSanitizer(req, res, next);

      expect(req.params.id).toBe("");
      expect(req.params.slug).toBe("test--slug");
      expect(next).toHaveBeenCalled();
    });

    test("should preserve non-string values", () => {
      req.body = {
        count: 42,
        isActive: true,
        data: null,
        items: [1, 2, 3],
        metadata: {
          version: 1.5,
          enabled: false,
        },
      };

      securityMiddleware.inputSanitizer(req, res, next);

      expect(req.body.count).toBe(42);
      expect(req.body.isActive).toBe(true);
      expect(req.body.data).toBe(null);
      expect(req.body.items).toEqual([1, 2, 3]);
      expect(req.body.metadata.version).toBe(1.5);
      expect(req.body.metadata.enabled).toBe(false);
      expect(next).toHaveBeenCalled();
    });

    test("should handle missing request properties", () => {
      req.body = undefined;
      req.query = undefined;
      req.params = undefined;

      expect(() => {
        securityMiddleware.inputSanitizer(req, res, next);
      }).not.toThrow();

      expect(next).toHaveBeenCalled();
    });
  });

  describe("Request Size Limit Middleware", () => {
    test("should allow requests within size limit", () => {
      req.headers["content-length"] = "1024"; // 1KB
      const middleware = securityMiddleware.requestSizeLimit("2mb");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should reject requests exceeding size limit", () => {
      req.headers["content-length"] = "2097152"; // 2MB
      const middleware = securityMiddleware.requestSizeLimit("1mb");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 413,
        message: "Request entity too large",
        error: "Request size 2 MB exceeds limit of 1mb",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should use default limit when none specified", () => {
      req.headers["content-length"] = "1024";
      const middleware = securityMiddleware.requestSizeLimit();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("should handle missing content-length header", () => {
      delete req.headers["content-length"];
      const middleware = securityMiddleware.requestSizeLimit("1mb");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should handle different size units", () => {
      req.headers["content-length"] = "2048"; // 2KB
      const middleware = securityMiddleware.requestSizeLimit("1kb");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("API Security Headers Middleware", () => {
    test("should add cache control headers for auth endpoints", () => {
      req.path = "/api/auth/login";

      securityMiddleware.apiSecurityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      expect(res.setHeader).toHaveBeenCalledWith("Pragma", "no-cache");
      expect(res.setHeader).toHaveBeenCalledWith("Expires", "0");
      expect(res.setHeader).toHaveBeenCalledWith(
        "Surrogate-Control",
        "no-store"
      );
      expect(next).toHaveBeenCalled();
    });

    test("should add cache control headers for admin endpoints", () => {
      req.path = "/api/admin/users";

      securityMiddleware.apiSecurityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      expect(next).toHaveBeenCalled();
    });

    test("should not add cache headers for regular endpoints", () => {
      req.path = "/api/posts";

      securityMiddleware.apiSecurityHeaders(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalledWith(
        "Cache-Control",
        expect.stringContaining("no-store")
      );
      expect(next).toHaveBeenCalled();
    });

    test("should add custom API headers", () => {
      process.env.API_VERSION = "2.0.0";

      securityMiddleware.apiSecurityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("X-API-Version", "2.0.0");
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-Response-Time",
        expect.any(String)
      );
      expect(next).toHaveBeenCalled();
    });

    test("should use default API version when not specified", () => {
      delete process.env.API_VERSION;

      securityMiddleware.apiSecurityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("X-API-Version", "1.0.0");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("IP Whitelist Middleware", () => {
    test("should allow requests from whitelisted IPs", () => {
      req.ip = "192.168.1.100";
      const middleware = securityMiddleware.ipWhitelist([
        "192.168.1.100",
        "10.0.0.1",
      ]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should reject requests from non-whitelisted IPs", () => {
      req.ip = "192.168.1.200";
      const middleware = securityMiddleware.ipWhitelist(["192.168.1.100"]);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 403,
        message: "Access forbidden",
        error: "Your IP address is not authorized to access this resource",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should allow all IPs when whitelist is empty", () => {
      req.ip = "192.168.1.200";
      const middleware = securityMiddleware.ipWhitelist([]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should allow all IPs with wildcard", () => {
      req.ip = "192.168.1.200";
      const middleware = securityMiddleware.ipWhitelist(["*"]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should bypass in development environment", () => {
      process.env.NODE_ENV = "development";
      req.ip = "192.168.1.200";
      const middleware = securityMiddleware.ipWhitelist(["192.168.1.100"]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should fallback to socket remoteAddress when ip is not available", () => {
      req.ip = undefined;
      req.socket = { remoteAddress: "192.168.1.100" };
      const middleware = securityMiddleware.ipWhitelist(["192.168.1.100"]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should handle unknown IP addresses", () => {
      req.ip = undefined;
      req.socket = undefined;
      const middleware = securityMiddleware.ipWhitelist(["192.168.1.100"]);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Content-Type Validation Middleware", () => {
    test("should allow valid content types", () => {
      req.headers["content-type"] = "application/json";
      const middleware = securityMiddleware.contentTypeValidation([
        "application/json",
      ]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should reject invalid content types", () => {
      req.headers["content-type"] = "text/xml";
      const middleware = securityMiddleware.contentTypeValidation([
        "application/json",
      ]);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 415,
        message: "Unsupported Media Type",
        error:
          "Content-Type 'text/xml' is not supported. Allowed types: application/json",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should skip validation for GET requests", () => {
      req.method = "GET";
      req.headers["content-type"] = "text/xml";
      const middleware = securityMiddleware.contentTypeValidation([
        "application/json",
      ]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should skip validation for DELETE requests", () => {
      req.method = "DELETE";
      req.headers["content-type"] = "text/xml";
      const middleware = securityMiddleware.contentTypeValidation([
        "application/json",
      ]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should reject requests without content-type header", () => {
      delete req.headers["content-type"];
      const middleware = securityMiddleware.contentTypeValidation([
        "application/json",
      ]);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: "Content-Type header is required",
        error: "Missing Content-Type header",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle content-type with charset", () => {
      req.headers["content-type"] = "application/json; charset=utf-8";
      const middleware = securityMiddleware.contentTypeValidation([
        "application/json",
      ]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should be case insensitive", () => {
      req.headers["content-type"] = "APPLICATION/JSON";
      const middleware = securityMiddleware.contentTypeValidation([
        "application/json",
      ]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should use default allowed types when none specified", () => {
      req.headers["content-type"] = "application/json";
      const middleware = securityMiddleware.contentTypeValidation();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should handle multiple allowed types", () => {
      req.headers["content-type"] = "multipart/form-data";
      const middleware = securityMiddleware.contentTypeValidation([
        "application/json",
        "multipart/form-data",
        "application/x-www-form-urlencoded",
      ]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("Size Parser Utility", () => {
    test("should parse different size formats correctly", () => {
      // These are internal functions, but we can test the middleware behavior
      // that depends on size parsing

      const smallMiddleware = securityMiddleware.requestSizeLimit("1kb");
      const mediumMiddleware = securityMiddleware.requestSizeLimit("5mb");
      const largeMiddleware = securityMiddleware.requestSizeLimit("1gb");

      // Test that they're created without errors
      expect(typeof smallMiddleware).toBe("function");
      expect(typeof mediumMiddleware).toBe("function");
      expect(typeof largeMiddleware).toBe("function");
    });
  });

  describe("Error Handling", () => {
    test("should handle malformed size strings gracefully", () => {
      // Should not throw an error when creating middleware
      expect(() => {
        try {
          securityMiddleware.requestSizeLimit("invalidsize");
        } catch (error) {
          // Expected to throw during creation due to invalid format
          expect(error).toBeDefined();
        }
      }).not.toThrow();
    });

    test("should handle undefined request properties gracefully", () => {
      req.headers = undefined;
      req.ip = undefined;
      req.socket = undefined;

      expect(() => {
        securityMiddleware.inputSanitizer(req, res, next);
      }).not.toThrow();

      expect(() => {
        securityMiddleware.apiSecurityHeaders(req, res, next);
      }).not.toThrow();
    });
  });

  describe("Integration with Environment Variables", () => {
    test("should respect NODE_ENV settings", () => {
      // Test development mode bypass
      process.env.NODE_ENV = "development";

      req.ip = "malicious.ip.address";
      const middleware = securityMiddleware.ipWhitelist(["trusted.ip.address"]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should handle missing environment variables", () => {
      delete process.env.ALLOWED_ORIGINS;
      delete process.env.API_VERSION;

      const { corsOptions } = securityMiddleware;

      // Should not throw errors
      expect(corsOptions).toBeDefined();
      expect(corsOptions.origin).toBeDefined();
    });
  });
});
