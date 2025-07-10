# Middleware Factory Guide

This guide explains how to use the new generic middleware factory system for creating flexible, reusable middleware functions across the application.

## Overview

The middleware factory system provides a consistent, configurable approach to creating middleware functions following the Factory Pattern and Strategy Pattern for maximum flexibility and reusability.

## Architecture

### Core Components

1. **Generic Middleware Factory** (`src/factories/middleware-factory.ts`)

   - Provides the foundational middleware creation system
   - Supports any type of middleware pattern
   - Configurable through interfaces and options

2. **Authentication Middleware Factory** (`src/factories/auth-middleware-factory.ts`)

   - Specialized factory for authentication middleware
   - Built on top of the generic factory
   - Provides auth-specific configurations

3. **Main Auth Middleware** (`src/middlewares/auth-middleware.ts`)
   - Entry point for authentication middleware
   - Uses the new factory system while maintaining backward compatibility

## Features

- ✅ **Generic Pattern**: Works for any middleware type (auth, validation, rate limiting, etc.)
- ✅ **Type Safety**: Full TypeScript support with generics
- ✅ **Configurable**: Flexible configuration through options
- ✅ **Extensible**: Easy to add new middleware patterns
- ✅ **Pipeline Support**: Create middleware pipelines
- ✅ **Registry System**: Register and reuse middleware configurations
- ✅ **Error Handling**: Consistent error handling patterns
- ✅ **Logging**: Built-in logging support for debugging

## Quick Start

### Basic Usage

```typescript
import {
  createMiddleware,
  InputExtractors,
  ErrorHandlers,
} from "@/factories/middleware-factory";

// Create a simple validation middleware
const validateBodyMiddleware = createMiddleware({
  name: "Body Validation",
  inputExtractor: InputExtractors.body,
  validator: async (body) => {
    return body && typeof body === "object";
  },
  processor: async (body) => {
    // Process the validated body
    return { validatedBody: body };
  },
  errorHandler: ErrorHandlers.validation,
});
```

### Authentication Middleware

```typescript
import {
  createAccessTokenMiddleware,
  createRefreshTokenMiddleware,
  createCustomAuthMiddleware,
} from "@/factories/auth-middleware-factory";

// Standard access token middleware
const authMiddleware = createAccessTokenMiddleware();

// Custom authentication middleware
const customAuthMiddleware = createCustomAuthMiddleware("API Key Auth", {
  inputExtractor: async (context) => ({
    token: context.req.headers["x-api-key"],
    source: "header" as const,
  }),
  processor: async (input) => {
    // Custom API key validation logic
    const user = await validateApiKey(input.token);
    return { user };
  },
});
```

## Generic Middleware Factory

### Configuration Interface

```typescript
interface MiddlewareConfig<TInput, TOutput> {
  name: string; // Middleware name for debugging
  inputExtractor: InputExtractorFunction; // Extract input from request
  validator?: ValidatorFunction; // Validate extracted input
  processor: ProcessorFunction; // Process validated input
  successHandler?: SuccessHandlerFunction; // Handle successful results
  errorHandler?: ErrorHandlerFunction; // Handle errors
  skipOnValidationFailure?: boolean; // Skip processing on validation failure
  continueOnSuccess?: boolean; // Continue to next middleware
  validationErrorType?: ErrorType; // Error type for validation failures
  validationErrorMessage?: string; // Error message for validation failures
}
```

### Creating Custom Middleware

```typescript
import { createMiddleware, ErrorType } from "@/factories/middleware-factory";

const customMiddleware = createMiddleware({
  name: "Custom Logic Middleware",

  // Extract input from request
  inputExtractor: async (context) => {
    return {
      userId: context.req.params.id,
      action: context.req.body.action,
    };
  },

  // Validate the input
  validator: async (input) => {
    return input.userId && input.action;
  },

  // Process the validated input
  processor: async (input, context) => {
    // Your custom logic here
    const result = await processUserAction(input.userId, input.action);
    return result;
  },

  // Handle successful processing
  successHandler: async (result, context) => {
    // Add result to request for downstream middleware
    context.req.processedResult = result;
  },

  // Handle errors
  errorHandler: (error) => {
    return createError(ErrorType.INTERNAL_SERVER_ERROR, error.message);
  },

  validationErrorType: ErrorType.INVALID_INPUT,
  validationErrorMessage: "Invalid user action data",
});
```

### Registry System

```typescript
import {
  registerMiddleware,
  getMiddlewareFactory,
} from "@/factories/middleware-factory";

// Register middleware for reuse
registerMiddleware("userValidation", {
  name: "User Validation",
  inputExtractor: async (context) => context.req.params.userId,
  validator: async (userId) => !!userId,
  processor: async (userId) => {
    const user = await getUserById(userId);
    if (!user) throw new Error("User not found");
    return user;
  },
});

// Use registered middleware
const factory = getMiddlewareFactory();
const userMiddleware = factory.createFromRegistry("userValidation");
```

### Pipeline Creation

```typescript
import { getMiddlewareFactory } from "@/factories/middleware-factory";

const factory = getMiddlewareFactory();

// Create a pipeline of middleware
const pipeline = factory.createPipeline([
  "userValidation", // From registry
  "accessToken", // From registry
  customLogicConfig, // Direct configuration
]);

// Use in routes
router.get("/users/:id", ...pipeline, controller);
```

## Authentication Factory

### Standard Authentication Middleware

```typescript
import {
  createAccessTokenMiddleware,
  createRefreshTokenMiddleware,
  createVerificationTokenMiddleware,
} from "@/factories/auth-middleware-factory";

// Basic usage
const accessAuth = createAccessTokenMiddleware();
const refreshAuth = createRefreshTokenMiddleware();
const verifyAuth = createVerificationTokenMiddleware();

// With options
const debugAuth = createAccessTokenMiddleware({
  enableLogging: true,
  extractToBody: true,
});
```

### Custom Authentication Patterns

```typescript
import { createCustomAuthMiddleware } from "@/factories/auth-middleware-factory";

// Bearer token authentication
const bearerAuth = createCustomAuthMiddleware("Bearer Auth", {
  inputExtractor: async (context) => ({
    token: extractBearerToken(context.req.headers.authorization),
    source: "header" as const,
  }),
  validator: async (input) => !!input.token,
  processor: async (input) => {
    const payload = verifyBearerToken(input.token);
    return { user: payload };
  },
});

// Session-based authentication
const sessionAuth = createCustomAuthMiddleware("Session Auth", {
  inputExtractor: async (context) => ({
    token: context.req.session?.id,
    source: "session" as const,
  }),
  processor: async (input) => {
    const user = await getUserBySessionId(input.token);
    return { user };
  },
});
```

### Authentication Pipeline

```typescript
import { createAuthPipeline } from "@/factories/auth-middleware-factory";

// Create pipeline with multiple auth types
const authPipeline = createAuthPipeline(["access", "refresh"], {
  enableLogging: true,
});

// Use in routes requiring flexible authentication
router.get("/profile", ...authPipeline, profileController);
```

## Common Patterns

### Validation Middleware

```typescript
const createValidationMiddleware = (schema: any) => {
  return createMiddleware({
    name: "Schema Validation",
    inputExtractor: InputExtractors.body,
    validator: async (body) => {
      const result = schema.safeParse(body);
      return result.success;
    },
    processor: async (body) => {
      return schema.parse(body);
    },
    successHandler: async (result, context) => {
      context.req.validatedBody = result;
    },
    errorHandler: ErrorHandlers.validation,
  });
};
```

### Rate Limiting Middleware

```typescript
const createRateLimitMiddleware = (options: RateLimitOptions) => {
  return createMiddleware({
    name: "Rate Limiting",
    inputExtractor: async (context) => ({
      ip: context.req.ip,
      key: context.req.user?.id || context.req.ip,
    }),
    validator: async (input) => {
      return !isRateLimited(input.key, options);
    },
    processor: async (input) => {
      incrementRateLimit(input.key, options);
      return { allowed: true };
    },
    errorHandler: (error) => createRateLimitError(options.retryAfter),
    validationErrorType: ErrorType.RATE_LIMIT_EXCEEDED,
  });
};
```

### Database Transaction Middleware

```typescript
const createTransactionMiddleware = () => {
  return createMiddleware({
    name: "Database Transaction",
    inputExtractor: async () => ({}),
    processor: async (_, context) => {
      const transaction = await db.beginTransaction();
      context.req.transaction = transaction;
      return { transaction };
    },
    errorHandler: ErrorHandlers.database,
  });
};
```

## Advanced Features

### Custom Input Extractors

```typescript
import { InputExtractors } from "@/factories/middleware-factory";

// Combine multiple extractors
const combinedExtractor = InputExtractors.combined(
  InputExtractors.body,
  InputExtractors.params,
  InputExtractors.query
);

// Custom extractor
const customExtractor = async (context) => {
  return {
    user: context.req.user,
    timestamp: Date.now(),
    path: context.req.path,
  };
};
```

### Conditional Processing

```typescript
const conditionalMiddleware = createMiddleware({
  name: "Conditional Processing",
  inputExtractor: InputExtractors.fullRequest,
  validator: async (req) => {
    // Only process for POST requests
    return req.method === "POST";
  },
  processor: async (req) => {
    // Process only when validation passes
    return await processPostRequest(req);
  },
  skipOnValidationFailure: true, // Skip processing for non-POST requests
});
```

### Error Recovery

```typescript
const resilientMiddleware = createMiddleware({
  name: "Resilient Processing",
  inputExtractor: InputExtractors.body,
  processor: async (body) => {
    try {
      return await primaryProcessor(body);
    } catch (error) {
      // Fallback processing
      return await fallbackProcessor(body);
    }
  },
  errorHandler: (error, context) => {
    // Log error but don't fail the request
    console.error("Processing failed:", error);
    return createError(ErrorType.INTERNAL_SERVER_ERROR, "Processing failed");
  },
});
```

## Best Practices

1. **Use Descriptive Names**: Give meaningful names to middleware for better debugging
2. **Keep Processors Focused**: Each processor should have a single responsibility
3. **Handle Errors Gracefully**: Provide appropriate error handlers for different scenarios
4. **Use Registry for Reuse**: Register commonly used middleware configurations
5. **Enable Logging in Development**: Use logging options for debugging
6. **Validate Early**: Perform validation before expensive processing
7. **Type Your Inputs/Outputs**: Use TypeScript generics for better type safety
8. **Document Custom Middleware**: Provide clear documentation for custom patterns

## Migration from Old System

### Before (Old Factory)

```typescript
import { createAccessTokenMiddleware } from "@/middlewares/auth/middleware-factory";
const middleware = createAccessTokenMiddleware();
```

### After (New Factory)

```typescript
import { createAccessTokenMiddleware } from "@/factories/auth-middleware-factory";
const middleware = createAccessTokenMiddleware();
```

The API remains the same for authentication middleware, but now with more flexibility and extensibility.

## Troubleshooting

### Common Issues

1. **Middleware Not Executing**: Check if `continueOnSuccess` is set correctly
2. **Validation Always Failing**: Ensure validator function returns boolean
3. **Type Errors**: Use proper TypeScript generics for input/output types
4. **Registry Not Found**: Ensure middleware is registered before use

### Debugging

```typescript
// Enable logging for debugging
const debugMiddleware = createAccessTokenMiddleware({
  enableLogging: true,
});

// Check registered middleware
const factory = getMiddlewareFactory();
console.log("Registered middleware:", factory.getRegisteredNames());
```
