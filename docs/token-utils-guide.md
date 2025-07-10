# Token Utilities Guide

This guide explains how to use the enhanced generic token utilities system for flexible token extraction, validation, and processing across different token types and sources.

## Overview

The token utilities system provides a comprehensive, configurable approach to handling tokens throughout the application. It supports multiple token sources, formats, and validation strategies following the Strategy Pattern and Factory Pattern.

## Architecture

### Core Components

1. **TokenUtils Class** (`src/utils/token-utils.ts`)

   - Main utility class with static methods
   - Registry system for extractors, validators, and decoders
   - Extensible through custom handlers

2. **Token Sources** - Where tokens can be extracted from:

   - Headers (Authorization, custom headers)
   - Cookies
   - Request body
   - Query parameters
   - Custom extractors

3. **Token Formats** - Supported token types:
   - JWT (JSON Web Tokens)
   - Bearer tokens
   - Basic authentication
   - API keys
   - Custom formats

## Features

- ✅ **Multiple Sources**: Extract tokens from headers, cookies, body, query params
- ✅ **Format Validation**: Validate JWT, Bearer, Basic, API key formats
- ✅ **Safe Decoding**: Decode tokens without verification for metadata
- ✅ **Extensible**: Register custom extractors, validators, and decoders
- ✅ **Type Safety**: Full TypeScript support with generics
- ✅ **Backward Compatible**: Legacy functions maintain existing API
- ✅ **Pre-configured**: Common token configurations ready to use

## Quick Start

### Basic Usage

```typescript
import { TokenUtils, TokenSource, TokenFormat } from "@/utils/token-utils";

// Extract Bearer token from Authorization header
const token = TokenUtils.extractToken(req, {
  source: TokenSource.HEADER,
  format: TokenFormat.BEARER,
});

// Validate JWT format
const validation = TokenUtils.validateToken(token, TokenFormat.JWT);
if (validation.isValid) {
  console.log("Valid JWT token");
}

// Decode JWT without verification
const decoded = TokenUtils.decodeToken(token, TokenFormat.JWT);
console.log("Payload:", decoded?.payload);
```

### Using Pre-configured Settings

```typescript
import { TokenUtils, TokenConfigs } from "@/utils/token-utils";

// Use pre-configured Bearer token extraction
const token = TokenUtils.extractToken(req, TokenConfigs.BEARER_HEADER);

// Extract refresh token from cookies
const refreshToken = TokenUtils.extractToken(req, TokenConfigs.REFRESH_COOKIE);

// Extract API key from header
const apiKey = TokenUtils.extractToken(req, TokenConfigs.API_KEY_HEADER);
```

### Legacy Compatibility

```typescript
// These functions maintain backward compatibility
import {
  extractTokenFromHeader,
  isValidTokenFormat,
  decodeTokenWithoutVerification,
  extractRefreshToken,
  extractVerificationToken,
} from "@/utils/token-utils";

const token = extractTokenFromHeader(req.headers.authorization);
const isValid = isValidTokenFormat(token);
const payload = decodeTokenWithoutVerification(token);
```

## Advanced Usage

### Custom Token Extraction

```typescript
import { TokenUtils, TokenSource } from "@/utils/token-utils";

// Custom header extraction
const customToken = TokenUtils.extractToken(req, {
  source: TokenSource.HEADER,
  headerName: "x-custom-token",
  prefix: "Custom",
  caseSensitive: true,
});

// Custom cookie extraction
const sessionToken = TokenUtils.extractToken(req, {
  source: TokenSource.COOKIE,
  cookieName: "session_id",
});

// Custom body field extraction
const verificationCode = TokenUtils.extractToken(req, {
  source: TokenSource.BODY,
  bodyField: "verification_code",
});

// Custom query parameter extraction
const accessKey = TokenUtils.extractToken(req, {
  source: TokenSource.QUERY,
  queryParam: "access_key",
});
```

### Custom Extractors

```typescript
// Register custom extractor
TokenUtils.registerExtractor(TokenSource.CUSTOM, (input, config) => {
  // Custom extraction logic
  return input.customField?.token || null;
});

// Use custom extractor
const token = TokenUtils.extractToken(data, {
  source: TokenSource.CUSTOM,
  customExtractor: (input) => input.metadata?.authToken,
});
```

### Custom Validators

```typescript
import { TokenFormat, TokenValidationResult } from "@/utils/token-utils";

// Register custom validator
TokenUtils.registerValidator(
  TokenFormat.CUSTOM,
  (token: string): TokenValidationResult => {
    const isValid = token.startsWith("custom_") && token.length >= 20;
    return {
      isValid,
      error: isValid
        ? undefined
        : "Custom token must start with 'custom_' and be at least 20 characters",
      metadata: { length: token.length },
    };
  }
);

// Use custom validator
const validation = TokenUtils.validateToken(token, TokenFormat.CUSTOM);
```

### Custom Decoders

```typescript
// Register custom decoder
TokenUtils.registerDecoder(TokenFormat.CUSTOM, (token: string) => {
  try {
    const parts = token.split("_");
    return {
      header: { type: "custom" },
      payload: { id: parts[1], data: parts[2] },
      signature: parts[3],
      raw: token,
    };
  } catch {
    return null;
  }
});

// Use custom decoder
const decoded = TokenUtils.decodeToken(token, TokenFormat.CUSTOM);
```

## Token Sources

### Header Extraction

```typescript
// Standard Authorization header
const config = {
  source: TokenSource.HEADER,
  headerName: "authorization", // Default
  prefix: "bearer", // Default
  caseSensitive: false, // Default
};

// Custom header
const customConfig = {
  source: TokenSource.HEADER,
  headerName: "x-api-token",
  prefix: "Token",
};
```

### Cookie Extraction

```typescript
const config = {
  source: TokenSource.COOKIE,
  cookieName: "auth_token",
};
```

### Body Extraction

```typescript
const config = {
  source: TokenSource.BODY,
  bodyField: "access_token",
};
```

### Query Parameter Extraction

```typescript
const config = {
  source: TokenSource.QUERY,
  queryParam: "token",
};
```

## Token Formats

### JWT Validation

```typescript
const validation = TokenUtils.validateToken(token, TokenFormat.JWT);
// Checks for 3 parts separated by dots with valid base64url encoding
```

### Bearer Token Validation

```typescript
const validation = TokenUtils.validateToken(token, TokenFormat.BEARER);
// Typically validates as JWT format
```

### Basic Authentication Validation

```typescript
const validation = TokenUtils.validateToken(token, TokenFormat.BASIC);
// Validates base64 encoding and username:password format
```

### API Key Validation

```typescript
const validation = TokenUtils.validateToken(token, TokenFormat.API_KEY);
// Validates length (16-512 characters)
```

## Token Decoding

### JWT Decoding

```typescript
const decoded = TokenUtils.decodeToken<UserPayload>(token, TokenFormat.JWT);

if (decoded) {
  console.log("Header:", decoded.header);
  console.log("Payload:", decoded.payload);
  console.log("Is Expired:", decoded.isExpired);
  console.log("Expires At:", decoded.expiresAt);
  console.log("Issued At:", decoded.issuedAt);
}
```

### Type-safe Decoding

```typescript
interface CustomPayload {
  userId: string;
  permissions: string[];
  sessionId: string;
}

const decoded = TokenUtils.decodeToken<CustomPayload>(token, TokenFormat.JWT);
// decoded.payload is now typed as CustomPayload
```

## Pre-configured Configurations

```typescript
import { TokenConfigs } from "@/utils/token-utils";

// Available configurations:
TokenConfigs.BEARER_HEADER; // Bearer token from Authorization header
TokenConfigs.REFRESH_COOKIE; // Refresh token from cookie
TokenConfigs.VERIFICATION_BODY; // Verification token from body
TokenConfigs.API_KEY_HEADER; // API key from x-api-key header
TokenConfigs.SESSION_QUERY; // Session token from query parameter
```

## Error Handling

### Validation Errors

```typescript
const validation = TokenUtils.validateToken(token, TokenFormat.JWT);

if (!validation.isValid) {
  console.error("Validation failed:", validation.error);
  console.log("Metadata:", validation.metadata);
}
```

### Extraction Errors

```typescript
try {
  const token = TokenUtils.extractToken(req, config);
  if (!token) {
    console.log("No token found with the given configuration");
  }
} catch (error) {
  console.error("Extraction failed:", error.message);
}
```

### Decoding Errors

```typescript
const decoded = TokenUtils.decodeToken(token, TokenFormat.JWT);
if (!decoded) {
  console.log("Token could not be decoded safely");
}
```

## Best Practices

1. **Use Pre-configured Settings**: Start with `TokenConfigs` for common patterns
2. **Validate Before Decoding**: Always validate token format before attempting to decode
3. **Handle Null Results**: Always check for null results from extraction and decoding
4. **Type Your Payloads**: Use TypeScript generics for type-safe token payloads
5. **Register Custom Handlers**: Extend functionality through custom extractors/validators
6. **Cache Validation Results**: For performance-critical applications, consider caching validation results
7. **Sanitize Inputs**: Always validate and sanitize token inputs before processing

## Migration from Old System

### Before (Old Token Utils)

```typescript
import {
  extractTokenFromHeader,
  isValidTokenFormat,
} from "@/middlewares/auth/token-utils";

const token = extractTokenFromHeader(req.headers.authorization);
const isValid = isValidTokenFormat(token);
```

### After (New Token Utils)

```typescript
// Option 1: Use legacy compatibility functions (no changes needed)
import {
  extractTokenFromHeader,
  isValidTokenFormat,
} from "@/utils/token-utils";

const token = extractTokenFromHeader(req.headers.authorization);
const isValid = isValidTokenFormat(token);

// Option 2: Use new enhanced API
import { TokenUtils, TokenConfigs } from "@/utils/token-utils";

const token = TokenUtils.extractToken(req, TokenConfigs.BEARER_HEADER);
const validation = TokenUtils.validateToken(token);
const isValid = validation.isValid;
```

## Examples

### Authentication Middleware

```typescript
import { TokenUtils, TokenFormat, TokenConfigs } from "@/utils/token-utils";

const authMiddleware = (req, res, next) => {
  // Extract token
  const token = TokenUtils.extractToken(req, TokenConfigs.BEARER_HEADER);

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Validate format
  const validation = TokenUtils.validateToken(token, TokenFormat.JWT);
  if (!validation.isValid) {
    return res.status(401).json({ error: validation.error });
  }

  // Decode for user info
  const decoded = TokenUtils.decodeToken(token, TokenFormat.JWT);
  if (!decoded || decoded.isExpired) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }

  req.user = decoded.payload;
  next();
};
```

### API Key Validation

```typescript
import { TokenUtils, TokenFormat, TokenConfigs } from "@/utils/token-utils";

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = TokenUtils.extractToken(req, TokenConfigs.API_KEY_HEADER);

  if (!apiKey) {
    return res.status(401).json({ error: "API key required" });
  }

  const validation = TokenUtils.validateToken(apiKey, TokenFormat.API_KEY);
  if (!validation.isValid) {
    return res.status(401).json({ error: validation.error });
  }

  // Validate against database
  if (!isValidApiKey(apiKey)) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
};
```

### Multi-source Token Strategy

```typescript
import { TokenUtils, TokenSource } from "@/utils/token-utils";

const flexibleTokenExtraction = (req) => {
  // Try multiple sources in order of preference
  const sources = [
    TokenConfigs.BEARER_HEADER,
    TokenConfigs.API_KEY_HEADER,
    TokenConfigs.SESSION_QUERY,
  ];

  for (const config of sources) {
    const token = TokenUtils.extractToken(req, config);
    if (token) {
      return { token, source: config.source };
    }
  }

  return null;
};
```

## Troubleshooting

### Common Issues

1. **Token Not Found**: Check source configuration and input structure
2. **Validation Fails**: Verify token format matches expected format type
3. **Decoding Returns Null**: Ensure token is properly formatted before decoding
4. **Custom Extractor Not Working**: Verify extractor is registered and config is correct

### Debugging

```typescript
// Enable detailed validation information
const validation = TokenUtils.validateToken(token, TokenFormat.JWT);
console.log("Validation result:", validation);
console.log("Metadata:", validation.metadata);

// Check available extractors/validators
console.log("Registered extractors:", Object.keys(TokenUtils["extractors"]));
console.log("Registered validators:", Object.keys(TokenUtils["validators"]));
```
