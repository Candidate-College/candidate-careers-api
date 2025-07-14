/**
 * Activity Retrieval Filters Utility
 *
 * Handles validation, sanitization, and processing of activity retrieval filters.
 * Provides clean, validated filters for the retrieval service.
 *
 * @module services/audit/activity-retrieval-filters
 */

import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
} from "@/constants/activity-log-constants";

/**
 * Activity retrieval filter parameters interface
 */
export interface ActivityRetrievalFilters {
  userId?: number | null;
  sessionId?: string | null;
  action?: string;
  resourceType?: string;
  resourceId?: number | null;
  resourceUuid?: string | null;
  category?: ActivityCategory;
  severity?: ActivitySeverity;
  status?: ActivityStatus;
  ipAddress?: string | null;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeUser?: boolean;
}

/**
 * Activity Retrieval Filters Utility Class
 *
 * Handles validation, sanitization, and processing of filter parameters
 * for activity retrieval operations.
 */
export class ActivityRetrievalFilters {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 1000;
  private static readonly VALID_SORT_FIELDS = [
    "id",
    "created_at",
    "action",
    "resource_type",
    "severity",
    "category",
    "status",
  ];

  /**
   * Validate and sanitize filter parameters
   *
   * @param filters - Raw filter parameters
   * @returns Validated and sanitized filters
   */
  public static validateAndSanitize(
    filters: ActivityRetrievalFilters
  ): ActivityRetrievalFilters {
    const sanitized: ActivityRetrievalFilters = { ...filters };

    // Validate and sanitize pagination
    if (sanitized.page !== undefined && sanitized.page <= 0) {
      sanitized.page = this.DEFAULT_PAGE;
    }

    if (sanitized.limit) {
      if (sanitized.limit <= 0) {
        sanitized.limit = this.DEFAULT_LIMIT;
      } else if (sanitized.limit > this.MAX_LIMIT) {
        sanitized.limit = this.MAX_LIMIT;
      }
    }

    // Validate sort field
    if (
      sanitized.sortBy &&
      !this.VALID_SORT_FIELDS.includes(sanitized.sortBy)
    ) {
      sanitized.sortBy = "created_at";
    }

    // Validate sort order
    if (sanitized.sortOrder && !["asc", "desc"].includes(sanitized.sortOrder)) {
      sanitized.sortOrder = "desc";
    }

    // Validate dates
    if (sanitized.dateFrom && typeof sanitized.dateFrom === "string") {
      const date = new Date(sanitized.dateFrom);
      if (isNaN(date.getTime())) {
        delete sanitized.dateFrom;
      } else {
        sanitized.dateFrom = date;
      }
    }

    if (sanitized.dateTo && typeof sanitized.dateTo === "string") {
      const date = new Date(sanitized.dateTo);
      if (isNaN(date.getTime())) {
        delete sanitized.dateTo;
      } else {
        sanitized.dateTo = date;
      }
    }

    // Validate enum values
    if (
      sanitized.category &&
      !Object.values(ActivityCategory).includes(sanitized.category)
    ) {
      delete sanitized.category;
    }

    if (
      sanitized.severity &&
      !Object.values(ActivitySeverity).includes(sanitized.severity)
    ) {
      delete sanitized.severity;
    }

    if (
      sanitized.status &&
      !Object.values(ActivityStatus).includes(sanitized.status)
    ) {
      delete sanitized.status;
    }

    return sanitized;
  }

  /**
   * Get default pagination values
   *
   * @returns Default pagination configuration
   */
  public static getDefaultPagination(): { page: number; limit: number } {
    return {
      page: this.DEFAULT_PAGE,
      limit: this.DEFAULT_LIMIT,
    };
  }

  /**
   * Get maximum limit value
   *
   * @returns Maximum limit value
   */
  public static getMaxLimit(): number {
    return this.MAX_LIMIT;
  }

  /**
   * Get valid sort fields
   *
   * @returns Array of valid sort fields
   */
  public static getValidSortFields(): string[] {
    return [...this.VALID_SORT_FIELDS];
  }

  /**
   * Validate date range
   *
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Boolean indicating if date range is valid
   */
  public static isValidDateRange(
    dateFrom?: Date | string,
    dateTo?: Date | string
  ): boolean {
    if (!dateFrom || !dateTo) {
      return true; // One or both dates missing is valid
    }

    const from = typeof dateFrom === "string" ? new Date(dateFrom) : dateFrom;
    const to = typeof dateTo === "string" ? new Date(dateTo) : dateTo;

    return from <= to;
  }

  /**
   * Validate user ID
   *
   * @param userId - User ID to validate
   * @returns Boolean indicating if user ID is valid
   */
  public static isValidUserId(userId?: number | null): boolean {
    return (
      userId === null ||
      userId === undefined ||
      (typeof userId === "number" && userId > 0 && Number.isInteger(userId))
    );
  }

  /**
   * Validate resource ID
   *
   * @param resourceId - Resource ID to validate
   * @returns Boolean indicating if resource ID is valid
   */
  public static isValidResourceId(resourceId?: number | null): boolean {
    return (
      resourceId === null ||
      resourceId === undefined ||
      (typeof resourceId === "number" &&
        resourceId > 0 &&
        Number.isInteger(resourceId))
    );
  }

  /**
   * Validate search term
   *
   * @param searchTerm - Search term to validate
   * @returns Boolean indicating if search term is valid
   */
  public static isValidSearchTerm(searchTerm?: string): boolean {
    return (
      searchTerm === undefined ||
      (typeof searchTerm === "string" && searchTerm.trim().length > 0)
    );
  }

  /**
   * Sanitize search term
   *
   * @param searchTerm - Search term to sanitize
   * @returns Sanitized search term
   */
  public static sanitizeSearchTerm(searchTerm?: string): string | undefined {
    if (!searchTerm || typeof searchTerm !== "string") {
      return undefined;
    }

    return searchTerm.trim().length > 0 ? searchTerm.trim() : undefined;
  }

  /**
   * Validate enum value
   *
   * @param value - Value to validate
   * @param enumObject - Enum object to validate against
   * @returns Boolean indicating if value is valid
   */
  public static isValidEnumValue<T>(
    value: T,
    enumObject: Record<string, T>
  ): boolean {
    return !value || Object.values(enumObject).includes(value);
  }
}
