/**
 * Activity Validation Tests
 *
 * Comprehensive test suite for the ActivityValidation utility class
 * including parameter validation, sanitization, and helper methods.
 */

import {
  ActivityValidation,
  ValidationResult,
} from "../../../src/services/audit/activity-validation";
import { ActivityLogParams } from "../../../src/services/audit/activity-log-service";
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
} from "../../../src/constants/activity-log-constants";

describe("ActivityValidation", () => {
  const validParams: ActivityLogParams = {
    action: "user_created",
    resourceType: "user",
    description: "User created successfully",
    userId: 1,
    sessionId: "session123",
    resourceId: 1,
    resourceUuid: "550e8400-e29b-41d4-a716-446655440000",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    severity: ActivitySeverity.MEDIUM,
    category: ActivityCategory.USER_MANAGEMENT,
    status: ActivityStatus.SUCCESS,
  };

  describe("validateParams", () => {
    it("should return valid for correct parameters", () => {
      const result = ActivityValidation.validateParams(validParams);
      expect(result).toEqual({ isValid: true });
    });

    it("should require action field", () => {
      const params = { ...validParams, action: "" };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "Action is required",
        field: "action",
      });

      const paramsUndefined = { ...validParams, action: undefined as any };
      const resultUndefined =
        ActivityValidation.validateParams(paramsUndefined);
      expect(resultUndefined.isValid).toBe(false);
      expect(resultUndefined.field).toBe("action");
    });

    it("should require resourceType field", () => {
      const params = { ...validParams, resourceType: "" };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "Resource type is required",
        field: "resourceType",
      });
    });

    it("should require description field", () => {
      const params = { ...validParams, description: "" };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "Description is required",
        field: "description",
      });
    });

    it("should validate action length", () => {
      const longAction = "a".repeat(101);
      const params = { ...validParams, action: longAction };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "Action must be 100 characters or less",
        field: "action",
      });
    });

    it("should validate resourceType length", () => {
      const longResourceType = "a".repeat(101);
      const params = { ...validParams, resourceType: longResourceType };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "Resource type must be 100 characters or less",
        field: "resourceType",
      });
    });

    it("should validate description length", () => {
      const longDescription = "a".repeat(1001);
      const params = { ...validParams, description: longDescription };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "Description must be 1000 characters or less",
        field: "description",
      });
    });

    it("should validate UUID format", () => {
      const params = { ...validParams, resourceUuid: "invalid-uuid" };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "Resource UUID must be a valid UUID format",
        field: "resourceUuid",
      });
    });

    it("should accept valid UUID formats", () => {
      const validUuids = [
        "550e8400-e29b-41d4-a716-446655440000",
        "123e4567-e89b-12d3-a456-426614174000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      ];

      validUuids.forEach((uuid) => {
        const params = { ...validParams, resourceUuid: uuid };
        const result = ActivityValidation.validateParams(params);
        expect(result.isValid).toBe(true);
      });
    });

    it("should validate IP address format", () => {
      const invalidIps = [
        "256.256.256.256",
        "192.168.1",
        "not-an-ip",
        "192.168.1.1.1",
      ];

      invalidIps.forEach((ip) => {
        const params = { ...validParams, ipAddress: ip };
        const result = ActivityValidation.validateParams(params);
        expect(result).toEqual({
          isValid: false,
          error: "IP address must be a valid IPv4 or IPv6 format",
          field: "ipAddress",
        });
      });
    });

    it("should accept valid IP addresses", () => {
      const validIps = [
        "192.168.1.1",
        "10.0.0.1",
        "127.0.0.1",
        "255.255.255.255",
        "0.0.0.0",
        "::1",
        "::",
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      ];

      validIps.forEach((ip) => {
        const params = { ...validParams, ipAddress: ip };
        const result = ActivityValidation.validateParams(params);
        expect(result.isValid).toBe(true);
      });
    });

    it("should validate session ID length", () => {
      const longSessionId = "a".repeat(256);
      const params = { ...validParams, sessionId: longSessionId };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "Session ID must be 255 characters or less",
        field: "sessionId",
      });
    });

    it("should validate user agent length", () => {
      const longUserAgent = "a".repeat(501);
      const params = { ...validParams, userAgent: longUserAgent };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "User agent must be 500 characters or less",
        field: "userAgent",
      });
    });

    it("should validate positive resource ID", () => {
      const params = { ...validParams, resourceId: -1 };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "Resource ID must be a positive number",
        field: "resourceId",
      });

      const zeroParams = { ...validParams, resourceId: 0 };
      const zeroResult = ActivityValidation.validateParams(zeroParams);
      expect(zeroResult.isValid).toBe(false);
      expect(zeroResult.field).toBe("resourceId");
    });

    it("should validate positive user ID", () => {
      const params = { ...validParams, userId: -1 };
      const result = ActivityValidation.validateParams(params);
      expect(result).toEqual({
        isValid: false,
        error: "User ID must be a positive number",
        field: "userId",
      });
    });

    it("should allow null values for optional fields", () => {
      const params = {
        ...validParams,
        userId: null,
        resourceId: null,
        resourceUuid: null,
        ipAddress: null,
        sessionId: null,
        userAgent: null,
      };
      const result = ActivityValidation.validateParams(params);
      expect(result.isValid).toBe(true);
    });
  });

  describe("sanitizeParams", () => {
    it("should return only safe parameters", () => {
      const params = {
        ...validParams,
        oldValues: { password: "secret123" },
        newValues: { password: "newsecret456" },
        metadata: { sensitive: "data" },
      };

      const sanitized = ActivityValidation.sanitizeParams(params);

      expect(sanitized).toEqual({
        action: "user_created",
        resourceType: "user",
        description: "User created successfully",
        userId: 1,
        resourceId: 1,
        resourceUuid: "550e8400-e29b-41d4-a716-446655440000",
        severity: ActivitySeverity.MEDIUM,
        category: ActivityCategory.USER_MANAGEMENT,
        status: ActivityStatus.SUCCESS,
      });

      expect(sanitized).not.toHaveProperty("oldValues");
      expect(sanitized).not.toHaveProperty("newValues");
      expect(sanitized).not.toHaveProperty("metadata");
      expect(sanitized).not.toHaveProperty("ipAddress");
      expect(sanitized).not.toHaveProperty("sessionId");
    });

    it("should handle null values", () => {
      const params = {
        ...validParams,
        userId: null,
        resourceId: null,
        resourceUuid: null,
      };

      const sanitized = ActivityValidation.sanitizeParams(params);

      expect(sanitized.userId).toBe(null);
      expect(sanitized.resourceId).toBe(null);
      expect(sanitized.resourceUuid).toBe(null);
    });
  });

  describe("validateJSON", () => {
    it("should return valid for valid JSON data", () => {
      const validData = { key: "value", number: 123, array: [1, 2, 3] };
      const result = ActivityValidation.validateJSON(validData);
      expect(result).toEqual({ isValid: true });
    });

    it("should return valid for null and undefined", () => {
      expect(ActivityValidation.validateJSON(null)).toEqual({ isValid: true });
      expect(ActivityValidation.validateJSON(undefined)).toEqual({
        isValid: true,
      });
    });

    it("should return invalid for circular references", () => {
      const circularData: any = { key: "value" };
      circularData.self = circularData;

      const result = ActivityValidation.validateJSON(circularData);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid JSON data");
      expect(result.field).toBe("json");
    });

    it("should handle functions and other non-serializable data", () => {
      const dataWithFunction = { key: "value", func: () => {} };
      const result = ActivityValidation.validateJSON(dataWithFunction);
      expect(result.isValid).toBe(true); // Functions are simply ignored in JSON.stringify
    });
  });

  describe("validateRequiredString", () => {
    it("should return valid for valid strings", () => {
      const result = ActivityValidation.validateRequiredString(
        "test",
        "fieldName"
      );
      expect(result).toEqual({ isValid: true });
    });

    it("should return invalid for null/undefined", () => {
      const result = ActivityValidation.validateRequiredString(
        null,
        "fieldName"
      );
      expect(result).toEqual({
        isValid: false,
        error: "fieldName is required and must be a string",
        field: "fieldName",
      });
    });

    it("should return invalid for empty string", () => {
      const result = ActivityValidation.validateRequiredString("", "fieldName");
      expect(result).toEqual({
        isValid: false,
        error: "fieldName cannot be empty",
        field: "fieldName",
      });

      const whitespaceResult = ActivityValidation.validateRequiredString(
        "   ",
        "fieldName"
      );
      expect(whitespaceResult.isValid).toBe(false);
      expect(whitespaceResult.error).toContain("cannot be empty");
    });

    it("should return invalid for non-string types", () => {
      const result = ActivityValidation.validateRequiredString(
        123,
        "fieldName"
      );
      expect(result).toEqual({
        isValid: false,
        error: "fieldName is required and must be a string",
        field: "fieldName",
      });
    });

    it("should validate string length", () => {
      const longString = "a".repeat(256);
      const result = ActivityValidation.validateRequiredString(
        longString,
        "fieldName",
        255
      );
      expect(result).toEqual({
        isValid: false,
        error: "fieldName must be 255 characters or less",
        field: "fieldName",
      });
    });

    it("should accept valid length strings", () => {
      const validString = "a".repeat(100);
      const result = ActivityValidation.validateRequiredString(
        validString,
        "fieldName",
        255
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateOptionalString", () => {
    it("should return valid for null/undefined", () => {
      expect(
        ActivityValidation.validateOptionalString(null, "fieldName")
      ).toEqual({ isValid: true });
      expect(
        ActivityValidation.validateOptionalString(undefined, "fieldName")
      ).toEqual({ isValid: true });
    });

    it("should return valid for valid strings", () => {
      const result = ActivityValidation.validateOptionalString(
        "test",
        "fieldName"
      );
      expect(result).toEqual({ isValid: true });
    });

    it("should return invalid for non-string types", () => {
      const result = ActivityValidation.validateOptionalString(
        123,
        "fieldName"
      );
      expect(result).toEqual({
        isValid: false,
        error: "fieldName must be a string",
        field: "fieldName",
      });
    });

    it("should validate string length", () => {
      const longString = "a".repeat(256);
      const result = ActivityValidation.validateOptionalString(
        longString,
        "fieldName",
        255
      );
      expect(result).toEqual({
        isValid: false,
        error: "fieldName must be 255 characters or less",
        field: "fieldName",
      });
    });

    it("should accept empty strings", () => {
      const result = ActivityValidation.validateOptionalString("", "fieldName");
      expect(result.isValid).toBe(true);
    });
  });

  describe("validatePositiveInteger", () => {
    it("should return valid for null/undefined", () => {
      expect(
        ActivityValidation.validatePositiveInteger(null, "fieldName")
      ).toEqual({ isValid: true });
      expect(
        ActivityValidation.validatePositiveInteger(undefined, "fieldName")
      ).toEqual({ isValid: true });
    });

    it("should return valid for positive integers", () => {
      expect(
        ActivityValidation.validatePositiveInteger(1, "fieldName")
      ).toEqual({ isValid: true });
      expect(
        ActivityValidation.validatePositiveInteger(100, "fieldName")
      ).toEqual({ isValid: true });
      expect(
        ActivityValidation.validatePositiveInteger(999999, "fieldName")
      ).toEqual({ isValid: true });
    });

    it("should return invalid for non-integers", () => {
      expect(
        ActivityValidation.validatePositiveInteger(1.5, "fieldName")
      ).toEqual({
        isValid: false,
        error: "fieldName must be an integer",
        field: "fieldName",
      });

      expect(
        ActivityValidation.validatePositiveInteger("123", "fieldName")
      ).toEqual({
        isValid: false,
        error: "fieldName must be an integer",
        field: "fieldName",
      });
    });

    it("should return invalid for zero and negative numbers", () => {
      expect(
        ActivityValidation.validatePositiveInteger(0, "fieldName")
      ).toEqual({
        isValid: false,
        error: "fieldName must be a positive number",
        field: "fieldName",
      });

      expect(
        ActivityValidation.validatePositiveInteger(-1, "fieldName")
      ).toEqual({
        isValid: false,
        error: "fieldName must be a positive number",
        field: "fieldName",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle extremely long strings", () => {
      const veryLongString = "a".repeat(10000);
      const params = { ...validParams, description: veryLongString };
      const result = ActivityValidation.validateParams(params);
      expect(result.isValid).toBe(false);
      expect(result.field).toBe("description");
    });

    it("should handle special characters in strings", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      const params = { ...validParams, description: specialChars };
      const result = ActivityValidation.validateParams(params);
      expect(result.isValid).toBe(true);
    });

    it("should handle unicode characters", () => {
      const unicode = "测试 🚀 العربية";
      const params = { ...validParams, description: unicode };
      const result = ActivityValidation.validateParams(params);
      expect(result.isValid).toBe(true);
    });

    it("should handle edge case IP addresses", () => {
      const edgeCases = [
        "127.0.0.1",
        "0.0.0.0",
        "255.255.255.255",
        "::1",
        "::",
      ];

      edgeCases.forEach((ip) => {
        const params = { ...validParams, ipAddress: ip };
        const result = ActivityValidation.validateParams(params);
        expect(result.isValid).toBe(true);
      });
    });

    it("should handle maximum length strings", () => {
      const maxLengthAction = "a".repeat(100);
      const maxLengthResourceType = "b".repeat(100);
      const maxLengthDescription = "c".repeat(1000);

      const params = {
        ...validParams,
        action: maxLengthAction,
        resourceType: maxLengthResourceType,
        description: maxLengthDescription,
      };

      const result = ActivityValidation.validateParams(params);
      expect(result.isValid).toBe(true);
    });
  });
});
