# Global Error Handling Guide

This guide explains how to use the new centralized error handling utility (`src/utilities/error-handler.ts`) across the entire application.

## Overview

The global error handler provides consistent error handling for all types of errors across the application, replacing the previous auth-specific error handling approach.

## Features

- ✅ **Standardized Error Format**: Consistent structure across all endpoints
- ✅ **Multi-Category Support**: Authentication, validation, database, rate limiting, etc.
- ✅ **Retry Logic**: Built-in support for retryable operations
- ✅ **Type Safety**: Full TypeScript support with proper interfaces
- ✅ **Extensible Design**: Easy to add new error types and categories
- ✅ **Legacy Compatibility**: Backward compatible with existing auth code

## Quick Start

### Basic Usage

```typescript
import {
  createError,
  sendErrorResponse,
  ErrorType,
} from "@/utilities/error-handler";

// In controllers
export const getUser = async (req: Request, res: JsonResponse) => {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      const error = createError(ErrorType.RESOURCE_NOT_FOUND, "User not found");
      return sendErrorResponse(res, error);
    }

    return res.success("User found", user);
  } catch (error: any) {
    const appError = createInternalError(error);
    return sendErrorResponse(res, appError);
  }
};
```

### Error Categories and Types

#### Authentication Errors

```typescript
import { createError, ErrorType } from "@/utilities/error-handler";

// Token missing
createError(ErrorType.NO_TOKEN);

// Invalid token
createError(ErrorType.INVALID_TOKEN, "Token signature is invalid");

// Expired token (retryable)
createError(ErrorType.EXPIRED_TOKEN);
```

#### Validation Errors

```typescript
import { parseValidationError } from "@/utilities/error-handler";

// From express-validator results
const errors = validationResult(req);
if (!errors.isEmpty()) {
  const validationError = parseValidationError(errors.array());
  return sendErrorResponse(res, validationError);
}
```

#### Database Errors

```typescript
import { parseDatabaseError } from "@/utilities/error-handler";

try {
  const user = await User.query().insert(userData);
} catch (error: any) {
  const dbError = parseDatabaseError(error);
  return sendErrorResponse(res, dbError);
}
```

#### Rate Limiting Errors

```typescript
import { createRateLimitError } from "@/utilities/error-handler";

// Rate limit with retry information
const rateLimitError = createRateLimitError(60, "Too many login attempts");
return sendErrorResponse(res, rateLimitError);
```

#### Not Found Errors

```typescript
import { createNotFoundError } from "@/utilities/error-handler";

// Generic not found
const error = createNotFoundError("Event", req.params.slug);
return sendErrorResponse(res, error);
```

## Error Response Format

All errors follow this standardized format:

```json
{
  "statusCode": 404,
  "message": "Event with identifier 'non-existent-slug' not found",
  "error": {
    "category": "NOT_FOUND",
    "type": "RESOURCE_NOT_FOUND",
    "code": "NOT_FOUND_RESOURCE_NOT_FOUND"
  }
}
```

For retryable errors:

```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "retryAfter": 60,
  "error": {
    "category": "RATE_LIMIT",
    "type": "RATE_LIMIT_EXCEEDED",
    "code": "RATE_LIMIT_RATE_LIMIT_EXCEEDED",
    "retryable": true
  }
}
```

## Migration Guide

### From Auth-Specific Error Handling

**Before:**

```typescript
import {
  createAuthError,
  AuthErrorType,
} from "@/middlewares/auth/error-handler";

const error = createAuthError(AuthErrorType.NO_TOKEN);
```

**After:**

```typescript
import { createError, ErrorType } from "@/utilities/error-handler";

const error = createError(ErrorType.NO_TOKEN);
```

### From Manual Error Responses

**Before:**

```typescript
return res.status(404).json({
  statusCode: 404,
  message: "User not found",
});
```

**After:**

```typescript
import {
  createNotFoundError,
  sendErrorResponse,
} from "@/utilities/error-handler";

const error = createNotFoundError("User", req.params.id);
return sendErrorResponse(res, error);
```

### From Generic res.error()

**Before:**

```typescript
return res.error(400, "Invalid input");
```

**After:**

```typescript
import {
  createError,
  ErrorType,
  sendErrorResponse,
} from "@/utilities/error-handler";

const error = createError(ErrorType.INVALID_INPUT, "Invalid input");
return sendErrorResponse(res, error);
```

## Advanced Usage

### Custom Error Types

To add new error types, extend the `ErrorType` enum and `ERROR_CONFIG` mapping:

```typescript
// In src/utilities/error-handler.ts
export enum ErrorType {
  // ... existing types
  CUSTOM_BUSINESS_ERROR = "CUSTOM_BUSINESS_ERROR",
}

const ERROR_CONFIG: Record<ErrorType, { ... }> = {
  // ... existing config
  [ErrorType.CUSTOM_BUSINESS_ERROR]: {
    category: ErrorCategory.BAD_REQUEST,
    statusCode: 422,
    defaultMessage: "Business logic validation failed",
  },
};
```

### Domain-Specific Parsers

Create specialized error parsers for specific domains:

```typescript
import { createError, ErrorType, AppError } from "@/utilities/error-handler";

export const parsePaymentError = (error: any): AppError => {
  if (error.code === "card_declined") {
    return createError(ErrorType.INVALID_INPUT, "Payment method declined");
  }

  if (error.code === "insufficient_funds") {
    return createError(ErrorType.INVALID_INPUT, "Insufficient funds");
  }

  return createError(
    ErrorType.EXTERNAL_API_FAILED,
    "Payment processing failed"
  );
};
```

### Middleware Error Handling

```typescript
import {
  createInternalError,
  sendErrorResponse,
} from "@/utilities/error-handler";

export const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: JsonResponse,
  next: NextFunction
) => {
  // Log the error
  logger.error("Unhandled error:", err);

  // Send standardized error response
  const error = createInternalError(err, "An unexpected error occurred");
  return sendErrorResponse(res, error);
};
```

## Best Practices

1. **Use Specific Error Types**: Choose the most specific error type for better client handling
2. **Provide Context**: Include relevant details in error messages
3. **Handle Retryable Errors**: Mark operations as retryable when appropriate
4. **Log Before Responding**: Always log errors before sending responses
5. **Validate Input Early**: Use validation parsers for input validation errors
6. **Consistent Language**: Use clear, user-friendly error messages

## Error Categories Reference

| Category           | Use Case                           | HTTP Status Range |
| ------------------ | ---------------------------------- | ----------------- |
| `AUTHENTICATION`   | Token issues, login failures       | 401               |
| `AUTHORIZATION`    | Permission denied, access control  | 403               |
| `VALIDATION`       | Input validation, format errors    | 400               |
| `NOT_FOUND`        | Resource lookup failures           | 404               |
| `CONFLICT`         | Duplicate resources, constraints   | 409               |
| `RATE_LIMIT`       | Request throttling, attempt limits | 429               |
| `DATABASE`         | Connection, query failures         | 500, 503          |
| `EXTERNAL_SERVICE` | API failures, service unavailable  | 502, 503          |
| `INTERNAL_SERVER`  | Configuration, unexpected errors   | 500               |

## Legacy Compatibility

The old auth error handling is still supported but deprecated:

```typescript
// Still works (deprecated)
import {
  createAuthError,
  AuthErrorType,
} from "@/middlewares/auth/error-handler";

// Preferred approach
import { createError, ErrorType } from "@/utilities/error-handler";
```

All existing auth middleware continues to work without changes.
