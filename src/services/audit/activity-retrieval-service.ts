/**
 * Activity Retrieval Service
 *
 * Comprehensive service for retrieving, filtering, and searching activity logs.
 * Provides advanced filtering capabilities with pagination, sorting, and full-text search.
 *
 * @module services/audit/activity-retrieval-service
 */

import { ActivityLog } from "@/models/activity-log-model";
import { defaultWinstonLogger } from "@/utilities/winston-logger";
import { ActivityRetrievalFilters } from "./activity-retrieval-filters";
import { ActivityRetrievalQueryBuilder } from "./activity-retrieval-query-builder";

// Re-export interfaces from filters module
export { ActivityRetrievalFilters } from "./activity-retrieval-filters";

/**
 * Activity retrieval result interface
 */
export interface ActivityRetrievalResult {
  success: boolean;
  data?: ActivityLog[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  error?: string;
  message?: string;
}

/**
 * Single activity retrieval result interface
 */
export interface SingleActivityResult {
  success: boolean;
  data?: ActivityLog;
  error?: string;
  message?: string;
}

/**
 * Activity Retrieval Service Class
 *
 * Handles all activity log retrieval operations with advanced filtering,
 * pagination, sorting, and search capabilities.
 */
export class ActivityRetrievalService {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 50;

  /**
   * Retrieve activity logs with advanced filtering capabilities
   *
   * @param filters - Filtering parameters
   * @returns Promise<ActivityRetrievalResult> - Filtered activity logs with pagination
   */
  public static async getActivityLogs(
    filters: ActivityRetrievalFilters = {}
  ): Promise<ActivityRetrievalResult> {
    try {
      // Validate and sanitize filters
      const validatedFilters =
        ActivityRetrievalFilters.validateAndSanitize(filters);

      // Build query
      const query = ActivityRetrievalQueryBuilder.buildQuery(validatedFilters);

      // Count total records for pagination
      const countQuery =
        ActivityRetrievalQueryBuilder.buildCountQuery(validatedFilters);
      const total = await countQuery.resultSize();

      // Apply pagination
      const page = validatedFilters.page || this.DEFAULT_PAGE;
      const limit = validatedFilters.limit || this.DEFAULT_LIMIT;

      const paginatedQuery = ActivityRetrievalQueryBuilder.applyPagination(
        query,
        page,
        limit
      );

      // Execute query
      const activities = await paginatedQuery;

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrevious,
      };

      defaultWinstonLogger.info("Activity logs retrieved successfully", {
        filters: validatedFilters,
        resultCount: activities.length,
        pagination,
      });

      return {
        success: true,
        data: activities,
        pagination,
        message: `Retrieved ${activities.length} activity logs`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      defaultWinstonLogger.error("Failed to retrieve activity logs", {
        error: errorMessage,
        filters,
      });

      return {
        success: false,
        error: errorMessage,
        message: "Failed to retrieve activity logs",
      };
    }
  }

  /**
   * Retrieve activity history for a specific user
   *
   * @param userId - User ID to retrieve history for
   * @param filters - Additional filtering parameters
   * @returns Promise<ActivityRetrievalResult> - User's activity history
   */
  public static async getUserActivityHistory(
    userId: number,
    filters: Omit<ActivityRetrievalFilters, "userId"> = {}
  ): Promise<ActivityRetrievalResult> {
    try {
      if (!ActivityRetrievalFilters.isValidUserId(userId)) {
        return {
          success: false,
          error: "Invalid user ID provided",
          message: "User ID must be a positive number",
        };
      }

      const query = ActivityRetrievalQueryBuilder.buildUserActivityQuery(
        userId,
        filters
      );

      // Apply pagination if provided
      const page = filters.page || this.DEFAULT_PAGE;
      const limit = filters.limit || this.DEFAULT_LIMIT;

      const countQuery = ActivityRetrievalQueryBuilder.buildCountQuery({
        ...filters,
        userId,
      });
      const total = await countQuery.resultSize();

      const paginatedQuery = ActivityRetrievalQueryBuilder.applyPagination(
        query,
        page,
        limit
      );
      const activities = await paginatedQuery;

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      };

      defaultWinstonLogger.info(
        "User activity history retrieved successfully",
        {
          userId,
          resultCount: activities.length,
        }
      );

      return {
        success: true,
        data: activities,
        pagination,
        message: `Retrieved ${activities.length} user activities`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      defaultWinstonLogger.error("Failed to retrieve user activity history", {
        error: errorMessage,
        userId,
        filters,
      });

      return {
        success: false,
        error: errorMessage,
        message: "Failed to retrieve user activity history",
      };
    }
  }

  /**
   * Retrieve a single activity log by ID
   *
   * @param id - Activity log ID
   * @param includeUser - Whether to include user relationship
   * @returns Promise<SingleActivityResult> - Single activity log
   */
  public static async getActivityById(
    id: number,
    includeUser: boolean = true
  ): Promise<SingleActivityResult> {
    try {
      if (!id || id <= 0) {
        return {
          success: false,
          error: "Invalid activity ID provided",
          message: "Activity ID must be a positive number",
        };
      }

      const query = ActivityRetrievalQueryBuilder.buildSingleActivityQuery(
        id,
        includeUser
      );
      const result = await query;
      const activity = Array.isArray(result) ? result[0] : result;

      if (!activity) {
        return {
          success: false,
          error: "Activity not found",
          message: `Activity with ID ${id} not found`,
        };
      }

      defaultWinstonLogger.info("Activity retrieved successfully", {
        activityId: id,
        includeUser,
      });

      return {
        success: true,
        data: activity,
        message: "Activity retrieved successfully",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      defaultWinstonLogger.error("Failed to retrieve activity", {
        error: errorMessage,
        activityId: id,
      });

      return {
        success: false,
        error: errorMessage,
        message: "Failed to retrieve activity",
      };
    }
  }

  /**
   * Search activities with full-text search in descriptions
   *
   * @param searchTerm - Search term
   * @param filters - Additional filtering parameters
   * @returns Promise<ActivityRetrievalResult> - Search results
   */
  public static async searchActivities(
    searchTerm: string,
    filters: Omit<ActivityRetrievalFilters, "search"> = {}
  ): Promise<ActivityRetrievalResult> {
    try {
      const sanitizedSearch =
        ActivityRetrievalFilters.sanitizeSearchTerm(searchTerm);

      if (!sanitizedSearch) {
        return {
          success: false,
          error: "Search term is required",
          message: "Please provide a valid search term",
        };
      }

      const query = ActivityRetrievalQueryBuilder.buildSearchQuery(
        sanitizedSearch,
        filters
      );

      // Apply pagination if provided
      const page = filters.page || this.DEFAULT_PAGE;
      const limit = filters.limit || this.DEFAULT_LIMIT;

      const countQuery = ActivityRetrievalQueryBuilder.buildCountQuery({
        ...filters,
        search: sanitizedSearch,
      });
      const total = await countQuery.resultSize();

      const paginatedQuery = ActivityRetrievalQueryBuilder.applyPagination(
        query,
        page,
        limit
      );
      const activities = await paginatedQuery;

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      };

      defaultWinstonLogger.info("Activity search completed successfully", {
        searchTerm: sanitizedSearch,
        resultCount: activities.length,
      });

      return {
        success: true,
        data: activities,
        pagination,
        message: `Found ${activities.length} activities matching search`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      defaultWinstonLogger.error("Failed to search activities", {
        error: errorMessage,
        searchTerm,
        filters,
      });

      return {
        success: false,
        error: errorMessage,
        message: "Failed to search activities",
      };
    }
  }

  /**
   * Get recent activities with optional limit
   *
   * @param limit - Number of recent activities to retrieve
   * @param includeUser - Whether to include user relationships
   * @returns Promise<ActivityRetrievalResult> - Recent activities
   */
  public static async getRecentActivities(
    limit: number = 10,
    includeUser: boolean = true
  ): Promise<ActivityRetrievalResult> {
    try {
      const query = ActivityRetrievalQueryBuilder.buildRecentActivitiesQuery(
        limit,
        includeUser
      );
      const activities = await query;

      defaultWinstonLogger.info("Recent activities retrieved successfully", {
        limit,
        resultCount: activities.length,
      });

      return {
        success: true,
        data: activities,
        message: `Retrieved ${activities.length} recent activities`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      defaultWinstonLogger.error("Failed to retrieve recent activities", {
        error: errorMessage,
        limit,
      });

      return {
        success: false,
        error: errorMessage,
        message: "Failed to retrieve recent activities",
      };
    }
  }
}
