/**
 * Activity Retrieval Query Builder Utility
 *
 * Handles query building, filtering, searching, and sorting for activity retrieval operations.
 * Provides optimized query building methods for the retrieval service.
 *
 * @module services/audit/activity-retrieval-query-builder
 */

import { ActivityLog } from "@/models/activity-log-model";
import { QueryBuilder } from "objection";
import { ActivityRetrievalFilters } from "./activity-retrieval-filters";

const Model = require("@/config/database/orm");

/**
 * Activity Retrieval Query Builder Utility Class
 *
 * Handles building optimized queries for activity retrieval operations
 * with filtering, searching, and sorting capabilities.
 */
export class ActivityRetrievalQueryBuilder {
  /**
   * Build base query with all filters applied
   *
   * @param filters - Validated filters
   * @returns Query builder with filters applied
   */
  public static buildQuery(filters: ActivityRetrievalFilters): any {
    let query = ActivityLog.query();

    // Apply filters
    query = this.applyFilters(query, filters);

    // Apply search if provided
    if (filters.search) {
      query = this.applySearch(query, filters.search);
    }

    // Apply sorting
    query = this.applySorting(query, filters.sortBy, filters.sortOrder);

    // Include user relationship if requested
    if (filters.includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }

  /**
   * Apply filters to query
   *
   * @param query - Query builder instance
   * @param filters - Validated filters
   * @returns Modified query builder
   */
  public static applyFilters(
    query: QueryBuilder<ActivityLog>,
    filters: ActivityRetrievalFilters
  ): QueryBuilder<ActivityLog> {
    if (filters.userId !== undefined && filters.userId !== null) {
      query = query.where("user_id", filters.userId);
    }

    if (filters.sessionId) {
      query = query.where("session_id", filters.sessionId);
    }

    if (filters.action) {
      query = query.where("action", filters.action);
    }

    if (filters.resourceType) {
      query = query.where("resource_type", filters.resourceType);
    }

    if (filters.resourceId !== undefined && filters.resourceId !== null) {
      query = query.where("resource_id", filters.resourceId);
    }

    if (filters.resourceUuid) {
      query = query.where("resource_uuid", filters.resourceUuid);
    }

    if (filters.category) {
      query = query.where("category", filters.category);
    }

    if (filters.severity) {
      query = query.where("severity", filters.severity);
    }

    if (filters.status) {
      query = query.where("status", filters.status);
    }

    if (filters.ipAddress) {
      query = query.where("ip_address", filters.ipAddress);
    }

    if (filters.dateFrom) {
      query = query.where("created_at", ">=", filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.where("created_at", "<=", filters.dateTo);
    }

    return query;
  }

  /**
   * Apply search to query with full-text search
   *
   * @param query - Query builder instance
   * @param searchTerm - Search term
   * @returns Modified query builder
   */
  public static applySearch(
    query: QueryBuilder<ActivityLog>,
    searchTerm: string
  ): QueryBuilder<ActivityLog> {
    const term = `%${searchTerm.toLowerCase()}%`;

    return query.where((builder) => {
      builder
        .whereRaw("LOWER(description) LIKE ?", [term])
        .orWhereRaw("LOWER(action) LIKE ?", [term])
        .orWhereRaw("LOWER(resource_type) LIKE ?", [term])
        .orWhereRaw("LOWER(category) LIKE ?", [term])
        .orWhereRaw("LOWER(severity) LIKE ?", [term])
        .orWhereRaw("LOWER(status) LIKE ?", [term]);
    });
  }

  /**
   * Apply sorting to query
   *
   * @param query - Query builder instance
   * @param sortBy - Sort field
   * @param sortOrder - Sort order
   * @returns Modified query builder
   */
  public static applySorting(
    query: QueryBuilder<ActivityLog>,
    sortBy: string = "created_at",
    sortOrder: "asc" | "desc" = "desc"
  ): QueryBuilder<ActivityLog> {
    return query.orderBy(sortBy, sortOrder);
  }

  /**
   * Apply pagination to query
   *
   * @param query - Query builder instance
   * @param page - Page number
   * @param limit - Items per page
   * @returns Modified query builder
   */
  public static applyPagination(
    query: QueryBuilder<ActivityLog>,
    page: number,
    limit: number
  ): QueryBuilder<ActivityLog> {
    const offset = (page - 1) * limit;
    return query.offset(offset).limit(limit);
  }

  /**
   * Build query for finding specific activity by ID
   *
   * @param id - Activity ID
   * @param includeUser - Whether to include user relationship
   * @returns Query builder for single activity
   */
  public static buildSingleActivityQuery(
    id: number,
    includeUser: boolean = true
  ): QueryBuilder<ActivityLog> {
    let query = ActivityLog.query().findById(id);

    if (includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }

  /**
   * Build query for user activity history
   *
   * @param userId - User ID
   * @param filters - Additional filters
   * @returns Query builder for user activity history
   */
  public static buildUserActivityQuery(
    userId: number,
    filters: ActivityRetrievalFilters
  ): QueryBuilder<ActivityLog> {
    const userFilters: ActivityRetrievalFilters = {
      ...filters,
      userId,
      includeUser: true,
    };

    return this.buildQuery(userFilters);
  }

  /**
   * Build search query with advanced search capabilities
   *
   * @param searchTerm - Search term
   * @param filters - Additional filters
   * @returns Query builder for search results
   */
  public static buildSearchQuery(
    searchTerm: string,
    filters: ActivityRetrievalFilters
  ): QueryBuilder<ActivityLog> {
    const searchFilters: ActivityRetrievalFilters = {
      ...filters,
      search: searchTerm.trim(),
    };

    return this.buildQuery(searchFilters);
  }

  /**
   * Build count query for pagination
   *
   * @param filters - Filters to apply
   * @returns Query builder for counting records
   */
  public static buildCountQuery(
    filters: ActivityRetrievalFilters
  ): QueryBuilder<ActivityLog> {
    let query = ActivityLog.query();

    // Apply filters (excluding pagination, sorting, and user inclusion)
    query = this.applyFilters(query, filters);

    // Apply search if provided
    if (filters.search) {
      query = this.applySearch(query, filters.search);
    }

    return query;
  }

  /**
   * Build query for activity statistics
   *
   * @param filters - Filters to apply
   * @returns Query builder for statistics
   */
  public static buildStatisticsQuery(
    filters: ActivityRetrievalFilters
  ): QueryBuilder<ActivityLog> {
    let query = ActivityLog.query();

    // Apply filters (excluding pagination, sorting, and user inclusion)
    query = this.applyFilters(query, filters);

    // Apply search if provided
    if (filters.search) {
      query = this.applySearch(query, filters.search);
    }

    return query;
  }

  /**
   * Build query for recent activities
   *
   * @param limit - Number of recent activities to fetch
   * @param includeUser - Whether to include user relationship
   * @returns Query builder for recent activities
   */
  public static buildRecentActivitiesQuery(
    limit: number = 10,
    includeUser: boolean = true
  ): QueryBuilder<ActivityLog> {
    let query = ActivityLog.query().orderBy("created_at", "desc").limit(limit);

    if (includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }

  /**
   * Build query for activities within date range
   *
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @param includeUser - Whether to include user relationship
   * @returns Query builder for date range activities
   */
  public static buildDateRangeQuery(
    dateFrom: Date,
    dateTo: Date,
    includeUser: boolean = true
  ): QueryBuilder<ActivityLog> {
    let query = ActivityLog.query()
      .where("created_at", ">=", dateFrom)
      .where("created_at", "<=", dateTo)
      .orderBy("created_at", "desc");

    if (includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }

  /**
   * Build query for activities by category
   *
   * @param category - Activity category
   * @param includeUser - Whether to include user relationship
   * @returns Query builder for category activities
   */
  public static buildCategoryQuery(
    category: string,
    includeUser: boolean = true
  ): QueryBuilder<ActivityLog> {
    let query = ActivityLog.query()
      .where("category", category)
      .orderBy("created_at", "desc");

    if (includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }

  /**
   * Build query for activities by severity
   *
   * @param severity - Activity severity
   * @param includeUser - Whether to include user relationship
   * @returns Query builder for severity activities
   */
  public static buildSeverityQuery(
    severity: string,
    includeUser: boolean = true
  ): QueryBuilder<ActivityLog> {
    let query = ActivityLog.query()
      .where("severity", severity)
      .orderBy("created_at", "desc");

    if (includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }
}
