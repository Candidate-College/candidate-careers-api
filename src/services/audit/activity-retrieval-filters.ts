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

    this.sanitizePagination(sanitized);
    this.sanitizeSorting(sanitized);
    this.sanitizeDates(sanitized);
    this.sanitizeEnumValues(sanitized);

    return sanitized;
  }

  /**
   * Sanitize pagination parameters
   *
   * @param filters - Filters to sanitize
   */
  private static sanitizePagination(filters: ActivityRetrievalFilters): void {
    // Validate and sanitize pagination
    if (filters.page !== undefined && filters.page <= 0) {
      filters.page = this.DEFAULT_PAGE;
    }

    if (filters.limit) {
      if (filters.limit <= 0) {
        filters.limit = this.DEFAULT_LIMIT;
      } else if (filters.limit > this.MAX_LIMIT) {
        filters.limit = this.MAX_LIMIT;
      }
    }
  }

  /**
   * Sanitize sorting parameters
   *
   * @param filters - Filters to sanitize
   */
  private static sanitizeSorting(filters: ActivityRetrievalFilters): void {
    // Validate sort field
    if (filters.sortBy && !this.VALID_SORT_FIELDS.includes(filters.sortBy)) {
      filters.sortBy = "created_at";
    }

    // Validate sort order
    if (filters.sortOrder && !["asc", "desc"].includes(filters.sortOrder)) {
      filters.sortOrder = "desc";
    }
  }

  /**
   * Sanitize date parameters
   *
   * @param filters - Filters to sanitize
   */
  private static sanitizeDates(filters: ActivityRetrievalFilters): void {
    filters.dateFrom = this.sanitizeDate(filters.dateFrom);
    filters.dateTo = this.sanitizeDate(filters.dateTo);
  }

  /**
   * Sanitize a date value
   *
   * @param dateValue - Date value to sanitize
   * @returns Sanitized date or undefined
   */
  private static sanitizeDate(dateValue?: Date | string): Date | undefined {
    if (!dateValue) {
      return undefined;
    }

    if (typeof dateValue === "string") {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return undefined;
      }
      return date;
    }

    return dateValue;
  }

  /**
   * Sanitize enum values
   *
   * @param filters - Filters to sanitize
   */
  private static sanitizeEnumValues(filters: ActivityRetrievalFilters): void {
    // Validate enum values
    if (
      filters.category &&
      !Object.values(ActivityCategory).includes(filters.category)
    ) {
      delete filters.category;
    }

    if (
      filters.severity &&
      !Object.values(ActivitySeverity).includes(filters.severity)
    ) {
      delete filters.severity;
    }

    if (
      filters.status &&
      !Object.values(ActivityStatus).includes(filters.status)
    ) {
      delete filters.status;
    }
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
