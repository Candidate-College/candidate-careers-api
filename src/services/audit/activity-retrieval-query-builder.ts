/**
 * Activity Retrieval Query Builder Utility
 *
 * Handles query building, filtering, searching, and sorting for activity retrieval operations.
 * Provides optimized query building methods for the retrieval service.
 *
 * @module services/audit/activity-retrieval-query-builder
 */

import { ActivityLog } from "@/models/activity-log-model";
import { QueryBuilder, Model } from "objection";
import { ActivityRetrievalFilters } from "./activity-retrieval-filters";

const BaseModel = require("@/config/database/orm");

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
    query: any,
    filters: ActivityRetrievalFilters
  ): any {
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

    if (filters.resourceId) {
      query = query.where("resource_id", filters.resourceId);
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
   * Apply full-text search to query
   *
   * @param query - Query builder instance
   * @param searchTerm - Search term
   * @returns Modified query builder
   */
  public static applySearch(query: any, searchTerm: string): any {
    const term = `%${searchTerm.toLowerCase()}%`;

    return query.where((builder: any) => {
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
   * @param sortBy - Sort column
   * @param sortOrder - Sort order
   * @returns Modified query builder
   */
  public static applySorting(
    query: any,
    sortBy: string = "created_at",
    sortOrder: "asc" | "desc" = "desc"
  ): any {
    return query.orderBy(sortBy, sortOrder);
  }

  /**
   * Apply pagination to query
   *
   * @param query - Query builder instance
   * @param page - Page number
   * @param limit - Records per page
   * @returns Modified query builder
   */
  public static applyPagination(query: any, page: number, limit: number): any {
    const offset = (page - 1) * limit;
    return query.limit(limit).offset(offset);
  }

  /**
   * Build query for single activity
   *
   * @param id - Activity ID
   * @param includeUser - Include user relationship
   * @returns Query builder for single activity
   */
  public static buildSingleActivityQuery(
    id: number,
    includeUser: boolean = true
  ): any {
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
  ): any {
    let query = ActivityLog.query().where("user_id", userId);

    // Apply additional filters
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
   * Build query for search operations
   *
   * @param searchTerm - Search term
   * @param filters - Additional filters
   * @returns Query builder for search
   */
  public static buildSearchQuery(
    searchTerm: string,
    filters: ActivityRetrievalFilters
  ): any {
    let query = ActivityLog.query();

    // Apply search first
    query = this.applySearch(query, searchTerm);

    // Apply additional filters
    query = this.applyFilters(query, filters);

    // Apply sorting
    query = this.applySorting(query, filters.sortBy, filters.sortOrder);

    // Include user relationship if requested
    if (filters.includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }

  /**
   * Build query for count operations
   *
   * @param filters - Validated filters
   * @returns Query builder for count
   */
  public static buildCountQuery(filters: ActivityRetrievalFilters): any {
    let query = ActivityLog.query();

    // Apply filters
    query = this.applyFilters(query, filters);

    // Apply search if provided
    if (filters.search) {
      query = this.applySearch(query, filters.search);
    }

    return query;
  }

  /**
   * Build query for statistics operations
   *
   * @param filters - Validated filters
   * @returns Query builder for statistics
   */
  public static buildStatisticsQuery(filters: ActivityRetrievalFilters): any {
    let query = ActivityLog.query();

    // Apply filters
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
   * @param limit - Number of activities to retrieve
   * @param includeUser - Include user relationship
   * @returns Query builder for recent activities
   */
  public static buildRecentActivitiesQuery(
    limit: number = 10,
    includeUser: boolean = true
  ): any {
    let query = ActivityLog.query().orderBy("created_at", "desc").limit(limit);

    if (includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }

  /**
   * Build query for date range activities
   *
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @param includeUser - Include user relationship
   * @returns Query builder for date range
   */
  public static buildDateRangeQuery(
    dateFrom: Date,
    dateTo: Date,
    includeUser: boolean = true
  ): any {
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
   * Build query for category-based activities
   *
   * @param category - Activity category
   * @param includeUser - Include user relationship
   * @returns Query builder for category
   */
  public static buildCategoryQuery(
    category: string,
    includeUser: boolean = true
  ): any {
    let query = ActivityLog.query()
      .where("category", category)
      .orderBy("created_at", "desc");

    if (includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }

  /**
   * Build query for severity-based activities
   *
   * @param severity - Activity severity
   * @param includeUser - Include user relationship
   * @returns Query builder for severity
   */
  public static buildSeverityQuery(
    severity: string,
    includeUser: boolean = true
  ): any {
    let query = ActivityLog.query()
      .where("severity", severity)
      .orderBy("created_at", "desc");

    if (includeUser) {
      query = query.withGraphFetched("user");
    }

    return query;
  }
}
