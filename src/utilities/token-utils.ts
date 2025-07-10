/**
 * Generic Token Utilities
 *
 * Provides flexible, reusable utilities for token extraction, validation, and processing
 * across different token types and sources. Follows Strategy Pattern and Factory Pattern
 * for maximum extensibility and maintainability.
 * @module utils/tokenUtils
 */

/**
 * Token source types
 */
export enum TokenSource {
  HEADER = "header",
  COOKIE = "cookie",
  BODY = "body",
  QUERY = "query",
  CUSTOM = "custom",
}

/**
 * Token format types
 */
export enum TokenFormat {
  JWT = "jwt",
  BEARER = "bearer",
  BASIC = "basic",
  API_KEY = "api_key",
  CUSTOM = "custom",
}

/**
 * Token validation result interface
 */
export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Token extraction configuration
 */
export interface TokenExtractionConfig {
  source: TokenSource;
  format?: TokenFormat;
  headerName?: string;
  cookieName?: string;
  bodyField?: string;
  queryParam?: string;
  prefix?: string;
  caseSensitive?: boolean;
  customExtractor?: (input: any) => string | null;
}

/**
 * Decoded token interface
 */
export interface DecodedToken<T = any> {
  header?: any;
  payload?: T;
  signature?: string;
  raw: string;
  isExpired?: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
}

/**
 * Token extractor function type
 */
export type TokenExtractorFunction = (
  input: any,
  config: TokenExtractionConfig
) => string | null;

/**
 * Token validator function type
 */
export type TokenValidatorFunction = (
  token: string,
  format?: TokenFormat
) => TokenValidationResult;

/**
 * Token decoder function type
 */
export type TokenDecoderFunction<T = any> = (
  token: string
) => DecodedToken<T> | null;

/**
 * Generic Token Utilities Class
 */
export class TokenUtils {
  private static readonly extractors = new Map<
    TokenSource,
    TokenExtractorFunction
  >();
  private static readonly validators = new Map<
    TokenFormat,
    TokenValidatorFunction
  >();
  private static readonly decoders = new Map<
    TokenFormat,
    TokenDecoderFunction
  >();

  static {
    // Register default extractors
    this.registerExtractor(TokenSource.HEADER, this.extractFromHeader);
    this.registerExtractor(TokenSource.COOKIE, this.extractFromCookie);
    this.registerExtractor(TokenSource.BODY, this.extractFromBody);
    this.registerExtractor(TokenSource.QUERY, this.extractFromQuery);
    this.registerExtractor(TokenSource.CUSTOM, this.extractFromCustom);

    // Register default validators
    this.registerValidator(TokenFormat.JWT, this.validateJwtFormat);
    this.registerValidator(TokenFormat.BEARER, this.validateBearerFormat);
    this.registerValidator(TokenFormat.BASIC, this.validateBasicFormat);
    this.registerValidator(TokenFormat.API_KEY, this.validateApiKeyFormat);

    // Register default decoders
    this.registerDecoder(TokenFormat.JWT, this.decodeJwtToken);
    this.registerDecoder(TokenFormat.BEARER, this.decodeBearerToken);
  }

  /**
   * Register custom token extractor
   */
  static registerExtractor(
    source: TokenSource,
    extractor: TokenExtractorFunction
  ): void {
    this.extractors.set(source, extractor);
  }

  /**
   * Register custom token validator
   */
  static registerValidator(
    format: TokenFormat,
    validator: TokenValidatorFunction
  ): void {
    this.validators.set(format, validator);
  }

  /**
   * Register custom token decoder
   */
  static registerDecoder<T = any>(
    format: TokenFormat,
    decoder: TokenDecoderFunction<T>
  ): void {
    this.decoders.set(format, decoder);
  }

  /**
   * Extract token from various sources
   */
  static extractToken(
    input: any,
    config: TokenExtractionConfig
  ): string | null {
    const extractor = this.extractors.get(config.source);
    if (!extractor) {
      throw new Error(`No extractor registered for source: ${config.source}`);
    }
    return extractor(input, config);
  }

  /**
   * Validate token format
   */
  static validateToken(
    token: string,
    format: TokenFormat = TokenFormat.JWT
  ): TokenValidationResult {
    if (!token || typeof token !== "string") {
      return { isValid: false, error: "Token must be a non-empty string" };
    }

    const validator = this.validators.get(format);
    if (!validator) {
      return {
        isValid: false,
        error: `No validator registered for format: ${format}`,
      };
    }

    return validator(token, format);
  }

  /**
   * Decode token without verification
   */
  static decodeToken<T = any>(
    token: string,
    format: TokenFormat = TokenFormat.JWT
  ): DecodedToken<T> | null {
    const decoder = this.decoders.get(format);
    if (!decoder) {
      console.warn(`No decoder registered for format: ${format}`);
      return null;
    }
    return decoder(token) as DecodedToken<T>;
  }

  /**
   * Extract from Authorization header
   */
  private static extractFromHeader(
    input: any,
    config: TokenExtractionConfig
  ): string | null {
    const headers = input?.headers || input;
    const headerName = config.headerName?.toLowerCase() || "authorization";
    const authHeader = headers?.[headerName];

    if (!authHeader) return null;

    const normalized = authHeader.trim().replace(/\s+/g, " ");
    const prefix = config.prefix || "bearer";

    if (config.caseSensitive === false) {
      const parts = normalized.split(" ");
      if (
        parts.length === 2 &&
        parts[0].toLowerCase() === prefix.toLowerCase()
      ) {
        return parts[1];
      }
    } else {
      if (normalized.startsWith(`${prefix} `)) {
        return normalized.substring(prefix.length + 1);
      }
    }

    return normalized.includes(" ") ? null : normalized;
  }

  /**
   * Extract from cookies
   */
  private static extractFromCookie(
    input: any,
    config: TokenExtractionConfig
  ): string | null {
    const cookies = input?.cookies || input;
    const cookieName = config.cookieName || "token";
    return cookies?.[cookieName] || null;
  }

  /**
   * Extract from request body
   */
  private static extractFromBody(
    input: any,
    config: TokenExtractionConfig
  ): string | null {
    const body = input?.body || input;
    const field = config.bodyField || "token";
    return body?.[field] || null;
  }

  /**
   * Extract from query parameters
   */
  private static extractFromQuery(
    input: any,
    config: TokenExtractionConfig
  ): string | null {
    const query = input?.query || input;
    const param = config.queryParam || "token";
    return query?.[param] || null;
  }

  /**
   * Extract using custom function
   */
  private static extractFromCustom(
    input: any,
    config: TokenExtractionConfig
  ): string | null {
    if (!config.customExtractor) {
      throw new Error(
        "Custom extractor function is required for CUSTOM source"
      );
    }
    return config.customExtractor(input);
  }

  /**
   * Validate JWT format
   */
  private static validateJwtFormat(token: string): TokenValidationResult {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {
        isValid: false,
        error: "JWT must have exactly 3 parts separated by dots",
      };
    }

    const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
    for (let i = 0; i < parts.length; i++) {
      if (!base64UrlPattern.test(parts[i])) {
        return {
          isValid: false,
          error: `Part ${i + 1} is not valid base64url encoding`,
        };
      }
    }

    return { isValid: true, metadata: { parts: parts.length } };
  }

  /**
   * Validate Bearer token format
   */
  private static validateBearerFormat(token: string): TokenValidationResult {
    // Bearer tokens are typically JWTs, so validate as JWT
    return this.validateJwtFormat(token);
  }

  /**
   * Validate Basic auth format
   */
  private static validateBasicFormat(token: string): TokenValidationResult {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const hasColon = decoded.includes(":");
      return {
        isValid: hasColon,
        error: hasColon
          ? undefined
          : "Basic token must contain username:password",
        metadata: { decoded: hasColon ? decoded.split(":")[0] : undefined },
      };
    } catch {
      return { isValid: false, error: "Invalid base64 encoding" };
    }
  }

  /**
   * Validate API key format
   */
  private static validateApiKeyFormat(token: string): TokenValidationResult {
    const minLength = 16;
    const maxLength = 512;
    const isValidLength =
      token.length >= minLength && token.length <= maxLength;

    return {
      isValid: isValidLength,
      error: isValidLength
        ? undefined
        : `API key must be ${minLength}-${maxLength} characters`,
      metadata: { length: token.length },
    };
  }

  /**
   * Decode JWT token
   */
  private static decodeJwtToken<T = any>(
    token: string
  ): DecodedToken<T> | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const header = JSON.parse(
        Buffer.from(parts[0], "base64url").toString("utf-8")
      );
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf-8")
      );
      const signature = parts[2];

      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp ? payload.exp < now : false;
      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined;
      const issuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined;

      return {
        header,
        payload,
        signature,
        raw: token,
        isExpired,
        expiresAt,
        issuedAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * Decode Bearer token (typically JWT)
   */
  private static decodeBearerToken<T = any>(
    token: string
  ): DecodedToken<T> | null {
    return this.decodeJwtToken<T>(token);
  }
}

/**
 * Convenience functions for backward compatibility
 */

/**
 * Extract token from Authorization header (legacy compatibility)
 */
export const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  return TokenUtils.extractToken(
    { headers: { authorization: authHeader } },
    {
      source: TokenSource.HEADER,
      format: TokenFormat.BEARER,
      prefix: "bearer",
      caseSensitive: false,
    }
  );
};

/**
 * Validate JWT token format (legacy compatibility)
 */
export const isValidTokenFormat = (token: string): boolean => {
  return TokenUtils.validateToken(token, TokenFormat.JWT).isValid;
};

/**
 * Decode JWT without verification (legacy compatibility)
 */
export const decodeTokenWithoutVerification = <T = any>(
  token: string
): T | null => {
  const decoded = TokenUtils.decodeToken<T>(token, TokenFormat.JWT);
  return decoded?.payload || null;
};

/**
 * Extract refresh token from cookies (legacy compatibility)
 */
export const extractRefreshToken = (cookies: any): string | null => {
  return TokenUtils.extractToken(
    { cookies },
    {
      source: TokenSource.COOKIE,
      cookieName: "refresh_token",
    }
  );
};

/**
 * Extract verification token from body (legacy compatibility)
 */
export const extractVerificationToken = (body: any): string | null => {
  return TokenUtils.extractToken(
    { body },
    {
      source: TokenSource.BODY,
      bodyField: "token",
    }
  );
};

/**
 * Pre-configured extraction configs for common use cases
 */
export const TokenConfigs = {
  /**
   * Standard Bearer token from Authorization header
   */
  BEARER_HEADER: {
    source: TokenSource.HEADER,
    format: TokenFormat.BEARER,
    prefix: "bearer",
    caseSensitive: false,
  } as TokenExtractionConfig,

  /**
   * Refresh token from cookie
   */
  REFRESH_COOKIE: {
    source: TokenSource.COOKIE,
    cookieName: "refresh_token",
  } as TokenExtractionConfig,

  /**
   * Verification token from request body
   */
  VERIFICATION_BODY: {
    source: TokenSource.BODY,
    bodyField: "token",
  } as TokenExtractionConfig,

  /**
   * API key from header
   */
  API_KEY_HEADER: {
    source: TokenSource.HEADER,
    format: TokenFormat.API_KEY,
    headerName: "x-api-key",
  } as TokenExtractionConfig,

  /**
   * Session token from query parameter
   */
  SESSION_QUERY: {
    source: TokenSource.QUERY,
    queryParam: "session_token",
  } as TokenExtractionConfig,
};

// Types and main class are already exported above
