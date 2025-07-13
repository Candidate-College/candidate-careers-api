/**
 * Activity Metadata Tests
 *
 * Comprehensive test suite for the ActivityMetadataUtils utility class
 * including metadata collection, enrichment, and sanitization.
 */

import {
  ActivityMetadataUtils,
  ActivityMetadata,
} from "../../../src/services/audit/activity-metadata";
import { ActivityLogParams } from "../../../src/services/audit/activity-log-service";
import { ActivityCategorization } from "../../../src/services/audit/activity-categorization";
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
} from "../../../src/constants/activity-log-constants";

// Mock the categorization module
jest.mock("../../../src/services/audit/activity-categorization");

const mockActivityCategorization = ActivityCategorization as jest.Mocked<
  typeof ActivityCategorization
>;

describe("ActivityMetadataUtils", () => {
  const baseParams: ActivityLogParams = {
    action: "user_created",
    resourceType: "user",
    description: "User created successfully",
    userId: 1,
    sessionId: "session123",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ipAddress: "192.168.1.1",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock categorization returns
    mockActivityCategorization.getCategorization.mockReturnValue({
      category: ActivityCategory.USER_MANAGEMENT,
      severity: ActivitySeverity.MEDIUM,
      status: ActivityStatus.SUCCESS,
    });

    mockActivityCategorization.isValidAction.mockReturnValue(true);
  });

  describe("collectMetadata", () => {
    it("should add metadata to params without existing metadata", () => {
      const params = { ...baseParams };
      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.categorization).toBeDefined();
      expect(result.metadata.actionInfo).toBeDefined();
      expect(result.metadata.systemInfo).toBeDefined();
      expect(result.metadata.requestInfo).toBeDefined();
    });

    it("should preserve existing metadata while adding automatic metadata", () => {
      const params = {
        ...baseParams,
        metadata: { custom: "existing", priority: "high" },
      };

      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(result.metadata.custom).toBe("existing");
      expect(result.metadata.priority).toBe("high");
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.categorization).toBeDefined();
    });

    it("should prioritize user-provided metadata over automatic metadata", () => {
      const params = {
        ...baseParams,
        metadata: { timestamp: "custom-timestamp", custom: "data" },
      };

      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(result.metadata.timestamp).toBe("custom-timestamp");
      expect(result.metadata.custom).toBe("data");
    });

    it("should include request info when available", () => {
      const params = {
        ...baseParams,
        userAgent: "Custom User Agent",
        ipAddress: "10.0.0.1",
        sessionId: "session456",
      };

      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(result.metadata.requestInfo).toEqual({
        userAgent: "Custom User Agent",
        ipAddress: "10.0.0.1",
        sessionId: "session456",
      });
    });

    it("should not include request info when not available", () => {
      const params = {
        action: "system_event",
        resourceType: "system",
        description: "System started",
      };

      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(result.metadata.requestInfo).toBeUndefined();
    });

    it("should call categorization service", () => {
      const params = { ...baseParams };
      ActivityMetadataUtils.collectMetadata(params);

      expect(mockActivityCategorization.getCategorization).toHaveBeenCalledWith(
        "user_created"
      );
      expect(mockActivityCategorization.isValidAction).toHaveBeenCalledWith(
        "user_created"
      );
    });
  });

  describe("enrichMetadata", () => {
    it("should add context to existing metadata", () => {
      const metadata = { existing: "data" };
      const context = { requestId: "req123", userId: 456 };

      const result = ActivityMetadataUtils.enrichMetadata(metadata, context);

      expect(result.existing).toBe("data");
      expect(result.context).toEqual(context);
    });

    it("should create metadata object if none exists", () => {
      const context = { requestId: "req123" };

      const result = ActivityMetadataUtils.enrichMetadata(null, context);

      expect(result.context).toEqual(context);
    });

    it("should merge context with existing context", () => {
      const metadata = { context: { existing: "data" } };
      const context = { requestId: "req123", userId: 456 };

      const result = ActivityMetadataUtils.enrichMetadata(metadata, context);

      expect(result.context).toEqual({
        existing: "data",
        requestId: "req123",
        userId: 456,
      });
    });

    it("should handle null context", () => {
      const metadata = { existing: "data" };

      const result = ActivityMetadataUtils.enrichMetadata(
        metadata,
        null as any
      );

      expect(result.existing).toBe("data");
      expect(result.context).toBeUndefined();
    });
  });

  describe("sanitizeMetadata", () => {
    it("should remove sensitive fields", () => {
      const metadata = {
        password: "secret123",
        token: "abc123",
        api_key: "key123",
        secret: "secret",
        normal_field: "safe",
        nested: {
          password: "nested_secret",
          safe_field: "safe_value",
        },
      };

      const result = ActivityMetadataUtils.sanitizeMetadata(metadata);

      expect(result.password).toBe("[REDACTED]");
      expect(result.token).toBe("[REDACTED]");
      expect(result.api_key).toBe("[REDACTED]");
      expect(result.secret).toBe("[REDACTED]");
      expect(result.normal_field).toBe("safe");
      expect(result.nested.password).toBe("[REDACTED]");
      expect(result.nested.safe_field).toBe("safe_value");
    });

    it("should handle nested objects recursively", () => {
      const metadata = {
        level1: {
          level2: {
            level3: {
              password: "deep_secret",
              safe: "safe_value",
            },
          },
        },
      };

      const result = ActivityMetadataUtils.sanitizeMetadata(metadata);

      expect(result.level1.level2.level3.password).toBe("[REDACTED]");
      expect(result.level1.level2.level3.safe).toBe("safe_value");
    });

    it("should handle arrays properly", () => {
      const metadata = {
        array: [
          { password: "secret1" },
          { password: "secret2" },
          { safe: "value" },
        ],
      };

      const result = ActivityMetadataUtils.sanitizeMetadata(metadata);

      expect(result.array[0].password).toBe("[REDACTED]");
      expect(result.array[1].password).toBe("[REDACTED]");
      expect(result.array[2].safe).toBe("value");
    });

    it("should return empty object for null/undefined", () => {
      expect(ActivityMetadataUtils.sanitizeMetadata(null)).toEqual({});
      expect(ActivityMetadataUtils.sanitizeMetadata(undefined)).toEqual({});
    });

    it("should not modify original object", () => {
      const metadata = { password: "secret", safe: "value" };

      ActivityMetadataUtils.sanitizeMetadata(metadata);

      expect(metadata.password).toBe("secret"); // Original should be unchanged
      expect(metadata.safe).toBe("value");
    });
  });

  describe("validateMetadata", () => {
    it("should return valid for null/undefined", () => {
      expect(ActivityMetadataUtils.validateMetadata(null)).toEqual({
        isValid: true,
      });
      expect(ActivityMetadataUtils.validateMetadata(undefined)).toEqual({
        isValid: true,
      });
    });

    it("should return valid for normal objects", () => {
      const metadata = { key: "value", number: 123, array: [1, 2, 3] };
      const result = ActivityMetadataUtils.validateMetadata(metadata);

      expect(result).toEqual({ isValid: true });
    });

    it("should return invalid for circular references", () => {
      const metadata: any = { key: "value" };
      metadata.self = metadata;

      const result = ActivityMetadataUtils.validateMetadata(metadata);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid metadata structure");
    });

    it("should return invalid for objects exceeding size limit", () => {
      const largeData = "x".repeat(1024 * 1024 + 1); // 1MB + 1 byte
      const metadata = { large: largeData };

      const result = ActivityMetadataUtils.validateMetadata(metadata);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Metadata exceeds 1MB size limit");
    });

    it("should handle edge case at size limit", () => {
      // Create object just under the limit
      const data = "x".repeat(1024 * 1024 - 100); // Slightly under 1MB
      const metadata = { data };

      const result = ActivityMetadataUtils.validateMetadata(metadata);

      expect(result.isValid).toBe(true);
    });
  });

  describe("mergeMetadata", () => {
    it("should merge two objects", () => {
      const base = { a: 1, b: 2 };
      const additional = { c: 3, d: 4 };

      const result = ActivityMetadataUtils.mergeMetadata(base, additional);

      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it("should handle deep merging", () => {
      const base = { nested: { a: 1, b: 2 } };
      const additional = { nested: { c: 3, d: 4 } };

      const result = ActivityMetadataUtils.mergeMetadata(base, additional);

      expect(result).toEqual({
        nested: { a: 1, b: 2, c: 3, d: 4 },
      });
    });

    it("should override values from base with additional", () => {
      const base = { a: 1, b: 2 };
      const additional = { b: 3, c: 4 };

      const result = ActivityMetadataUtils.mergeMetadata(base, additional);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("should handle null base", () => {
      const additional = { a: 1, b: 2 };

      const result = ActivityMetadataUtils.mergeMetadata(null, additional);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should handle null additional", () => {
      const base = { a: 1, b: 2 };

      const result = ActivityMetadataUtils.mergeMetadata(base, null);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should handle arrays correctly", () => {
      const base = { array: [1, 2] };
      const additional = { array: [3, 4] };

      const result = ActivityMetadataUtils.mergeMetadata(base, additional);

      expect(result.array).toEqual([3, 4]); // Should replace, not merge arrays
    });
  });

  describe("extractRequestMetadata", () => {
    it("should extract basic request information", () => {
      const request = {
        method: "POST",
        url: "/api/users",
        headers: {
          "user-agent": "Mozilla/5.0",
          "content-type": "application/json",
          "accept-language": "en-US",
        },
        ip: "192.168.1.1",
        params: { id: "123" },
        query: { page: "1" },
      };

      const result = ActivityMetadataUtils.extractRequestMetadata(request);

      expect(result).toEqual({
        method: "POST",
        url: "/api/users",
        headers: {
          userAgent: "Mozilla/5.0",
          contentType: "application/json",
          acceptLanguage: "en-US",
        },
        ip: "192.168.1.1",
        params: { id: "123" },
        query: { page: "1" },
      });
    });

    it("should handle missing request properties", () => {
      const request = {
        method: "GET",
        url: "/api/test",
      };

      const result = ActivityMetadataUtils.extractRequestMetadata(request);

      expect(result).toEqual({
        method: "GET",
        url: "/api/test",
      });
    });

    it("should return empty object for null request", () => {
      const result = ActivityMetadataUtils.extractRequestMetadata(null);

      expect(result).toEqual({});
    });

    it("should sanitize sensitive data from request", () => {
      const request = {
        method: "POST",
        headers: {
          "user-agent": "Mozilla/5.0",
          authorization: "Bearer secret-token",
        },
        body: {
          password: "secret123",
          username: "user",
        },
      };

      const result = ActivityMetadataUtils.extractRequestMetadata(request);

      // Should not contain sensitive authorization header
      expect(result.headers).toEqual({
        userAgent: "Mozilla/5.0",
        contentType: undefined,
        acceptLanguage: undefined,
      });
    });
  });

  describe("system information", () => {
    it("should include system information in metadata", () => {
      const params = { ...baseParams };
      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(result.metadata.systemInfo).toBeDefined();
      expect(result.metadata.systemInfo.nodeVersion).toBeDefined();
      expect(result.metadata.systemInfo.processId).toBeDefined();
      expect(result.metadata.systemInfo.platform).toBeDefined();
    });

    it("should have correct system info types", () => {
      const params = { ...baseParams };
      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(typeof result.metadata.systemInfo.nodeVersion).toBe("string");
      expect(typeof result.metadata.systemInfo.processId).toBe("number");
      expect(typeof result.metadata.systemInfo.platform).toBe("string");
    });
  });

  describe("edge cases", () => {
    it("should handle empty params", () => {
      const params = {
        action: "test",
        resourceType: "test",
        description: "test",
      };

      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
    });

    it("should handle very large metadata objects", () => {
      const params = {
        ...baseParams,
        metadata: { largeData: "x".repeat(1000) },
      };

      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(result.metadata.largeData).toBe("x".repeat(1000));
    });

    it("should handle special characters in metadata", () => {
      const params = {
        ...baseParams,
        metadata: { special: "!@#$%^&*()_+{}[]|\\:;\"'<>,.?/" },
      };

      const result = ActivityMetadataUtils.collectMetadata(params);

      expect(result.metadata.special).toBe("!@#$%^&*()_+{}[]|\\:;\"'<>,.?/");
    });
  });
});
