/**
 * Authentication Middleware Factory
 *
 * Specialized factory for creating authentication middleware using the generic
 * middleware factory. Provides auth-specific configurations and patterns.
 * @module factories/authMiddlewareFactory
 */

import { AuthenticatedRequest } from "@/types/express-extension";
import { ErrorType } from "@/utilities/error-handler";
import {
  createMiddleware,
  registerMiddleware,
  getMiddlewareFactory,
  InputExtractors,
  ErrorHandlers,
  MiddlewareConfig,
  MiddlewareOptions,
  MiddlewareFunction,
} from "./middleware-factory";
import {
  extractTokenFromHeader,
  isValidTokenFormat,
  decodeTokenWithoutVerification,
  extractRefreshToken,
  extractVerificationToken,
} from "@/utilities/token-utils";
import {
  extractUserContext,
  createSessionContext,
  createExpiredSessionContext,
  addUserIdToBody,
} from "@/contexts/auth-context";

const jwt = require("@/utilities/jwt");

/**
 * Authentication middleware configuration options
 */
export interface AuthMiddlewareConfig extends MiddlewareOptions {
  /** Whether to extract user ID to request body for backward compatibility */
  extractToBody?: boolean;

  /** Whether to handle expired tokens gracefully */
  handleExpiredGracefully?: boolean;

  /** Custom token verification function */
  customVerifier?: (token: string) => any;
}

/**
 * Token input interface
 */
interface TokenInput {
  token: string | null;
  source: "header" | "cookie" | "body";
}

/**
 * Authentication result interface
 */
interface AuthResult {
  user: any;
  session?: any;
  expired?: boolean;
}

/**
 * Authentication Middleware Factory Class
 */
export class AuthMiddlewareFactory {
  private static instance: AuthMiddlewareFactory;
  private factory = getMiddlewareFactory();

  /**
   * Get singleton instance
   */
  static getInstance(): AuthMiddlewareFactory {
    if (!AuthMiddlewareFactory.instance) {
      AuthMiddlewareFactory.instance = new AuthMiddlewareFactory();
      AuthMiddlewareFactory.instance.registerDefaultConfigurations();
    }
    return AuthMiddlewareFactory.instance;
  }

  /**
   * Register default authentication middleware configurations
   */
  private registerDefaultConfigurations(): void {
    // Access token middleware configuration
    this.factory.registerMiddleware<TokenInput, AuthResult>("accessToken", {
      name: "Access Token Authentication",
      inputExtractor: async (context) => ({
        token: extractTokenFromHeader(context.req.headers.authorization),
        source: "header" as const,
      }),
      validator: async (input) => {
        if (!input.token) return false;
        return isValidTokenFormat(input.token);
      },
      processor: async (input) => {
        const payload = jwt.access.verify(input.token);
        const userContext = extractUserContext(payload);
        return { user: userContext };
      },
      successHandler: async (result, context) => {
        const req = context.req as AuthenticatedRequest;
        req.user = result.user;

        // Add user ID to body for backward compatibility
        if (!req.body) req.body = {};
        addUserIdToBody(req.body, result.user);
      },
      errorHandler: ErrorHandlers.authentication,
      validationErrorType: ErrorType.NO_TOKEN,
      validationErrorMessage: "Authentication token is required",
    });

    // Refresh token middleware configuration
    this.factory.registerMiddleware<TokenInput, AuthResult>("refreshToken", {
      name: "Refresh Token Authentication",
      inputExtractor: async (context) => ({
        token: extractRefreshToken(context.req.cookies),
        source: "cookie" as const,
      }),
      validator: async (input) => {
        if (!input.token) return false;
        return isValidTokenFormat(input.token);
      },
      processor: async (input, context) => {
        try {
          const payload = jwt.refresh.verify(input.token);
          const sessionContext = createSessionContext(payload);
          return { user: sessionContext };
        } catch (error: any) {
          // Handle expired tokens gracefully for refresh token middleware
          if (
            error.message.includes("expired") ||
            error.name === "TokenExpiredError"
          ) {
            const decodedPayload = decodeTokenWithoutVerification(input.token!);
            const expiredContext = createExpiredSessionContext(decodedPayload);
            return { user: expiredContext, expired: true };
          }
          throw error;
        }
      },
      successHandler: async (result, context) => {
        const req = context.req as AuthenticatedRequest;
        req.user = result.user;
      },
      errorHandler: (error) => {
        return ErrorHandlers.authentication(error);
      },
      validationErrorType: ErrorType.NO_TOKEN,
      validationErrorMessage: "Refresh token is required",
    });

    // Verification token middleware configuration
    this.factory.registerMiddleware<TokenInput, AuthResult>(
      "verificationToken",
      {
        name: "Verification Token Authentication",
        inputExtractor: async (context) => ({
          token: extractVerificationToken(context.req.body),
          source: "body" as const,
        }),
        validator: async (input) => {
          if (!input.token) return false;
          return isValidTokenFormat(input.token);
        },
        processor: async (input) => {
          const payload = jwt.verification.verify(input.token);
          return { user: payload };
        },
        successHandler: async (result, context) => {
          const req = context.req as AuthenticatedRequest;
          req.user = result.user;
        },
        errorHandler: ErrorHandlers.authentication,
        validationErrorType: ErrorType.NO_TOKEN,
        validationErrorMessage: "Verification token is required",
      }
    );
  }

  /**
   * Create access token middleware
   */
  createAccessTokenMiddleware(
    config: AuthMiddlewareConfig = {}
  ): MiddlewareFunction<AuthenticatedRequest> {
    return this.factory.createFromRegistry<AuthenticatedRequest>(
      "accessToken",
      {
        enableLogging: config.enableLogging,
        category: "authentication",
        requestType: "AuthenticatedRequest",
      }
    );
  }

  /**
   * Create refresh token middleware
   */
  createRefreshTokenMiddleware(
    config: AuthMiddlewareConfig = {}
  ): MiddlewareFunction<AuthenticatedRequest> {
    return this.factory.createFromRegistry<AuthenticatedRequest>(
      "refreshToken",
      {
        enableLogging: config.enableLogging,
        category: "authentication",
        requestType: "AuthenticatedRequest",
      }
    );
  }

  /**
   * Create verification token middleware
   */
  createVerificationTokenMiddleware(
    config: AuthMiddlewareConfig = {}
  ): MiddlewareFunction<AuthenticatedRequest> {
    return this.factory.createFromRegistry<AuthenticatedRequest>(
      "verificationToken",
      {
        enableLogging: config.enableLogging,
        category: "authentication",
        requestType: "AuthenticatedRequest",
      }
    );
  }

  /**
   * Create custom authentication middleware
   */
  createCustomAuthMiddleware(
    name: string,
    config: Partial<MiddlewareConfig<TokenInput, AuthResult>>,
    options: AuthMiddlewareConfig = {}
  ): MiddlewareFunction<AuthenticatedRequest> {
    const fullConfig: MiddlewareConfig<
      TokenInput,
      AuthResult,
      AuthenticatedRequest
    > = {
      name: name,
      inputExtractor:
        config.inputExtractor ||
        (async (context) => ({
          token:
            context.req.headers.authorization?.replace("Bearer ", "") || null,
          source: "header" as const,
        })),
      validator: config.validator,
      processor: config.processor!,
      successHandler:
        config.successHandler ||
        ((result, context) => {
          const req = context.req as AuthenticatedRequest;
          req.user = result.user;
        }),
      errorHandler: config.errorHandler || ErrorHandlers.authentication,
      validationErrorType: config.validationErrorType || ErrorType.NO_TOKEN,
      validationErrorMessage:
        config.validationErrorMessage || "Authentication required",
      skipOnValidationFailure: config.skipOnValidationFailure,
      continueOnSuccess: config.continueOnSuccess ?? true,
    };

    return this.factory.createMiddleware<
      TokenInput,
      AuthResult,
      AuthenticatedRequest
    >(fullConfig, {
      enableLogging: options.enableLogging,
      category: "authentication",
      requestType: "AuthenticatedRequest",
    });
  }

  /**
   * Create authentication pipeline with multiple token types
   */
  createAuthPipeline(
    tokenTypes: ("access" | "refresh" | "verification")[],
    config: AuthMiddlewareConfig = {}
  ): MiddlewareFunction<AuthenticatedRequest>[] {
    return tokenTypes.map((type) => {
      switch (type) {
        case "access":
          return this.createAccessTokenMiddleware(config);
        case "refresh":
          return this.createRefreshTokenMiddleware(config);
        case "verification":
          return this.createVerificationTokenMiddleware(config);
        default:
          throw new Error(`Unknown token type: ${type}`);
      }
    });
  }
}

/**
 * Convenience functions for creating authentication middleware
 */
export const getAuthMiddlewareFactory = (): AuthMiddlewareFactory => {
  return AuthMiddlewareFactory.getInstance();
};

export const createAccessTokenMiddleware = (
  config: AuthMiddlewareConfig = {}
): MiddlewareFunction<AuthenticatedRequest> => {
  return getAuthMiddlewareFactory().createAccessTokenMiddleware(config);
};

export const createRefreshTokenMiddleware = (
  config: AuthMiddlewareConfig = {}
): MiddlewareFunction<AuthenticatedRequest> => {
  return getAuthMiddlewareFactory().createRefreshTokenMiddleware(config);
};

export const createVerificationTokenMiddleware = (
  config: AuthMiddlewareConfig = {}
): MiddlewareFunction<AuthenticatedRequest> => {
  return getAuthMiddlewareFactory().createVerificationTokenMiddleware(config);
};

export const createCustomAuthMiddleware = (
  name: string,
  config: Partial<MiddlewareConfig<TokenInput, AuthResult>>,
  options: AuthMiddlewareConfig = {}
): MiddlewareFunction<AuthenticatedRequest> => {
  return getAuthMiddlewareFactory().createCustomAuthMiddleware(
    name,
    config,
    options
  );
};

export const createAuthPipeline = (
  tokenTypes: ("access" | "refresh" | "verification")[],
  config: AuthMiddlewareConfig = {}
): MiddlewareFunction<AuthenticatedRequest>[] => {
  return getAuthMiddlewareFactory().createAuthPipeline(tokenTypes, config);
};
