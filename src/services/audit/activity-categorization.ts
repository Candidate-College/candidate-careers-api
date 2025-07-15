/**
 * Activity Categorization Utilities
 *
 * Provides categorization logic for activity logging including category detection,
 * severity assignment, and status determination based on action types.
 *
 * @module services/audit/activity-categorization
 */

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
  ALL_ACTIONS,
} from "@/constants/activity-log-constants";

/**
 * Activity categorization interface
 */
export interface ActivityCategorization {
  category: ActivityCategory;
  severity: ActivitySeverity;
  status: ActivityStatus;
}

/**
 * Activity Categorization Utility Class
 */
export class ActivityCategorization {
  /**
   * Detect activity category based on action
   *
   * @param action - Action to categorize
   * @returns ActivityCategory
   */
  public static detectCategory(action: string): ActivityCategory {
    if (Object.values(AUTHENTICATION_ACTIONS).includes(action as any)) {
      return ActivityCategory.AUTHENTICATION;
    }
    if (Object.values(AUTHORIZATION_ACTIONS).includes(action as any)) {
      return ActivityCategory.AUTHORIZATION;
    }
    if (Object.values(USER_MANAGEMENT_ACTIONS).includes(action as any)) {
      return ActivityCategory.USER_MANAGEMENT;
    }
    if (Object.values(DATA_MODIFICATION_ACTIONS).includes(action as any)) {
      return ActivityCategory.DATA_MODIFICATION;
    }
    if (Object.values(SYSTEM_ACTIONS).includes(action as any)) {
      return ActivityCategory.SYSTEM;
    }
    if (Object.values(SECURITY_ACTIONS).includes(action as any)) {
      return ActivityCategory.SECURITY;
    }

    // Default to system if unknown
    return ActivityCategory.SYSTEM;
  }

  /**
   * Get severity level for action
   *
   * @param action - Action to evaluate
   * @returns ActivitySeverity
   */
  public static getSeverityForAction(action: string): ActivitySeverity {
    // Critical actions
    const criticalActions = [
      SECURITY_ACTIONS.INTRUSION_DETECTED,
      SECURITY_ACTIONS.VULNERABILITY_DETECTED,
      SYSTEM_ACTIONS.SYSTEM_STOPPED,
      AUTHENTICATION_ACTIONS.ACCOUNT_LOCKED,
    ];

    // High severity actions
    const highActions = [
      SECURITY_ACTIONS.SECURITY_ALERT,
      SECURITY_ACTIONS.SUSPICIOUS_ACTIVITY,
      AUTHENTICATION_ACTIONS.LOGIN_FAILED,
      USER_MANAGEMENT_ACTIONS.USER_DELETED,
      DATA_MODIFICATION_ACTIONS.BULK_OPERATION,
    ];

    // Medium severity actions
    const mediumActions = [
      AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
      AUTHENTICATION_ACTIONS.PASSWORD_CHANGE,
      USER_MANAGEMENT_ACTIONS.USER_CREATED,
      USER_MANAGEMENT_ACTIONS.USER_UPDATED,
      DATA_MODIFICATION_ACTIONS.RECORD_CREATED,
      DATA_MODIFICATION_ACTIONS.RECORD_UPDATED,
    ];

    if (criticalActions.includes(action as any)) {
      return ActivitySeverity.CRITICAL;
    }
    if (highActions.includes(action as any)) {
      return ActivitySeverity.HIGH;
    }
    if (mediumActions.includes(action as any)) {
      return ActivitySeverity.MEDIUM;
    }

    // Default to low
    return ActivitySeverity.LOW;
  }

  /**
   * Get status for action
   *
   * @param action - Action to evaluate
   * @returns ActivityStatus
   */
  public static getStatusForAction(action: string): ActivityStatus {
    // Failed actions
    const failedActions = [
      AUTHENTICATION_ACTIONS.LOGIN_FAILED,
      AUTHORIZATION_ACTIONS.ACCESS_DENIED,
    ];

    // Error actions
    const errorActions = [
      SECURITY_ACTIONS.INTRUSION_DETECTED,
      SECURITY_ACTIONS.VULNERABILITY_DETECTED,
    ];

    if (failedActions.includes(action as any)) {
      return ActivityStatus.FAILURE;
    }
    if (errorActions.includes(action as any)) {
      return ActivityStatus.ERROR;
    }

    // Default to success
    return ActivityStatus.SUCCESS;
  }

  /**
   * Get complete categorization for action
   *
   * @param action - Action to categorize
   * @returns ActivityCategorization
   */
  public static getCategorization(action: string): ActivityCategorization {
    return {
      category: this.detectCategory(action),
      severity: this.getSeverityForAction(action),
      status: this.getStatusForAction(action),
    };
  }

  /**
   * Validate action against known actions
   *
   * @param action - Action to validate
   * @returns boolean
   */
  public static isValidAction(action: string): boolean {
    return Object.values(ALL_ACTIONS).includes(action as any);
  }

  /**
   * Get severity level display name
   *
   * @param severity - Severity level
   * @returns string
   */
  public static getSeverityDisplayName(severity: ActivitySeverity): string {
    switch (severity) {
      case ActivitySeverity.CRITICAL:
        return "Critical";
      case ActivitySeverity.HIGH:
        return "High";
      case ActivitySeverity.MEDIUM:
        return "Medium";
      case ActivitySeverity.LOW:
        return "Low";
      default:
        return "Unknown";
    }
  }

  /**
   * Get category display name
   *
   * @param category - Activity category
   * @returns string
   */
  public static getCategoryDisplayName(category: ActivityCategory): string {
    switch (category) {
      case ActivityCategory.AUTHENTICATION:
        return "Authentication";
      case ActivityCategory.AUTHORIZATION:
        return "Authorization";
      case ActivityCategory.USER_MANAGEMENT:
        return "User Management";
      case ActivityCategory.DATA_MODIFICATION:
        return "Data Modification";
      case ActivityCategory.SYSTEM:
        return "System";
      case ActivityCategory.SECURITY:
        return "Security";
      default:
        return "Unknown";
    }
  }

  /**
   * Get status display name
   *
   * @param status - Activity status
   * @returns string
   */
  public static getStatusDisplayName(status: ActivityStatus): string {
    switch (status) {
      case ActivityStatus.SUCCESS:
        return "Success";
      case ActivityStatus.FAILURE:
        return "Failure";
      case ActivityStatus.ERROR:
        return "Error";
      default:
        return "Unknown";
    }
  }
}

export default ActivityCategorization;
