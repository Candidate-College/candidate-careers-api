/**
 * Activity Retrieval Service Tests
 *
 * Comprehensive test suite for activity retrieval service covering
 * filtering, pagination, search, and performance with large datasets.
 */

import { ActivityRetrievalService } from "@/services/audit/activity-retrieval-service";
import { ActivityRetrievalFilters } from "@/services/audit/activity-retrieval-filters";
import { ActivityRetrievalQueryBuilder } from "@/services/audit/activity-retrieval-query-builder";
import { ActivityLog } from "@/models/activity-log-model";
import { defaultWinstonLogger } from "@/utilities/winston-logger";
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
} from "@/constants/activity-log-constants";

// Mock dependencies
jest.mock("@/models/activity-log-model");
jest.mock("@/utilities/winston-logger");
jest.mock("@/services/audit/activity-retrieval-filters");
jest.mock("@/services/audit/activity-retrieval-query-builder");

const mockActivityLog = ActivityLog as jest.Mocked<typeof ActivityLog>;
const mockWinstonLogger = defaultWinstonLogger as jest.Mocked<
  typeof defaultWinstonLogger
>;
const mockFilters = ActivityRetrievalFilters as jest.Mocked<
  typeof ActivityRetrievalFilters
>;
const mockQueryBuilder = ActivityRetrievalQueryBuilder as jest.Mocked<
  typeof ActivityRetrievalQueryBuilder
>;

describe("ActivityRetrievalService", () => {
  let mockQuery: any;
  let mockCountQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock query builder
    mockQuery = {
      resultSize: jest.fn(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    mockCountQuery = {
      resultSize: jest.fn(),
    };

    // Mock Winston logger
    mockWinstonLogger.info = jest.fn();
    mockWinstonLogger.error = jest.fn();

    // Mock filters
    mockFilters.validateAndSanitize = jest.fn();
    mockFilters.isValidUserId = jest.fn();
    mockFilters.isValidResourceId = jest.fn();
    mockFilters.sanitizeSearchTerm = jest.fn();

    // Mock query builder
    mockQueryBuilder.buildQuery = jest.fn().mockReturnValue(mockQuery);
    mockQueryBuilder.buildCountQuery = jest
      .fn()
      .mockReturnValue(mockCountQuery);
    mockQueryBuilder.buildUserActivityQuery = jest
      .fn()
      .mockReturnValue(mockQuery);
    mockQueryBuilder.buildSingleActivityQuery = jest
      .fn()
      .mockReturnValue(mockQuery);
    mockQueryBuilder.buildSearchQuery = jest.fn().mockReturnValue(mockQuery);
    mockQueryBuilder.buildRecentActivitiesQuery = jest
      .fn()
      .mockReturnValue(mockQuery);
    mockQueryBuilder.applyPagination = jest.fn().mockReturnValue(mockQuery);
  });

  describe("getActivityLogs", () => {
    it("should retrieve activity logs with default filters", async () => {
      const mockActivities = [
        { id: 1, action: "login", description: "User login" },
        { id: 2, action: "logout", description: "User logout" },
      ];

      mockFilters.validateAndSanitize.mockReturnValue({});
      mockCountQuery.resultSize.mockResolvedValue(2);
      mockQueryBuilder.applyPagination.mockReturnValue(mockActivities);

      const result = await ActivityRetrievalService.getActivityLogs();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivities);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });

      expect(mockFilters.validateAndSanitize).toHaveBeenCalledWith({});
      expect(mockQueryBuilder.buildQuery).toHaveBeenCalled();
      expect(mockQueryBuilder.buildCountQuery).toHaveBeenCalled();
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        "Activity logs retrieved successfully",
        expect.any(Object)
      );
    });

    it("should retrieve activity logs with custom filters", async () => {
      const filters = {
        userId: 1,
        category: ActivityCategory.AUTHENTICATION,
        severity: ActivitySeverity.HIGH,
        page: 2,
        limit: 10,
      };

      const mockActivities = [
        { id: 3, action: "login_failed", description: "Failed login attempt" },
      ];

      mockFilters.validateAndSanitize.mockReturnValue(filters);
      mockCountQuery.resultSize.mockResolvedValue(15);
      mockQueryBuilder.applyPagination.mockReturnValue(mockActivities);

      const result = await ActivityRetrievalService.getActivityLogs(filters);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivities);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 15,
        totalPages: 2,
        hasNext: false,
        hasPrevious: true,
      });

      expect(mockFilters.validateAndSanitize).toHaveBeenCalledWith(filters);
    });

    it("should handle database errors gracefully", async () => {
      const error = new Error("Database connection failed");

      mockFilters.validateAndSanitize.mockReturnValue({});
      mockQueryBuilder.buildQuery.mockImplementation(() => {
        throw error;
      });

      const result = await ActivityRetrievalService.getActivityLogs();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
      expect(result.message).toBe("Failed to retrieve activity logs");

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        "Failed to retrieve activity logs",
        expect.objectContaining({
          error: "Database connection failed",
        })
      );
    });

    it("should handle large datasets with proper pagination", async () => {
      const filters = { page: 10, limit: 100 };
      const mockActivities = Array.from({ length: 100 }, (_, i) => ({
        id: i + 900,
        action: `action_${i}`,
        description: `Description ${i}`,
      }));

      mockFilters.validateAndSanitize.mockReturnValue(filters);
      mockCountQuery.resultSize.mockResolvedValue(1500);
      mockQueryBuilder.applyPagination.mockReturnValue(mockActivities);

      const result = await ActivityRetrievalService.getActivityLogs(filters);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(100);
      expect(result.pagination).toEqual({
        page: 10,
        limit: 100,
        total: 1500,
        totalPages: 15,
        hasNext: true,
        hasPrevious: true,
      });
    });
  });

  describe("getUserActivityHistory", () => {
    it("should retrieve user activity history successfully", async () => {
      const userId = 1;
      const filters = { category: ActivityCategory.USER_MANAGEMENT };
      const mockActivities = [
        { id: 1, action: "user_updated", description: "User profile updated" },
      ];

      mockFilters.isValidUserId.mockReturnValue(true);
      mockCountQuery.resultSize.mockResolvedValue(1);
      mockQueryBuilder.applyPagination.mockReturnValue(mockActivities);

      const result = await ActivityRetrievalService.getUserActivityHistory(
        userId,
        filters
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivities);
      expect(mockFilters.isValidUserId).toHaveBeenCalledWith(userId);
      expect(mockQueryBuilder.buildUserActivityQuery).toHaveBeenCalledWith(
        userId,
        filters
      );
    });

    it("should reject invalid user ID", async () => {
      const userId = -1;

      mockFilters.isValidUserId.mockReturnValue(false);

      const result = await ActivityRetrievalService.getUserActivityHistory(
        userId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid user ID provided");
      expect(result.message).toBe("User ID must be a positive number");
    });

    it("should handle user with no activity history", async () => {
      const userId = 1;

      mockFilters.isValidUserId.mockReturnValue(true);
      mockCountQuery.resultSize.mockResolvedValue(0);
      mockQueryBuilder.applyPagination.mockReturnValue([]);

      const result = await ActivityRetrievalService.getUserActivityHistory(
        userId
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.pagination?.total).toBe(0);
    });
  });

  describe("getActivityById", () => {
    it("should retrieve activity by ID successfully", async () => {
      const activityId = 1;
      const mockActivity = {
        id: 1,
        action: "login",
        description: "User login",
        user: { id: 1, email: "user@example.com" },
      };

      mockQueryBuilder.buildSingleActivityQuery.mockReturnValue(mockActivity);

      const result = await ActivityRetrievalService.getActivityById(activityId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivity);
      expect(mockQueryBuilder.buildSingleActivityQuery).toHaveBeenCalledWith(
        activityId,
        true
      );
    });

    it("should reject invalid activity ID", async () => {
      const activityId = -1;

      const result = await ActivityRetrievalService.getActivityById(activityId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid activity ID provided");
      expect(result.message).toBe("Activity ID must be a positive number");
    });

    it("should handle activity not found", async () => {
      const activityId = 999;

      mockQueryBuilder.buildSingleActivityQuery.mockReturnValue(null);

      const result = await ActivityRetrievalService.getActivityById(activityId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Activity not found");
      expect(result.message).toBe("Activity with ID 999 not found");
    });

    it("should exclude user when requested", async () => {
      const activityId = 1;
      const mockActivity = {
        id: 1,
        action: "login",
        description: "User login",
      };

      mockQueryBuilder.buildSingleActivityQuery.mockReturnValue(mockActivity);

      const result = await ActivityRetrievalService.getActivityById(
        activityId,
        false
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivity);
      expect(mockQueryBuilder.buildSingleActivityQuery).toHaveBeenCalledWith(
        activityId,
        false
      );
    });
  });

  describe("searchActivities", () => {
    it("should search activities with valid search term", async () => {
      const searchTerm = "login";
      const filters = { category: ActivityCategory.AUTHENTICATION };
      const mockActivities = [
        { id: 1, action: "login", description: "User login successful" },
        { id: 2, action: "login_failed", description: "User login failed" },
      ];

      mockFilters.sanitizeSearchTerm.mockReturnValue(searchTerm);
      mockCountQuery.resultSize.mockResolvedValue(2);
      mockQueryBuilder.applyPagination.mockReturnValue(mockActivities);

      const result = await ActivityRetrievalService.searchActivities(
        searchTerm,
        filters
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivities);
      expect(mockFilters.sanitizeSearchTerm).toHaveBeenCalledWith(searchTerm);
      expect(mockQueryBuilder.buildSearchQuery).toHaveBeenCalledWith(
        searchTerm,
        filters
      );
    });

    it("should reject empty search term", async () => {
      const searchTerm = "   ";

      mockFilters.sanitizeSearchTerm.mockReturnValue(undefined);

      const result = await ActivityRetrievalService.searchActivities(
        searchTerm
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Search term is required");
      expect(result.message).toBe("Please provide a valid search term");
    });

    it("should handle search with no results", async () => {
      const searchTerm = "nonexistent";

      mockFilters.sanitizeSearchTerm.mockReturnValue(searchTerm);
      mockCountQuery.resultSize.mockResolvedValue(0);
      mockQueryBuilder.applyPagination.mockReturnValue([]);

      const result = await ActivityRetrievalService.searchActivities(
        searchTerm
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.pagination?.total).toBe(0);
    });

    it("should handle search with large result set", async () => {
      const searchTerm = "user";
      const filters = { limit: 20 };
      const mockActivities = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        action: `user_action_${i}`,
        description: `User performed action ${i}`,
      }));

      mockFilters.sanitizeSearchTerm.mockReturnValue(searchTerm);
      mockCountQuery.resultSize.mockResolvedValue(500);
      mockQueryBuilder.applyPagination.mockReturnValue(mockActivities);

      const result = await ActivityRetrievalService.searchActivities(
        searchTerm,
        filters
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(20);
      expect(result.pagination?.total).toBe(500);
      expect(result.pagination?.totalPages).toBe(10);
    });
  });

  describe("getRecentActivities", () => {
    it("should retrieve recent activities with default limit", async () => {
      const mockActivities = [
        { id: 3, action: "logout", description: "User logout" },
        { id: 2, action: "login", description: "User login" },
        { id: 1, action: "register", description: "User registration" },
      ];

      mockQueryBuilder.buildRecentActivitiesQuery.mockReturnValue(
        mockActivities
      );

      const result = await ActivityRetrievalService.getRecentActivities();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivities);
      expect(mockQueryBuilder.buildRecentActivitiesQuery).toHaveBeenCalledWith(
        10,
        true
      );
    });

    it("should retrieve recent activities with custom limit", async () => {
      const limit = 5;
      const mockActivities = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        action: `action_${i}`,
        description: `Description ${i}`,
      }));

      mockQueryBuilder.buildRecentActivitiesQuery.mockReturnValue(
        mockActivities
      );

      const result = await ActivityRetrievalService.getRecentActivities(
        limit,
        false
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
      expect(mockQueryBuilder.buildRecentActivitiesQuery).toHaveBeenCalledWith(
        5,
        false
      );
    });

    it("should handle empty recent activities", async () => {
      mockQueryBuilder.buildRecentActivitiesQuery.mockReturnValue([]);

      const result = await ActivityRetrievalService.getRecentActivities();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("Error handling", () => {
    it("should handle unexpected errors in all methods", async () => {
      const error = new Error("Unexpected error");

      mockFilters.validateAndSanitize.mockImplementation(() => {
        throw error;
      });

      const result = await ActivityRetrievalService.getActivityLogs();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unexpected error");
      expect(mockWinstonLogger.error).toHaveBeenCalled();
    });
  });

  describe("Performance with large datasets", () => {
    it("should handle large datasets efficiently with pagination", async () => {
      const filters = { page: 1, limit: 1000 };
      const mockActivities = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        action: `action_${i}`,
        description: `Description ${i}`,
      }));

      mockFilters.validateAndSanitize.mockReturnValue(filters);
      mockCountQuery.resultSize.mockResolvedValue(100000);
      mockQueryBuilder.applyPagination.mockReturnValue(mockActivities);

      const startTime = Date.now();
      const result = await ActivityRetrievalService.getActivityLogs(filters);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1000);
      expect(result.pagination?.total).toBe(100000);
      expect(result.pagination?.totalPages).toBe(100);

      // Performance expectation: should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("should handle memory efficiently with user activity history", async () => {
      const userId = 1;
      const mockActivities = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        action: `user_action_${i}`,
        description: `User performed action ${i}`,
      }));

      mockFilters.isValidUserId.mockReturnValue(true);
      mockCountQuery.resultSize.mockResolvedValue(50000);
      mockQueryBuilder.applyPagination.mockReturnValue(mockActivities);

      const result = await ActivityRetrievalService.getUserActivityHistory(
        userId,
        { limit: 500 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(500);
      expect(result.pagination?.total).toBe(50000);
    });
  });
});
