/**
 * Activity Log Model Tests
 *
 * Comprehensive test suite for ActivityLog model following TDD methodology.
 * Tests validation rules, relationships, data serialization, and edge cases.
 */

import { jest } from "@jest/globals";
import {
  ActivityLog,
  ActivityLogData,
} from "../../src/models/activity-log-model";
import { User } from "../../src/models/user-model";
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
  AUTHENTICATION_ACTIONS,
  RESOURCE_TYPES,
} from "../../src/constants/activity-log-constants";

// Mock the ORM
jest.mock("../../src/config/database/orm", () => {
  return class MockModel {
    static tableName = "";
    static softDelete = false;
    static relationMappings: any = {};
    static BelongsToOneRelation = "BelongsToOneRelation";

    validate() {}
    serialize() {}
  };
});

describe("ActivityLog Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Model Configuration", () => {
    it("should have correct table name", () => {
      expect(ActivityLog.tableName).toBe("activity_logs");
    });

    it("should not have soft delete enabled", () => {
      expect(ActivityLog.softDelete).toBe(false);
    });

    it("should have proper relationship mappings", () => {
      expect(ActivityLog.relationMappings).toBeDefined();
      expect(ActivityLog.relationMappings.user).toBeDefined();
      expect(ActivityLog.relationMappings.user.relation).toBeDefined();
      expect(ActivityLog.relationMappings.user.modelClass).toBe(User);
    });
  });

  describe("Data Validation", () => {
    const validActivityData: Partial<ActivityLogData> = {
      action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
      resource_type: RESOURCE_TYPES.USER,
      resource_id: 1,
      description: "User successfully logged in",
      category: ActivityCategory.AUTHENTICATION,
      severity: ActivitySeverity.LOW,
      status: ActivityStatus.SUCCESS,
      user_id: 1,
      ip_address: "192.168.1.1",
      user_agent: "Mozilla/5.0",
    };

    it("should validate required fields", () => {
      const log = new ActivityLog();

      // Should require action
      expect(() =>
        log.validate({ ...validActivityData, action: undefined })
      ).toThrow();

      // Should require resource_type
      expect(() =>
        log.validate({ ...validActivityData, resource_type: undefined })
      ).toThrow();

      // Should require description
      expect(() =>
        log.validate({ ...validActivityData, description: undefined })
      ).toThrow();

      // Should require category
      expect(() =>
        log.validate({ ...validActivityData, category: undefined })
      ).toThrow();
    });

    it("should validate enum values for severity", () => {
      const log = new ActivityLog();

      // Valid severity values should pass
      Object.values(ActivitySeverity).forEach((severity) => {
        expect(() =>
          log.validate({ ...validActivityData, severity })
        ).not.toThrow();
      });

      // Invalid severity should fail
      expect(() =>
        log.validate({ ...validActivityData, severity: "invalid" as any })
      ).toThrow();
    });

    it("should validate enum values for category", () => {
      const log = new ActivityLog();

      // Valid category values should pass
      Object.values(ActivityCategory).forEach((category) => {
        expect(() =>
          log.validate({ ...validActivityData, category })
        ).not.toThrow();
      });

      // Invalid category should fail
      expect(() =>
        log.validate({ ...validActivityData, category: "invalid" as any })
      ).toThrow();
    });

    it("should validate enum values for status", () => {
      const log = new ActivityLog();

      // Valid status values should pass
      Object.values(ActivityStatus).forEach((status) => {
        expect(() =>
          log.validate({ ...validActivityData, status })
        ).not.toThrow();
      });

      // Invalid status should fail
      expect(() =>
        log.validate({ ...validActivityData, status: "invalid" as any })
      ).toThrow();
    });

    it("should validate IP address format", () => {
      const log = new ActivityLog();

      // Valid IP addresses
      const validIPs = ["192.168.1.1", "10.0.0.1", "127.0.0.1", "::1"];
      validIPs.forEach((ip) => {
        expect(() =>
          log.validate({ ...validActivityData, ip_address: ip })
        ).not.toThrow();
      });

      // Invalid IP addresses
      const invalidIPs = ["999.999.999.999", "invalid-ip", "192.168.1"];
      invalidIPs.forEach((ip) => {
        expect(() =>
          log.validate({ ...validActivityData, ip_address: ip })
        ).toThrow();
      });
    });

    it("should validate JSON fields", () => {
      const log = new ActivityLog();

      // Valid JSON objects
      const validJSON = { key: "value", number: 123 };
      expect(() =>
        log.validate({
          ...validActivityData,
          old_values: validJSON,
          new_values: validJSON,
          metadata: validJSON,
        })
      ).not.toThrow();

      // null values should be allowed
      expect(() =>
        log.validate({
          ...validActivityData,
          old_values: null,
          new_values: null,
          metadata: null,
        })
      ).not.toThrow();
    });

    it("should validate field lengths", () => {
      const log = new ActivityLog();

      // Action should not exceed 100 characters
      const longAction = "a".repeat(101);
      expect(() =>
        log.validate({ ...validActivityData, action: longAction })
      ).toThrow();

      // Resource type should not exceed 100 characters
      const longResourceType = "a".repeat(101);
      expect(() =>
        log.validate({ ...validActivityData, resource_type: longResourceType })
      ).toThrow();

      // IP address should not exceed 45 characters (IPv6)
      const longIP = "a".repeat(46);
      expect(() =>
        log.validate({ ...validActivityData, ip_address: longIP })
      ).toThrow();
    });
  });

  describe("Data Serialization", () => {
    it("should serialize data correctly", () => {
      const activityData: ActivityLogData = {
        id: 1,
        user_id: 1,
        session_id: "session-123",
        action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
        resource_type: RESOURCE_TYPES.USER,
        resource_id: 1,
        resource_uuid: "550e8400-e29b-41d4-a716-446655440000",
        description: "User successfully logged in",
        old_values: null,
        new_values: { loginTime: new Date() },
        metadata: { browser: "Chrome", version: "91.0" },
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        severity: ActivitySeverity.LOW,
        category: ActivityCategory.AUTHENTICATION,
        status: ActivityStatus.SUCCESS,
        created_at: new Date(),
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          password: "hashed",
          role: "user",
          created_at: new Date(),
          updated_at: new Date(),
        },
      };

      const log = new ActivityLog();
      const serialized = log.serialize(activityData);

      expect(serialized).toEqual(
        expect.objectContaining({
          id: 1,
          action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
          resource_type: RESOURCE_TYPES.USER,
          description: "User successfully logged in",
          severity: ActivitySeverity.LOW,
          category: ActivityCategory.AUTHENTICATION,
          status: ActivityStatus.SUCCESS,
        })
      );
    });

    it("should handle null values correctly", () => {
      const activityData: Partial<ActivityLogData> = {
        id: 1,
        action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
        resource_type: RESOURCE_TYPES.USER,
        description: "System action",
        category: ActivityCategory.SYSTEM,
        severity: ActivitySeverity.MEDIUM,
        status: ActivityStatus.SUCCESS,
        user_id: null,
        resource_id: null,
        old_values: null,
        new_values: null,
        metadata: null,
        created_at: new Date(),
      };

      const log = new ActivityLog();
      const serialized = log.serialize(activityData);

      expect(serialized.user_id).toBeNull();
      expect(serialized.resource_id).toBeNull();
      expect(serialized.old_values).toBeNull();
      expect(serialized.new_values).toBeNull();
      expect(serialized.metadata).toBeNull();
    });
  });

  describe("Relationships", () => {
    it("should define user relationship correctly", () => {
      const userRelation = ActivityLog.relationMappings.user;

      expect(userRelation).toBeDefined();
      expect(userRelation.modelClass).toBe(User);
      expect(userRelation.join.from).toBe("activity_logs.user_id");
      expect(userRelation.join.to).toBe("users.id");
    });

    it("should allow optional user relationship", () => {
      // System actions might not have an associated user
      const systemActivityData: Partial<ActivityLogData> = {
        action: "system_started",
        resource_type: RESOURCE_TYPES.SYSTEM_SETTING,
        description: "System started successfully",
        category: ActivityCategory.SYSTEM,
        severity: ActivitySeverity.MEDIUM,
        status: ActivityStatus.SUCCESS,
        user_id: null,
      };

      const log = new ActivityLog();
      expect(() => log.validate(systemActivityData)).not.toThrow();
    });
  });

  describe("Edge Cases and Error Conditions", () => {
    it("should handle malformed JSON gracefully", () => {
      const log = new ActivityLog();

      // The model should validate JSON structure
      expect(() =>
        log.validate({
          action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
          resource_type: RESOURCE_TYPES.USER,
          description: "Test",
          category: ActivityCategory.AUTHENTICATION,
          old_values: "invalid-json" as any,
        })
      ).toThrow();
    });

    it("should handle very long descriptions", () => {
      const log = new ActivityLog();
      const longDescription = "a".repeat(10000);

      // Should validate description length (text field should handle large content)
      expect(() =>
        log.validate({
          action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
          resource_type: RESOURCE_TYPES.USER,
          description: longDescription,
          category: ActivityCategory.AUTHENTICATION,
        })
      ).not.toThrow();
    });

    it("should handle negative resource IDs", () => {
      const log = new ActivityLog();

      expect(() =>
        log.validate({
          action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
          resource_type: RESOURCE_TYPES.USER,
          resource_id: -1,
          description: "Test",
          category: ActivityCategory.AUTHENTICATION,
        })
      ).toThrow("Resource ID must be positive");
    });

    it("should validate UUID format for resource_uuid", () => {
      const log = new ActivityLog();

      // Valid UUID
      expect(() =>
        log.validate({
          action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
          resource_type: RESOURCE_TYPES.USER,
          resource_uuid: "550e8400-e29b-41d4-a716-446655440000",
          description: "Test",
          category: ActivityCategory.AUTHENTICATION,
        })
      ).not.toThrow();

      // Invalid UUID
      expect(() =>
        log.validate({
          action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
          resource_type: RESOURCE_TYPES.USER,
          resource_uuid: "invalid-uuid",
          description: "Test",
          category: ActivityCategory.AUTHENTICATION,
        })
      ).toThrow("Invalid UUID format");
    });

    it("should handle concurrent creation timestamps", () => {
      const now = new Date();
      const log1Data: Partial<ActivityLogData> = {
        action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
        resource_type: RESOURCE_TYPES.USER,
        description: "Test 1",
        category: ActivityCategory.AUTHENTICATION,
        created_at: now,
      };

      const log2Data: Partial<ActivityLogData> = {
        action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
        resource_type: RESOURCE_TYPES.USER,
        description: "Test 2",
        category: ActivityCategory.AUTHENTICATION,
        created_at: now,
      };

      const log1 = new ActivityLog();
      const log2 = new ActivityLog();

      expect(() => log1.validate(log1Data)).not.toThrow();
      expect(() => log2.validate(log2Data)).not.toThrow();
    });
  });
});
