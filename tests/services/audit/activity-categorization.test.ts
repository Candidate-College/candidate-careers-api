/**
 * Activity Categorization Tests
 *
 * Comprehensive test suite for the ActivityCategorization utility class
 * including category detection, severity assignment, and status determination.
 */

import { ActivityCategorization } from "../../../src/services/audit/activity-categorization";
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
  AUTHENTICATION_ACTIONS,
  USER_MANAGEMENT_ACTIONS,
  DATA_MODIFICATION_ACTIONS,
  SYSTEM_ACTIONS,
  SECURITY_ACTIONS,
  AUTHORIZATION_ACTIONS,
} from "../../../src/constants/activity-log-constants";

describe("ActivityCategorization", () => {
  describe("detectCategory", () => {
    it("should detect authentication category", () => {
      expect(
        ActivityCategorization.detectCategory(
          AUTHENTICATION_ACTIONS.LOGIN_SUCCESS
        )
      ).toBe(ActivityCategory.AUTHENTICATION);
      expect(
        ActivityCategorization.detectCategory(
          AUTHENTICATION_ACTIONS.LOGIN_FAILED
        )
      ).toBe(ActivityCategory.AUTHENTICATION);
      expect(
        ActivityCategorization.detectCategory(AUTHENTICATION_ACTIONS.LOGOUT)
      ).toBe(ActivityCategory.AUTHENTICATION);
    });

    it("should detect authorization category", () => {
      expect(
        ActivityCategorization.detectCategory(
          AUTHORIZATION_ACTIONS.ACCESS_GRANTED
        )
      ).toBe(ActivityCategory.AUTHORIZATION);
      expect(
        ActivityCategorization.detectCategory(
          AUTHORIZATION_ACTIONS.ACCESS_DENIED
        )
      ).toBe(ActivityCategory.AUTHORIZATION);
    });

    it("should detect user management category", () => {
      expect(
        ActivityCategorization.detectCategory(
          USER_MANAGEMENT_ACTIONS.USER_CREATED
        )
      ).toBe(ActivityCategory.USER_MANAGEMENT);
      expect(
        ActivityCategorization.detectCategory(
          USER_MANAGEMENT_ACTIONS.USER_UPDATED
        )
      ).toBe(ActivityCategory.USER_MANAGEMENT);
      expect(
        ActivityCategorization.detectCategory(
          USER_MANAGEMENT_ACTIONS.USER_DELETED
        )
      ).toBe(ActivityCategory.USER_MANAGEMENT);
    });

    it("should detect data modification category", () => {
      expect(
        ActivityCategorization.detectCategory(
          DATA_MODIFICATION_ACTIONS.RECORD_CREATED
        )
      ).toBe(ActivityCategory.DATA_MODIFICATION);
      expect(
        ActivityCategorization.detectCategory(
          DATA_MODIFICATION_ACTIONS.RECORD_UPDATED
        )
      ).toBe(ActivityCategory.DATA_MODIFICATION);
      expect(
        ActivityCategorization.detectCategory(
          DATA_MODIFICATION_ACTIONS.BULK_OPERATION
        )
      ).toBe(ActivityCategory.DATA_MODIFICATION);
    });

    it("should detect system category", () => {
      expect(
        ActivityCategorization.detectCategory(SYSTEM_ACTIONS.SYSTEM_STARTED)
      ).toBe(ActivityCategory.SYSTEM);
      expect(
        ActivityCategorization.detectCategory(SYSTEM_ACTIONS.SYSTEM_STOPPED)
      ).toBe(ActivityCategory.SYSTEM);
      expect(
        ActivityCategorization.detectCategory(
          SYSTEM_ACTIONS.CONFIGURATION_CHANGED
        )
      ).toBe(ActivityCategory.SYSTEM);
    });

    it("should detect security category", () => {
      expect(
        ActivityCategorization.detectCategory(SECURITY_ACTIONS.SECURITY_ALERT)
      ).toBe(ActivityCategory.SECURITY);
      expect(
        ActivityCategorization.detectCategory(
          SECURITY_ACTIONS.INTRUSION_DETECTED
        )
      ).toBe(ActivityCategory.SECURITY);
      expect(
        ActivityCategorization.detectCategory(
          SECURITY_ACTIONS.SUSPICIOUS_ACTIVITY
        )
      ).toBe(ActivityCategory.SECURITY);
    });

    it("should default to system category for unknown actions", () => {
      expect(ActivityCategorization.detectCategory("unknown_action")).toBe(
        ActivityCategory.SYSTEM
      );
      expect(ActivityCategorization.detectCategory("")).toBe(
        ActivityCategory.SYSTEM
      );
      expect(ActivityCategorization.detectCategory("custom_action")).toBe(
        ActivityCategory.SYSTEM
      );
    });
  });

  describe("getSeverityForAction", () => {
    it("should assign critical severity to critical actions", () => {
      expect(
        ActivityCategorization.getSeverityForAction(
          SECURITY_ACTIONS.INTRUSION_DETECTED
        )
      ).toBe(ActivitySeverity.CRITICAL);
      expect(
        ActivityCategorization.getSeverityForAction(
          SECURITY_ACTIONS.VULNERABILITY_DETECTED
        )
      ).toBe(ActivitySeverity.CRITICAL);
      expect(
        ActivityCategorization.getSeverityForAction(
          SYSTEM_ACTIONS.SYSTEM_STOPPED
        )
      ).toBe(ActivitySeverity.CRITICAL);
      expect(
        ActivityCategorization.getSeverityForAction(
          AUTHENTICATION_ACTIONS.ACCOUNT_LOCKED
        )
      ).toBe(ActivitySeverity.CRITICAL);
    });

    it("should assign high severity to high-risk actions", () => {
      expect(
        ActivityCategorization.getSeverityForAction(
          SECURITY_ACTIONS.SECURITY_ALERT
        )
      ).toBe(ActivitySeverity.HIGH);
      expect(
        ActivityCategorization.getSeverityForAction(
          SECURITY_ACTIONS.SUSPICIOUS_ACTIVITY
        )
      ).toBe(ActivitySeverity.HIGH);
      expect(
        ActivityCategorization.getSeverityForAction(
          AUTHENTICATION_ACTIONS.LOGIN_FAILED
        )
      ).toBe(ActivitySeverity.HIGH);
      expect(
        ActivityCategorization.getSeverityForAction(
          USER_MANAGEMENT_ACTIONS.USER_DELETED
        )
      ).toBe(ActivitySeverity.HIGH);
      expect(
        ActivityCategorization.getSeverityForAction(
          DATA_MODIFICATION_ACTIONS.BULK_OPERATION
        )
      ).toBe(ActivitySeverity.HIGH);
    });

    it("should assign medium severity to medium-risk actions", () => {
      expect(
        ActivityCategorization.getSeverityForAction(
          AUTHENTICATION_ACTIONS.LOGIN_SUCCESS
        )
      ).toBe(ActivitySeverity.MEDIUM);
      expect(
        ActivityCategorization.getSeverityForAction(
          AUTHENTICATION_ACTIONS.PASSWORD_CHANGE
        )
      ).toBe(ActivitySeverity.MEDIUM);
      expect(
        ActivityCategorization.getSeverityForAction(
          USER_MANAGEMENT_ACTIONS.USER_CREATED
        )
      ).toBe(ActivitySeverity.MEDIUM);
      expect(
        ActivityCategorization.getSeverityForAction(
          USER_MANAGEMENT_ACTIONS.USER_UPDATED
        )
      ).toBe(ActivitySeverity.MEDIUM);
      expect(
        ActivityCategorization.getSeverityForAction(
          DATA_MODIFICATION_ACTIONS.RECORD_CREATED
        )
      ).toBe(ActivitySeverity.MEDIUM);
      expect(
        ActivityCategorization.getSeverityForAction(
          DATA_MODIFICATION_ACTIONS.RECORD_UPDATED
        )
      ).toBe(ActivitySeverity.MEDIUM);
    });

    it("should default to low severity for unknown actions", () => {
      expect(
        ActivityCategorization.getSeverityForAction("unknown_action")
      ).toBe(ActivitySeverity.LOW);
      expect(ActivityCategorization.getSeverityForAction("")).toBe(
        ActivitySeverity.LOW
      );
      expect(ActivityCategorization.getSeverityForAction("custom_action")).toBe(
        ActivitySeverity.LOW
      );
    });
  });

  describe("getStatusForAction", () => {
    it("should assign failure status to failed actions", () => {
      expect(
        ActivityCategorization.getStatusForAction(
          AUTHENTICATION_ACTIONS.LOGIN_FAILED
        )
      ).toBe(ActivityStatus.FAILURE);
      expect(
        ActivityCategorization.getStatusForAction(
          AUTHORIZATION_ACTIONS.ACCESS_DENIED
        )
      ).toBe(ActivityStatus.FAILURE);
    });

    it("should assign error status to error actions", () => {
      expect(
        ActivityCategorization.getStatusForAction(
          SECURITY_ACTIONS.INTRUSION_DETECTED
        )
      ).toBe(ActivityStatus.ERROR);
      expect(
        ActivityCategorization.getStatusForAction(
          SECURITY_ACTIONS.VULNERABILITY_DETECTED
        )
      ).toBe(ActivityStatus.ERROR);
    });

    it("should default to success status for other actions", () => {
      expect(
        ActivityCategorization.getStatusForAction(
          AUTHENTICATION_ACTIONS.LOGIN_SUCCESS
        )
      ).toBe(ActivityStatus.SUCCESS);
      expect(
        ActivityCategorization.getStatusForAction(
          USER_MANAGEMENT_ACTIONS.USER_CREATED
        )
      ).toBe(ActivityStatus.SUCCESS);
      expect(ActivityCategorization.getStatusForAction("unknown_action")).toBe(
        ActivityStatus.SUCCESS
      );
    });
  });

  describe("getCategorization", () => {
    it("should return complete categorization for known actions", () => {
      const categorization = ActivityCategorization.getCategorization(
        AUTHENTICATION_ACTIONS.LOGIN_SUCCESS
      );

      expect(categorization).toEqual({
        category: ActivityCategory.AUTHENTICATION,
        severity: ActivitySeverity.MEDIUM,
        status: ActivityStatus.SUCCESS,
      });
    });

    it("should return complete categorization for security actions", () => {
      const categorization = ActivityCategorization.getCategorization(
        SECURITY_ACTIONS.INTRUSION_DETECTED
      );

      expect(categorization).toEqual({
        category: ActivityCategory.SECURITY,
        severity: ActivitySeverity.CRITICAL,
        status: ActivityStatus.ERROR,
      });
    });

    it("should return complete categorization for unknown actions", () => {
      const categorization =
        ActivityCategorization.getCategorization("unknown_action");

      expect(categorization).toEqual({
        category: ActivityCategory.SYSTEM,
        severity: ActivitySeverity.LOW,
        status: ActivityStatus.SUCCESS,
      });
    });
  });

  describe("isValidAction", () => {
    it("should return true for valid actions", () => {
      expect(
        ActivityCategorization.isValidAction(
          AUTHENTICATION_ACTIONS.LOGIN_SUCCESS
        )
      ).toBe(true);
      expect(
        ActivityCategorization.isValidAction(
          USER_MANAGEMENT_ACTIONS.USER_CREATED
        )
      ).toBe(true);
      expect(
        ActivityCategorization.isValidAction(SECURITY_ACTIONS.SECURITY_ALERT)
      ).toBe(true);
      expect(
        ActivityCategorization.isValidAction(SYSTEM_ACTIONS.SYSTEM_STARTED)
      ).toBe(true);
      expect(
        ActivityCategorization.isValidAction(
          DATA_MODIFICATION_ACTIONS.RECORD_CREATED
        )
      ).toBe(true);
      expect(
        ActivityCategorization.isValidAction(
          AUTHORIZATION_ACTIONS.ACCESS_GRANTED
        )
      ).toBe(true);
    });

    it("should return false for invalid actions", () => {
      expect(ActivityCategorization.isValidAction("invalid_action")).toBe(
        false
      );
      expect(ActivityCategorization.isValidAction("")).toBe(false);
      expect(ActivityCategorization.isValidAction("custom_action")).toBe(false);
    });
  });

  describe("display name methods", () => {
    describe("getSeverityDisplayName", () => {
      it("should return correct display names for severity levels", () => {
        expect(
          ActivityCategorization.getSeverityDisplayName(
            ActivitySeverity.CRITICAL
          )
        ).toBe("Critical");
        expect(
          ActivityCategorization.getSeverityDisplayName(ActivitySeverity.HIGH)
        ).toBe("High");
        expect(
          ActivityCategorization.getSeverityDisplayName(ActivitySeverity.MEDIUM)
        ).toBe("Medium");
        expect(
          ActivityCategorization.getSeverityDisplayName(ActivitySeverity.LOW)
        ).toBe("Low");
      });

      it("should return Unknown for invalid severity", () => {
        expect(
          ActivityCategorization.getSeverityDisplayName(
            "invalid" as ActivitySeverity
          )
        ).toBe("Unknown");
      });
    });

    describe("getCategoryDisplayName", () => {
      it("should return correct display names for categories", () => {
        expect(
          ActivityCategorization.getCategoryDisplayName(
            ActivityCategory.AUTHENTICATION
          )
        ).toBe("Authentication");
        expect(
          ActivityCategorization.getCategoryDisplayName(
            ActivityCategory.AUTHORIZATION
          )
        ).toBe("Authorization");
        expect(
          ActivityCategorization.getCategoryDisplayName(
            ActivityCategory.USER_MANAGEMENT
          )
        ).toBe("User Management");
        expect(
          ActivityCategorization.getCategoryDisplayName(
            ActivityCategory.DATA_MODIFICATION
          )
        ).toBe("Data Modification");
        expect(
          ActivityCategorization.getCategoryDisplayName(ActivityCategory.SYSTEM)
        ).toBe("System");
        expect(
          ActivityCategorization.getCategoryDisplayName(
            ActivityCategory.SECURITY
          )
        ).toBe("Security");
      });

      it("should return Unknown for invalid category", () => {
        expect(
          ActivityCategorization.getCategoryDisplayName(
            "invalid" as ActivityCategory
          )
        ).toBe("Unknown");
      });
    });

    describe("getStatusDisplayName", () => {
      it("should return correct display names for status", () => {
        expect(
          ActivityCategorization.getStatusDisplayName(ActivityStatus.SUCCESS)
        ).toBe("Success");
        expect(
          ActivityCategorization.getStatusDisplayName(ActivityStatus.FAILURE)
        ).toBe("Failure");
        expect(
          ActivityCategorization.getStatusDisplayName(ActivityStatus.ERROR)
        ).toBe("Error");
      });

      it("should return Unknown for invalid status", () => {
        expect(
          ActivityCategorization.getStatusDisplayName(
            "invalid" as ActivityStatus
          )
        ).toBe("Unknown");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty string actions", () => {
      const categorization = ActivityCategorization.getCategorization("");
      expect(categorization.category).toBe(ActivityCategory.SYSTEM);
      expect(categorization.severity).toBe(ActivitySeverity.LOW);
      expect(categorization.status).toBe(ActivityStatus.SUCCESS);
    });

    it("should handle null/undefined actions gracefully", () => {
      expect(() =>
        ActivityCategorization.detectCategory(null as any)
      ).not.toThrow();
      expect(() =>
        ActivityCategorization.getSeverityForAction(undefined as any)
      ).not.toThrow();
    });

    it("should be case sensitive for action matching", () => {
      expect(ActivityCategorization.detectCategory("LOGIN_SUCCESS")).toBe(
        ActivityCategory.SYSTEM
      ); // Should not match case-sensitive constant
      expect(
        ActivityCategorization.detectCategory(
          AUTHENTICATION_ACTIONS.LOGIN_SUCCESS
        )
      ).toBe(ActivityCategory.AUTHENTICATION); // Should match exact constant
    });
  });
});
