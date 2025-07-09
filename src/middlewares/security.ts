/**
 * Security Middleware
 *
 * Provides comprehensive security headers, CORS configuration, and input
 * sanitization to protect the application from common vulnerabilities.
 *
 * @module middlewares/security
 */

import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

/**
 * Security configuration interface
 */
interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXFrameOptions: boolean;
  enableXSSProtection: boolean;
  enableNoSniff: boolean;
  trustedDomains: string[];
}

/**
 * Get security configuration from environment
 */
const getSecurityConfig = (): SecurityConfig => {
  return {
    enableCSP: process.env.ENABLE_CSP !== "false",
    enableHSTS: process.env.ENABLE_HSTS !== "false",
    enableXFrameOptions: process.env.ENABLE_X_FRAME_OPTIONS !== "false",
    enableXSSProtection: process.env.ENABLE_XSS_PROTECTION !== "false",
    enableNoSniff: process.env.ENABLE_NO_SNIFF !== "false",
    trustedDomains: process.env.TRUSTED_DOMAINS?.split(",") || [],
  };
};

/**
 * Comprehensive security headers middleware using Helmet
 */
exports.securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
    reportOnly: process.env.NODE_ENV === "development",
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: "deny",
  },

  // X-XSS-Protection
  xssFilter: true,

  // X-Content-Type-Options
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: ["strict-origin-when-cross-origin"],
  },

  // Note: Permissions Policy is not supported in this version of helmet
  // Consider upgrading helmet to use permissionsPolicy in future versions

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Note: Expect-CT is not supported in this version of helmet
  // Consider upgrading helmet to use expectCt in future versions
});

/**
 * Enhanced CORS configuration
 */
exports.corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];

    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);

    // Allow all origins in development
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"), false);
  },

  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204

  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "X-API-Key",
  ],

  exposedHeaders: [
    "RateLimit-Limit",
    "RateLimit-Remaining",
    "RateLimit-Reset",
    "X-Total-Count",
  ],

  maxAge: 86400, // 24 hours
};

/**
 * Input sanitization middleware
 */
exports.inputSanitizer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === "string") {
      // Normalize Unicode first to prevent bypass attacks
      let sanitized = value.normalize("NFKC");

      // More comprehensive XSS prevention patterns
      sanitized = sanitized
        // Remove all script tags and their contents (case insensitive)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        // Remove javascript: protocols (including encoded variants)
        .replace(/(?:javascript|vbscript|data|livescript|mocha):/gi, "")
        // Remove event handlers (more comprehensive)
        .replace(/\s*on\w+\s*=\s*["\'][^"\']*["\']/gi, "")
        .replace(/\s*on\w+\s*=\s*[^>\s]+/gi, "")
        // Remove dangerous HTML tags
        .replace(
          /<(iframe|object|embed|applet|meta|link|style|base)[^>]*>/gi,
          ""
        )
        // Remove expressions and eval
        .replace(/expression\s*\(/gi, "")
        .replace(/eval\s*\(/gi, "")
        // Remove potential HTML injection attempts
        .replace(/<[^>]*>/g, (match) => {
          // Allow safe tags only, strip attributes from others
          const safeTags = ["b", "i", "u", "strong", "em", "p", "br"];
          const tagMatch = match.match(/<\/?(\w+)/);
          if (tagMatch && safeTags.includes(tagMatch[1].toLowerCase())) {
            return `<${tagMatch[1]}>`;
          }
          return "";
        })
        .trim();

      return sanitized;
    }

    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }

    if (value && typeof value === "object") {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        // Also sanitize object keys to prevent key injection
        const sanitizedKey =
          typeof key === "string" ? key.replace(/[<>'"&]/g, "") : key;
        sanitized[sanitizedKey] = sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * Request size limiting middleware
 */
exports.requestSizeLimit = (maxSize: string = "10mb") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers["content-length"];

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);

      if (sizeInBytes > maxSizeInBytes) {
        res.status(413).json({
          statusCode: 413,
          message: "Request entity too large",
          error: `Request size ${formatBytes(
            sizeInBytes
          )} exceeds limit of ${maxSize}`,
        });
        return;
      }
    }

    next();
  };
};

/**
 * Security headers for API responses
 */
exports.apiSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent caching of sensitive endpoints
  if (req.path.includes("/auth/") || req.path.includes("/admin/")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }

  // Add custom security headers
  res.setHeader("X-API-Version", process.env.API_VERSION || "1.0.0");
  res.setHeader("X-Response-Time", Date.now().toString());

  next();
};

/**
 * IP whitelist middleware for admin endpoints
 */
exports.ipWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.socket?.remoteAddress || "unknown";

    // Skip in development environment
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    // If no whitelist specified, allow all
    if (allowedIPs.length === 0) {
      return next();
    }

    // Check if IP is in whitelist
    if (allowedIPs.includes(clientIP) || allowedIPs.includes("*")) {
      return next();
    }

    res.status(403).json({
      statusCode: 403,
      message: "Access forbidden",
      error: "Your IP address is not authorized to access this resource",
    });
    return;
  };
};

/**
 * Content-Type validation middleware
 */
exports.contentTypeValidation = (
  allowedTypes: string[] = ["application/json"]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip for GET and DELETE requests
    if (["GET", "DELETE"].includes(req.method)) {
      return next();
    }

    const contentType = req.headers["content-type"];

    if (!contentType) {
      res.status(400).json({
        statusCode: 400,
        message: "Content-Type header is required",
        error: "Missing Content-Type header",
      });
      return;
    }

    const isAllowed = allowedTypes.some((type) =>
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      res.status(415).json({
        statusCode: 415,
        message: "Unsupported Media Type",
        error: `Content-Type '${contentType}' is not supported. Allowed types: ${allowedTypes.join(
          ", "
        )}`,
      });
      return;
    }

    next();
  };
};

/**
 * Helper function to parse size string to bytes
 */
const parseSize = (sizeStr: string): number => {
  if (!sizeStr || typeof sizeStr !== "string") {
    throw new Error("Size parameter must be a non-empty string");
  }

  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const regex = /^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/i;
  const match = regex.exec(sizeStr.toLowerCase().trim());

  if (!match) {
    throw new Error(
      `Invalid size format: ${sizeStr}. Expected format: "10mb", "500kb", etc.`
    );
  }

  const [, sizeValue, unit] = match;
  const numericSize = parseFloat(sizeValue);

  if (isNaN(numericSize) || numericSize < 0) {
    throw new Error(
      `Invalid size value: ${sizeValue}. Must be a positive number.`
    );
  }

  // Prevent extremely large values that could cause issues
  if (numericSize > Number.MAX_SAFE_INTEGER / units[unit.toLowerCase()]) {
    throw new Error(`Size value too large: ${sizeStr}`);
  }

  return numericSize * units[unit.toLowerCase()];
};

/**
 * Helper function to format bytes for display
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
