/**
 * Generic Middleware Factory
 *
 * Provides a flexible, reusable factory for creating various types of middleware
 * functions with consistent patterns and error handling. Follows Factory Pattern,
 * Strategy Pattern, and SOLID principles for maximum extensibility.
 * @module factories/middlewareFactory
 */

import { Request, NextFunction } from "express";
import { JsonResponse } from "@/types/express-extension";
import {
  createError,
  sendErrorResponse,
  ErrorType,
  AppError,
} from "@/utilities/error-handler";

/**
 * Generic middleware function type
 */
export type MiddlewareFunction<TRequest = Request> = (
  req: TRequest,
  res: JsonResponse,
  next: NextFunction
) => void | Promise<void>;

/**
 * Middleware execution context
 */
export interface MiddlewareContext<TRequest extends Request = Request> {
  req: TRequest;
  res: JsonResponse;
  next: NextFunction;
}

/**
 * Validator function type for input validation
 */
export type ValidatorFunction<
  TInput = any,
  TRequest extends Request = Request
> = (
  input: TInput,
  context: MiddlewareContext<TRequest>
) => Promise<boolean> | boolean;

/**
 * Processor function type for data processing
 */
export type ProcessorFunction<
  TInput = any,
  TOutput = any,
  TRequest extends Request = Request
> = (
  input: TInput,
  context: MiddlewareContext<TRequest>
) => Promise<TOutput> | TOutput;

/**
 * Error handler function type
 */
export type ErrorHandlerFunction<TRequest extends Request = Request> = (
  error: any,
  context: MiddlewareContext<TRequest>
) => AppError;

/**
 * Success handler function type
 */
export type SuccessHandlerFunction<
  TResult = any,
  TRequest extends Request = Request
> = (
  result: TResult,
  context: MiddlewareContext<TRequest>
) => void | Promise<void>;

/**
 * Input extractor function type
 */
export type InputExtractorFunction<
  TInput = any,
  TRequest extends Request = Request
> = (context: MiddlewareContext<TRequest>) => TInput | Promise<TInput>;

/**
 * Configuration for middleware creation
 */
export interface MiddlewareConfig<
  TInput = any,
  TOutput = any,
  TRequest extends Request = Request
> {
  /** Name of the middleware for debugging/logging */
  name: string;

  /** Function to extract input from request */
  inputExtractor: InputExtractorFunction<TInput, TRequest>;

  /** Function to validate the extracted input */
  validator?: ValidatorFunction<TInput, TRequest>;

  /** Function to process the validated input */
  processor: ProcessorFunction<TInput, TOutput, TRequest>;

  /** Function to handle processing results */
  successHandler?: SuccessHandlerFunction<TOutput, TRequest>;

  /** Function to handle errors */
  errorHandler?: ErrorHandlerFunction<TRequest>;

  /** Whether to skip processing on validation failure */
  skipOnValidationFailure?: boolean;

  /** Whether to continue to next middleware on success */
  continueOnSuccess?: boolean;

  /** Custom error type for validation failures */
  validationErrorType?: ErrorType;

  /** Custom error message for validation failures */
  validationErrorMessage?: string;
}

/**
 * Middleware creation options
 */
export interface MiddlewareOptions {
  /** Enable detailed logging for debugging */
  enableLogging?: boolean;

  /** Custom request type */
  requestType?: string;

  /** Middleware category for organization */
  category?: string;
}

/**
 * Result of middleware execution
 */
export interface MiddlewareResult<TOutput = any> {
  success: boolean;
  data?: TOutput;
  error?: AppError;
  skipped?: boolean;
}

/**
 * Generic middleware factory class
 */
export class MiddlewareFactory {
  private static instance: MiddlewareFactory;
  private readonly middlewareRegistry = new Map<string, MiddlewareConfig>();

  /**
   * Get singleton instance
   */
  static getInstance(): MiddlewareFactory {
    if (!MiddlewareFactory.instance) {
      MiddlewareFactory.instance = new MiddlewareFactory();
    }
    return MiddlewareFactory.instance;
  }

  /**
   * Register a middleware configuration for reuse
   */
  registerMiddleware<TInput = any, TOutput = any>(
    name: string,
    config: MiddlewareConfig<TInput, TOutput>
  ): void {
    this.middlewareRegistry.set(name, config);
  }

  /**
   * Create middleware function from configuration
   */
  createMiddleware<
    TInput = any,
    TOutput = any,
    TRequest extends Request = Request
  >(
    config: MiddlewareConfig<TInput, TOutput, TRequest>,
    options: MiddlewareOptions = {}
  ): MiddlewareFunction<TRequest> {
    const {
      name,
      inputExtractor,
      validator,
      processor,
      successHandler,
      errorHandler,
      skipOnValidationFailure = false,
      continueOnSuccess = true,
      validationErrorType = ErrorType.VALIDATION_FAILED,
      validationErrorMessage = "Validation failed",
    } = config;

    return async (
      req: TRequest,
      res: JsonResponse,
      next: NextFunction
    ): Promise<void> => {
      const context: MiddlewareContext<TRequest> = { req, res, next };

      try {
        this.logExecutionStart(name, options);

        const input = await inputExtractor(context);

        const validationResult = await this.validateInput(
          input,
          context,
          validator,
          skipOnValidationFailure,
          validationErrorType,
          validationErrorMessage,
          name,
          options
        );

        if (validationResult.shouldReturn) {
          return validationResult.action === "next"
            ? next()
            : validationResult.response;
        }

        const result = await processor(input, context);

        await this.handleSuccess(
          result,
          context,
          successHandler,
          name,
          options
        );

        if (continueOnSuccess) {
          return next();
        }
      } catch (error: any) {
        return this.handleError(
          error,
          context,
          errorHandler,
          name,
          options,
          res
        );
      }
    };
  }

  /**
   * Log middleware execution start
   */
  private logExecutionStart(name: string, options: MiddlewareOptions): void {
    if (options.enableLogging) {
      console.log(`[${name}] Middleware execution started`);
    }
  }

  /**
   * Validate input with comprehensive handling
   */
  private async validateInput<TInput, TRequest extends Request>(
    input: TInput,
    context: MiddlewareContext<TRequest>,
    validator: ValidatorFunction<TInput, TRequest> | undefined,
    skipOnValidationFailure: boolean,
    validationErrorType: ErrorType,
    validationErrorMessage: string,
    name: string,
    options: MiddlewareOptions
  ): Promise<{
    shouldReturn: boolean;
    action?: "next" | "error";
    response?: any;
  }> {
    if (!validator) {
      return { shouldReturn: false };
    }

    const isValid = await validator(input, context);

    if (isValid) {
      return { shouldReturn: false };
    }

    if (skipOnValidationFailure) {
      if (options.enableLogging) {
        console.log(`[${name}] Validation failed, skipping processing`);
      }
      return { shouldReturn: true, action: "next" };
    }

    const error = createError(validationErrorType, validationErrorMessage);
    return {
      shouldReturn: true,
      action: "error",
      response: sendErrorResponse(context.res, error),
    };
  }

  /**
   * Handle successful processing
   */
  private async handleSuccess<TOutput, TRequest extends Request>(
    result: TOutput,
    context: MiddlewareContext<TRequest>,
    successHandler: SuccessHandlerFunction<TOutput, TRequest> | undefined,
    name: string,
    options: MiddlewareOptions
  ): Promise<void> {
    if (successHandler) {
      await successHandler(result, context);
    }

    if (options.enableLogging) {
      console.log(`[${name}] Middleware execution completed successfully`);
    }
  }

  /**
   * Handle middleware errors
   */
  private handleError<TRequest extends Request>(
    error: any,
    context: MiddlewareContext<TRequest>,
    errorHandler: ErrorHandlerFunction<TRequest> | undefined,
    name: string,
    options: MiddlewareOptions,
    res: JsonResponse
  ): any {
    if (options.enableLogging) {
      console.error(`[${name}] Middleware execution failed:`, error);
    }

    const appError = errorHandler
      ? errorHandler(error, context)
      : createError(
          ErrorType.INTERNAL_SERVER_ERROR,
          `${name} failed: ${error.message}`
        );

    return sendErrorResponse(res, appError);
  }

  /**
   * Create middleware from registered configuration
   */
  createFromRegistry<TRequest extends Request = Request>(
    name: string,
    options: MiddlewareOptions = {}
  ): MiddlewareFunction<TRequest> {
    const config = this.middlewareRegistry.get(name);
    if (!config) {
      throw new Error(
        `Middleware configuration '${name}' not found in registry`
      );
    }

    return this.createMiddleware<any, any, TRequest>(config, options);
  }

  /**
   * Create a pipeline of multiple middleware functions
   */
  createPipeline<TRequest extends Request = Request>(
    configs: (MiddlewareConfig | string)[],
    options: MiddlewareOptions = {}
  ): MiddlewareFunction<TRequest>[] {
    return configs.map((configOrName) => {
      if (typeof configOrName === "string") {
        return this.createFromRegistry<TRequest>(configOrName, options);
      }
      return this.createMiddleware<any, any, TRequest>(configOrName, options);
    });
  }

  /**
   * Get list of registered middleware names
   */
  getRegisteredNames(): string[] {
    return Array.from(this.middlewareRegistry.keys());
  }

  /**
   * Clear registry (useful for testing)
   */
  clearRegistry(): void {
    this.middlewareRegistry.clear();
  }
}

/**
 * Convenience function to get factory instance
 */
export const getMiddlewareFactory = (): MiddlewareFactory => {
  return MiddlewareFactory.getInstance();
};

/**
 * Convenience function to create middleware
 */
export const createMiddleware = <
  TInput = any,
  TOutput = any,
  TRequest extends Request = Request
>(
  config: MiddlewareConfig<TInput, TOutput, TRequest>,
  options: MiddlewareOptions = {}
): MiddlewareFunction<TRequest> => {
  return getMiddlewareFactory().createMiddleware<TInput, TOutput, TRequest>(
    config,
    options
  );
};

/**
 * Convenience function to register middleware
 */
export const registerMiddleware = <TInput = any, TOutput = any>(
  name: string,
  config: MiddlewareConfig<TInput, TOutput>
): void => {
  return getMiddlewareFactory().registerMiddleware(name, config);
};

/**
 * Common input extractors for different middleware types
 */
export const InputExtractors = {
  /**
   * Extract authorization header
   */
  authorizationHeader: (context: MiddlewareContext) => {
    return context.req.headers.authorization;
  },

  /**
   * Extract cookies
   */
  cookies: (context: MiddlewareContext) => {
    return context.req.cookies;
  },

  /**
   * Extract request body
   */
  body: (context: MiddlewareContext) => {
    return context.req.body;
  },

  /**
   * Extract query parameters
   */
  query: (context: MiddlewareContext) => {
    return context.req.query;
  },

  /**
   * Extract route parameters
   */
  params: (context: MiddlewareContext) => {
    return context.req.params;
  },

  /**
   * Extract entire request
   */
  fullRequest: (context: MiddlewareContext) => {
    return context.req;
  },

  /**
   * Extract specific header
   */
  header: (headerName: string) => (context: MiddlewareContext) => {
    return context.req.headers[headerName.toLowerCase()];
  },

  /**
   * Extract multiple sources combined
   */
  combined:
    (...extractors: InputExtractorFunction[]) =>
    async (context: MiddlewareContext) => {
      const results = await Promise.all(
        extractors.map((extractor) => extractor(context))
      );
      return results;
    },
};

/**
 * Common error handlers for different middleware types
 */
export const ErrorHandlers = {
  /**
   * Generic validation error handler
   */
  validation: (error: any) => {
    return createError(ErrorType.VALIDATION_FAILED, error.message);
  },

  /**
   * Authentication error handler
   */
  authentication: (error: any) => {
    if (error.message?.includes("expired")) {
      return createError(ErrorType.EXPIRED_TOKEN, error.message);
    }
    if (error.message?.includes("invalid")) {
      return createError(ErrorType.INVALID_TOKEN, error.message);
    }
    return createError(ErrorType.TOKEN_VERIFICATION_FAILED, error.message);
  },

  /**
   * Database error handler
   */
  database: (error: any) => {
    if (error.code === "ECONNREFUSED") {
      return createError(ErrorType.DATABASE_CONNECTION_FAILED, error.message);
    }
    return createError(ErrorType.DATABASE_QUERY_FAILED, error.message);
  },

  /**
   * Rate limit error handler
   */
  rateLimit: (error: any) => {
    return createError(ErrorType.RATE_LIMIT_EXCEEDED, error.message);
  },

  /**
   * Generic internal error handler
   */
  internal: (error: any) => {
    return createError(ErrorType.INTERNAL_SERVER_ERROR, error.message);
  },
};
