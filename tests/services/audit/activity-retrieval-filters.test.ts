/**
 * Activity Retrieval Filters Tests
 *
 * Comprehensive test suite for activity retrieval filters utility
 * covering validation, sanitization, and helper methods.
 */

import { ActivityRetrievalFilters } from "@/services/audit/activity-retrieval-filters";
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
} from "@/constants/activity-log-constants";

describe("ActivityRetrievalFilters", () => {
  describe("validateAndSanitize", () => {
    it("should validate and sanitize valid filters", () => {
      const filters = {
        userId: 1,
        category: ActivityCategory.AUTHENTICATION,
        severity: ActivitySeverity.HIGH,
        status: ActivityStatus.SUCCESS,
        page: 2,
        limit: 25,
        sortBy: "created_at",
        sortOrder: "desc" as const,
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.userId).toBe(1);
      expect(result.category).toBe(ActivityCategory.AUTHENTICATION);
      expect(result.severity).toBe(ActivitySeverity.HIGH);
      expect(result.status).toBe(ActivityStatus.SUCCESS);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
      expect(result.sortBy).toBe("created_at");
      expect(result.sortOrder).toBe("desc");
      expect(result.dateFrom).toBeInstanceOf(Date);
      expect(result.dateTo).toBeInstanceOf(Date);
    });

    it("should set default values for invalid pagination", () => {
      const filters = {
        page: -1,
        limit: -10,
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it("should enforce maximum limit", () => {
      const filters = {
        limit: 2000,
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.limit).toBe(1000);
    });

    it("should set default sort field for invalid sortBy", () => {
      const filters = {
        sortBy: "invalid_field",
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.sortBy).toBe("created_at");
    });

    it("should set default sort order for invalid sortOrder", () => {
      const filters = {
        sortOrder: "invalid_order" as any,
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.sortOrder).toBe("desc");
    });

    it("should remove invalid date strings", () => {
      const filters = {
        dateFrom: "invalid-date",
        dateTo: "not-a-date",
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.dateFrom).toBeUndefined();
      expect(result.dateTo).toBeUndefined();
    });

    it("should remove invalid enum values", () => {
      const filters = {
        category: "invalid_category" as any,
        severity: "invalid_severity" as any,
        status: "invalid_status" as any,
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.category).toBeUndefined();
      expect(result.severity).toBeUndefined();
      expect(result.status).toBeUndefined();
    });

    it("should handle empty filters object", () => {
      const filters = {};

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result).toEqual({});
    });

    it("should preserve valid date objects", () => {
      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-12-31");
      const filters = {
        dateFrom,
        dateTo,
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.dateFrom).toBe(dateFrom);
      expect(result.dateTo).toBe(dateTo);
    });

    it("should handle null and undefined values", () => {
      const filters = {
        userId: null,
        resourceId: undefined,
        sessionId: null,
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.userId).toBeNull();
      expect(result.resourceId).toBeUndefined();
      expect(result.sessionId).toBeNull();
    });
  });

  describe("getDefaultPagination", () => {
    it("should return default pagination values", () => {
      const pagination = ActivityRetrievalFilters.getDefaultPagination();

      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(50);
    });
  });

  describe("getMaxLimit", () => {
    it("should return maximum limit value", () => {
      const maxLimit = ActivityRetrievalFilters.getMaxLimit();

      expect(maxLimit).toBe(1000);
    });
  });

  describe("getValidSortFields", () => {
    it("should return valid sort fields", () => {
      const sortFields = ActivityRetrievalFilters.getValidSortFields();

      expect(sortFields).toContain("id");
      expect(sortFields).toContain("created_at");
      expect(sortFields).toContain("action");
      expect(sortFields).toContain("resource_type");
      expect(sortFields).toContain("severity");
      expect(sortFields).toContain("category");
      expect(sortFields).toContain("status");
      expect(sortFields).toHaveLength(7);
    });
  });

  describe("isValidDateRange", () => {
    it("should validate valid date range", () => {
      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-12-31");

      const result = ActivityRetrievalFilters.isValidDateRange(
        dateFrom,
        dateTo
      );

      expect(result).toBe(true);
    });

    it("should validate valid date range with strings", () => {
      const dateFrom = "2024-01-01";
      const dateTo = "2024-12-31";

      const result = ActivityRetrievalFilters.isValidDateRange(
        dateFrom,
        dateTo
      );

      expect(result).toBe(true);
    });

    it("should reject invalid date range", () => {
      const dateFrom = new Date("2024-12-31");
      const dateTo = new Date("2024-01-01");

      const result = ActivityRetrievalFilters.isValidDateRange(
        dateFrom,
        dateTo
      );

      expect(result).toBe(false);
    });

    it("should accept missing dates", () => {
      expect(
        ActivityRetrievalFilters.isValidDateRange(undefined, undefined)
      ).toBe(true);
      expect(
        ActivityRetrievalFilters.isValidDateRange(new Date(), undefined)
      ).toBe(true);
      expect(
        ActivityRetrievalFilters.isValidDateRange(undefined, new Date())
      ).toBe(true);
    });
  });

  describe("isValidUserId", () => {
    it("should validate positive user ID", () => {
      expect(ActivityRetrievalFilters.isValidUserId(1)).toBe(true);
      expect(ActivityRetrievalFilters.isValidUserId(100)).toBe(true);
    });

    it("should accept null and undefined", () => {
      expect(ActivityRetrievalFilters.isValidUserId(null)).toBe(true);
      expect(ActivityRetrievalFilters.isValidUserId(undefined)).toBe(true);
    });

    it("should reject invalid user IDs", () => {
      expect(ActivityRetrievalFilters.isValidUserId(-1)).toBe(false);
      expect(ActivityRetrievalFilters.isValidUserId(0)).toBe(false);
      expect(ActivityRetrievalFilters.isValidUserId(1.5)).toBe(false);
    });
  });

  describe("isValidResourceId", () => {
    it("should validate positive resource ID", () => {
      expect(ActivityRetrievalFilters.isValidResourceId(1)).toBe(true);
      expect(ActivityRetrievalFilters.isValidResourceId(100)).toBe(true);
    });

    it("should accept null and undefined", () => {
      expect(ActivityRetrievalFilters.isValidResourceId(null)).toBe(true);
      expect(ActivityRetrievalFilters.isValidResourceId(undefined)).toBe(true);
    });

    it("should reject invalid resource IDs", () => {
      expect(ActivityRetrievalFilters.isValidResourceId(-1)).toBe(false);
      expect(ActivityRetrievalFilters.isValidResourceId(0)).toBe(false);
      expect(ActivityRetrievalFilters.isValidResourceId(2.5)).toBe(false);
    });
  });

  describe("isValidSearchTerm", () => {
    it("should validate non-empty search terms", () => {
      expect(ActivityRetrievalFilters.isValidSearchTerm("login")).toBe(true);
      expect(ActivityRetrievalFilters.isValidSearchTerm("user action")).toBe(
        true
      );
      expect(ActivityRetrievalFilters.isValidSearchTerm("a")).toBe(true);
    });

    it("should accept undefined search term", () => {
      expect(ActivityRetrievalFilters.isValidSearchTerm(undefined)).toBe(true);
    });

    it("should reject empty search terms", () => {
      expect(ActivityRetrievalFilters.isValidSearchTerm("")).toBe(false);
      expect(ActivityRetrievalFilters.isValidSearchTerm("   ")).toBe(false);
    });
  });

  describe("sanitizeSearchTerm", () => {
    it("should sanitize valid search terms", () => {
      expect(ActivityRetrievalFilters.sanitizeSearchTerm("login")).toBe(
        "login"
      );
      expect(
        ActivityRetrievalFilters.sanitizeSearchTerm("  user action  ")
      ).toBe("user action");
    });

    it("should return undefined for invalid search terms", () => {
      expect(ActivityRetrievalFilters.sanitizeSearchTerm("")).toBeUndefined();
      expect(
        ActivityRetrievalFilters.sanitizeSearchTerm("   ")
      ).toBeUndefined();
      expect(
        ActivityRetrievalFilters.sanitizeSearchTerm(undefined)
      ).toBeUndefined();
    });
  });

  describe("isValidEnumValue", () => {
    it("should validate valid enum values", () => {
      expect(
        ActivityRetrievalFilters.isValidEnumValue(
          ActivityCategory.AUTHENTICATION,
          ActivityCategory
        )
      ).toBe(true);
      expect(
        ActivityRetrievalFilters.isValidEnumValue(
          ActivitySeverity.HIGH,
          ActivitySeverity
        )
      ).toBe(true);
    });

    it("should reject invalid enum values", () => {
      expect(
        ActivityRetrievalFilters.isValidEnumValue(
          "invalid_category" as any,
          ActivityCategory
        )
      ).toBe(false);
      expect(
        ActivityRetrievalFilters.isValidEnumValue(
          "invalid_severity" as any,
          ActivitySeverity
        )
      ).toBe(false);
    });

    it("should accept undefined/null values", () => {
      expect(
        ActivityRetrievalFilters.isValidEnumValue(undefined, ActivityCategory)
      ).toBe(true);
      expect(
        ActivityRetrievalFilters.isValidEnumValue(null, ActivityCategory)
      ).toBe(true);
    });
  });

  describe("Edge cases and complex scenarios", () => {
    it("should handle mixed valid and invalid filters", () => {
      const filters = {
        userId: 1,
        category: ActivityCategory.AUTHENTICATION,
        severity: "invalid_severity" as any,
        page: -1,
        limit: 25,
        sortBy: "invalid_field",
        sortOrder: "asc" as const,
        dateFrom: "2024-01-01",
        dateTo: "invalid-date",
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.userId).toBe(1);
      expect(result.category).toBe(ActivityCategory.AUTHENTICATION);
      expect(result.severity).toBeUndefined();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
      expect(result.sortBy).toBe("created_at");
      expect(result.sortOrder).toBe("asc");
      expect(result.dateFrom).toBeInstanceOf(Date);
      expect(result.dateTo).toBeUndefined();
    });

    it("should handle all boundary values", () => {
      const filters = {
        page: 0,
        limit: 999,
        sortBy: "id",
        sortOrder: "asc" as const,
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(999);
      expect(result.sortBy).toBe("id");
      expect(result.sortOrder).toBe("asc");
    });

    it("should preserve all valid fields", () => {
      const filters = {
        userId: 1,
        sessionId: "session123",
        action: "login",
        resourceType: "user",
        resourceId: 100,
        resourceUuid: "uuid-123",
        category: ActivityCategory.AUTHENTICATION,
        severity: ActivitySeverity.HIGH,
        status: ActivityStatus.SUCCESS,
        ipAddress: "192.168.1.1",
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
        search: "login",
        page: 1,
        limit: 50,
        sortBy: "created_at",
        sortOrder: "desc" as const,
        includeUser: true,
      };

      const result = ActivityRetrievalFilters.validateAndSanitize(filters);

      expect(result).toEqual(filters);
    });
  });
});
