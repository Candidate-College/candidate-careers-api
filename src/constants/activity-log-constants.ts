/**
 * Activity Log Constants
 *
 * Centralized constants for activity logging system including
 * severity levels, categories, statuses, and action types.
 * Maintains consistency across the application.
 */

/**
 * Activity severity levels
 */
export enum ActivitySeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Activity categories for logical grouping
 */
export enum ActivityCategory {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  USER_MANAGEMENT = "user_management",
  DATA_MODIFICATION = "data_modification",
  SYSTEM = "system",
  SECURITY = "security",
}

/**
 * Activity status indicating operation result
 */
export enum ActivityStatus {
  SUCCESS = "success",
  FAILURE = "failure",
  ERROR = "error",
}

/**
 * Authentication-related actions
 */
export const AUTHENTICATION_ACTIONS = {
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  TOKEN_REFRESH: "token_refresh",
  PASSWORD_CHANGE: "password_change",
  PASSWORD_RESET: "password_reset",
  ACCOUNT_LOCKED: "account_locked",
  EMAIL_VERIFICATION: "email_verification",
} as const;

/**
 * User management actions
 */
export const USER_MANAGEMENT_ACTIONS = {
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  ROLE_ASSIGNED: "role_assigned",
  ROLE_REMOVED: "role_removed",
  PERMISSION_GRANTED: "permission_granted",
  PERMISSION_REVOKED: "permission_revoked",
  USER_IMPERSONATED: "user_impersonated",
} as const;

/**
 * Data modification actions
 */
export const DATA_MODIFICATION_ACTIONS = {
  RECORD_CREATED: "record_created",
  RECORD_UPDATED: "record_updated",
  RECORD_DELETED: "record_deleted",
  BULK_OPERATION: "bulk_operation",
  DATA_IMPORTED: "data_imported",
  DATA_EXPORTED: "data_exported",
} as const;

/**
 * System-level actions
 */
export const SYSTEM_ACTIONS = {
  SYSTEM_STARTED: "system_started",
  SYSTEM_STOPPED: "system_stopped",
  CONFIGURATION_CHANGED: "configuration_changed",
  BACKUP_CREATED: "backup_created",
  BACKUP_RESTORED: "backup_restored",
  MAINTENANCE_MODE: "maintenance_mode",
} as const;

/**
 * Security-related actions
 */
export const SECURITY_ACTIONS = {
  SECURITY_ALERT: "security_alert",
  INTRUSION_DETECTED: "intrusion_detected",
  FIREWALL_BLOCKED: "firewall_blocked",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  SECURITY_SCAN: "security_scan",
  VULNERABILITY_DETECTED: "vulnerability_detected",
} as const;

/**
 * Authorization-related actions
 */
export const AUTHORIZATION_ACTIONS = {
  ACCESS_GRANTED: "access_granted",
  ACCESS_DENIED: "access_denied",
  PERMISSION_CHECKED: "permission_checked",
  ROLE_VERIFIED: "role_verified",
  TOKEN_VALIDATED: "token_validated",
  RESOURCE_ACCESSED: "resource_accessed",
} as const;

/**
 * All action types combined for validation
 */
export const ALL_ACTIONS = {
  ...AUTHENTICATION_ACTIONS,
  ...USER_MANAGEMENT_ACTIONS,
  ...DATA_MODIFICATION_ACTIONS,
  ...SYSTEM_ACTIONS,
  ...SECURITY_ACTIONS,
  ...AUTHORIZATION_ACTIONS,
} as const;

/**
 * Type for all valid action values
 */
export type ActivityAction = (typeof ALL_ACTIONS)[keyof typeof ALL_ACTIONS];

/**
 * Activity logging defaults
 */
export const ACTIVITY_DEFAULTS = {
  SEVERITY: ActivitySeverity.MEDIUM,
  STATUS: ActivityStatus.SUCCESS,
  RETENTION_DAYS: 2555,
  DELETION_DAYS: 3650,
  BUFFER_SIZE: 1000,
  EXPORT_MAX_RECORDS: 100000,
  SUSPICIOUS_THRESHOLD: 10,
} as const;

/**
 * Resource types for activity logging
 */
export const RESOURCE_TYPES = {
  USER: "user",
  ROLE: "role",
  PERMISSION: "permission",
  SESSION: "session",
  JOB_POSTING: "job_posting",
  APPLICATION: "application",
  DEPARTMENT: "department",
  JOB_CATEGORY: "job_category",
  SYSTEM_SETTING: "system_setting",
  AUDIT_LOG: "audit_log",
} as const;

/**
 * Type for all valid resource types
 */
export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];
