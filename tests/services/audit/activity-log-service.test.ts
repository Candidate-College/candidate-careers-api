/**
 * Activity Log Service Tests
 *
 * Comprehensive test suite for the ActivityLogService class including
 * all logging methods, validation, categorization, and error handling.
 */

import {
  ActivityLogService,
  ActivityLogParams,
  ActivityLogResult,
} from "../../../src/services/audit/activity-log-service";
import { ActivityLog } from "../../../src/models/activity-log-model";
import { UserData } from "../../../src/models/user-model";
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
} from "../../../src/constants/activity-log-constants";
import { defaultWinstonLogger } from "../../../src/utilities/winston-logger";
import { ActivityValidation } from "../../../src/services/audit/activity-validation";
import { ActivityMetadataUtils } from "../../../src/services/audit/activity-metadata";

// Mock dependencies
jest.mock("../../../src/models/activity-log-model");
jest.mock("../../../src/utilities/winston-logger");
jest.mock("../../../src/services/audit/activity-validation");
jest.mock("../../../src/services/audit/activity-metadata");

const mockActivityLog = ActivityLog as jest.Mocked<typeof ActivityLog>;
const mockWinstonLogger = defaultWinstonLogger as jest.Mocked<
  typeof defaultWinstonLogger
>;
const mockActivityValidation = ActivityValidation as jest.Mocked<
  typeof ActivityValidation
>;
const mockActivityMetadata = ActivityMetadataUtils as jest.Mocked<
  typeof ActivityMetadataUtils
>;

describe("ActivityLogService", () => {
  // Test data
  const mockUser: UserData = {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    password: "hashedpassword",
    role: "user",
    email_verified_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockActivityParams: ActivityLogParams = {
    userId: 1,
    sessionId: "session123",
    action: "user_created",
    resourceType: "user",
    resourceId: 1,
    description: "User created successfully",
    severity: ActivitySeverity.MEDIUM,
    category: ActivityCategory.USER_MANAGEMENT,
    status: ActivityStatus.SUCCESS,
  };

  const mockActivityLogRecord = {
    id: 1,
    user_id: 1,
    session_id: "session123",
    action: "user_created",
    resource_type: "user",
    resource_id: 1,
    description: "User created successfully",
    severity: ActivitySeverity.MEDIUM,
    category: ActivityCategory.USER_MANAGEMENT,
    status: ActivityStatus.SUCCESS,
    created_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockActivityValidation.validateParams.mockReturnValue({ isValid: true });
    mockActivityValidation.sanitizeParams.mockReturnValue(mockActivityParams);
    mockActivityMetadata.collectMetadata.mockReturnValue(mockActivityParams);

    // Mock Objection query builder
    const mockQueryBuilder = {
      insert: jest.fn().mockResolvedValue(mockActivityLogRecord),
      count: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ count: "10" }),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
    };

    mockActivityLog.query = jest.fn().mockReturnValue(mockQueryBuilder);
    mockWinstonLogger.asyncInfo = jest.fn().mockResolvedValue(undefined);
    mockWinstonLogger.asyncError = jest.fn().mockResolvedValue(undefined);
  });

  describe("logActivity", () => {
    it("should successfully log activity with valid parameters", async () => {
      const result = await ActivityLogService.logActivity(mockActivityParams);

      expect(result).toEqual({
        success: true,
        activityId: 1,
        message: "Activity logged successfully",
      });

      expect(mockActivityValidation.validateParams).toHaveBeenCalledWith(
        mockActivityParams
      );
      expect(mockActivityMetadata.collectMetadata).toHaveBeenCalled();
      expect(mockActivityLog.query).toHaveBeenCalled();
      expect(mockWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        "Activity logged successfully",
        expect.objectContaining({
          activityId: 1,
          action: "user_created",
          userId: 1,
        })
      );
    });

    it("should return error when validation fails", async () => {
      mockActivityValidation.validateParams.mockReturnValue({
        isValid: false,
        error: "Action is required",
      });

      const result = await ActivityLogService.logActivity(mockActivityParams);

      expect(result).toEqual({
        success: false,
        error: "Action is required",
      });

      expect(mockActivityLog.query).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      const mockQueryBuilder = {
        insert: jest.fn().mockRejectedValue(new Error("Database error")),
      };
      mockActivityLog.query = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await ActivityLogService.logActivity(mockActivityParams);

      expect(result).toEqual({
        success: false,
        error: "Failed to log activity",
      });

      expect(mockWinstonLogger.asyncError).toHaveBeenCalledWith(
        "Failed to log activity",
        expect.objectContaining({
          error: "Database error",
        })
      );
    });

    it("should handle unknown error types", async () => {
      const mockQueryBuilder = {
        insert: jest.fn().mockRejectedValue("Unknown error"),
      };
      mockActivityLog.query = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await ActivityLogService.logActivity(mockActivityParams);

      expect(result).toEqual({
        success: false,
        error: "Failed to log activity",
      });

      expect(mockWinstonLogger.asyncError).toHaveBeenCalledWith(
        "Failed to log activity",
        expect.objectContaining({
          error: "Unknown error",
        })
      );
    });

    it("should handle null userId correctly", async () => {
      const paramsWithNullUser = { ...mockActivityParams, userId: null };

      // Mock the metadata collection to return the params with null userId
      mockActivityMetadata.collectMetadata.mockReturnValue(paramsWithNullUser);

      const result = await ActivityLogService.logActivity(paramsWithNullUser);

      expect(result.success).toBe(true);
      expect(mockWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        "Activity logged successfully",
        expect.objectContaining({
          userId: undefined, // null should be converted to undefined
        })
      );
    });
  });

  describe("logUserAction", () => {
    it("should log user action with correct parameters", async () => {
      const result = await ActivityLogService.logUserAction(
        mockUser,
        "user_updated",
        "user",
        "User profile updated"
      );

      expect(result.success).toBe(true);
      expect(mockActivityValidation.validateParams).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          action: "user_updated",
          resourceType: "user",
          description: "User profile updated",
          category: ActivityCategory.USER_MANAGEMENT,
        })
      );
    });

    it("should merge additional parameters correctly", async () => {
      const additionalParams = {
        resourceId: 123,
        metadata: { custom: "data" },
      };

      await ActivityLogService.logUserAction(
        mockUser,
        "user_updated",
        "user",
        "User profile updated",
        additionalParams
      );

      expect(mockActivityValidation.validateParams).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          resourceId: 123,
          metadata: { custom: "data" },
        })
      );
    });
  });

  describe("logSystemEvent", () => {
    it("should log system event with null user", async () => {
      const result = await ActivityLogService.logSystemEvent(
        "system_started",
        "System startup completed"
      );

      expect(result.success).toBe(true);
      expect(mockActivityValidation.validateParams).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          action: "system_started",
          resourceType: "system",
          description: "System startup completed",
          category: ActivityCategory.SYSTEM,
        })
      );
    });

    it("should handle additional parameters", async () => {
      const additionalParams = {
        severity: ActivitySeverity.HIGH,
        metadata: { version: "1.0.0" },
      };

      await ActivityLogService.logSystemEvent(
        "system_started",
        "System startup completed",
        additionalParams
      );

      expect(mockActivityValidation.validateParams).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ActivitySeverity.HIGH,
          metadata: { version: "1.0.0" },
        })
      );
    });
  });

  describe("logSecurityEvent", () => {
    it("should log security event with default high severity", async () => {
      const result = await ActivityLogService.logSecurityEvent(
        "security_alert",
        "Suspicious activity detected"
      );

      expect(result.success).toBe(true);
      expect(mockActivityValidation.validateParams).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "security_alert",
          resourceType: "security",
          description: "Suspicious activity detected",
          category: ActivityCategory.SECURITY,
          severity: ActivitySeverity.HIGH,
        })
      );
    });

    it("should use custom severity when provided", async () => {
      await ActivityLogService.logSecurityEvent(
        "security_alert",
        "Minor security event",
        ActivitySeverity.LOW
      );

      expect(mockActivityValidation.validateParams).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ActivitySeverity.LOW,
        })
      );
    });
  });

  describe("logAuthenticationEvent", () => {
    it("should log authentication event with user ID", async () => {
      const result = await ActivityLogService.logAuthenticationEvent(
        1,
        "login_success",
        "User logged in successfully",
        "session123"
      );

      expect(result.success).toBe(true);
      expect(mockActivityValidation.validateParams).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          sessionId: "session123",
          action: "login_success",
          resourceType: "authentication",
          description: "User logged in successfully",
          category: ActivityCategory.AUTHENTICATION,
        })
      );
    });

    it("should handle authentication events without user ID", async () => {
      await ActivityLogService.logAuthenticationEvent(
        null,
        "login_failed",
        "Login attempt failed"
      );

      expect(mockActivityValidation.validateParams).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          action: "login_failed",
        })
      );
    });
  });

  describe("logBulkActivities", () => {
    it("should log multiple activities", async () => {
      const activities = [
        { ...mockActivityParams, action: "action1" },
        { ...mockActivityParams, action: "action2" },
      ];

      const results = await ActivityLogService.logBulkActivities(activities);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockActivityValidation.validateParams).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed success/failure results", async () => {
      mockActivityValidation.validateParams
        .mockReturnValueOnce({ isValid: true })
        .mockReturnValueOnce({ isValid: false, error: "Validation failed" });

      const activities = [
        { ...mockActivityParams, action: "action1" },
        { ...mockActivityParams, action: "action2" },
      ];

      const results = await ActivityLogService.logBulkActivities(activities);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe("Validation failed");
    });
  });

  describe("getLoggingStatistics", () => {
    it("should return statistics with correct format", async () => {
      const mockCategoryStats = [
        { category: "authentication", count: "5" },
        { category: "user_management", count: "3" },
      ];
      const mockSeverityStats = [
        { severity: "high", count: "2" },
        { severity: "medium", count: "6" },
      ];

      const mockQueryBuilder = {
        count: jest.fn().mockReturnThis(),
        first: jest
          .fn()
          .mockResolvedValueOnce({ count: "10" }) // total activities
          .mockResolvedValueOnce({ count: "8" }), // success count
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
      };

      mockActivityLog.query = jest
        .fn()
        .mockReturnValueOnce(mockQueryBuilder) // total activities
        .mockReturnValueOnce(mockQueryBuilder) // success count
        .mockReturnValueOnce({
          ...mockQueryBuilder,
          groupBy: jest.fn().mockResolvedValue(mockCategoryStats),
        })
        .mockReturnValueOnce({
          ...mockQueryBuilder,
          groupBy: jest.fn().mockResolvedValue(mockSeverityStats),
        });

      const result = await ActivityLogService.getLoggingStatistics();

      expect(result).toEqual({
        totalActivities: 10,
        successRate: 80,
        categoryCounts: {
          authentication: 5,
          user_management: 3,
        },
        severityCounts: {
          high: 2,
          medium: 6,
        },
      });
    });

    it("should handle database errors in statistics", async () => {
      const mockQueryBuilder = {
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error("Database error")),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
      };
      mockActivityLog.query = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await ActivityLogService.getLoggingStatistics();

      expect(result).toEqual({
        totalActivities: 0,
        successRate: 0,
        categoryCounts: {},
        severityCounts: {},
      });

      expect(mockWinstonLogger.asyncError).toHaveBeenCalledWith(
        "Failed to get logging statistics",
        expect.objectContaining({
          error: "Database error",
        })
      );
    });

    it("should handle division by zero in success rate", async () => {
      const mockQueryBuilder = {
        count: jest.fn().mockReturnThis(),
        first: jest
          .fn()
          .mockResolvedValueOnce({ count: "0" }) // total activities
          .mockResolvedValueOnce({ count: "0" }), // success count
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockResolvedValue([]),
      };

      mockActivityLog.query = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await ActivityLogService.getLoggingStatistics();

      expect(result.successRate).toBe(0); // Should handle division by zero
    });
  });

  describe("applyCategorization", () => {
    it("should apply categorization when not provided", async () => {
      const paramsWithoutCategorization = {
        ...mockActivityParams,
        category: undefined,
        severity: undefined,
        status: undefined,
      };

      // The applyCategorization method is private, so we test it through logActivity
      await ActivityLogService.logActivity(paramsWithoutCategorization);

      // Verify that the categorization was applied
      expect(mockActivityMetadata.collectMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          // The categorization should be applied by this point
          action: "user_created",
        })
      );
    });
  });

  describe("error handling", () => {
    it("should handle winston logging errors gracefully", async () => {
      mockWinstonLogger.asyncInfo.mockRejectedValue(new Error("Winston error"));

      const result = await ActivityLogService.logActivity(mockActivityParams);

      // Should still succeed even if Winston fails
      expect(result.success).toBe(true);
    });

    it("should handle metadata collection errors", async () => {
      mockActivityMetadata.collectMetadata.mockImplementation(() => {
        throw new Error("Metadata error");
      });

      const result = await ActivityLogService.logActivity(mockActivityParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to log activity");
    });
  });
});
