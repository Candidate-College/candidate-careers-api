/**
 * Activity Log Service
 *
 * Core service for activity logging with comprehensive audit trail functionality.
 * Handles activity categorization, severity assignment, and database persistence.
 *
 * @module services/audit/activity-log-service
 */

import { ActivityLog, ActivityLogData } from "@/models/activity-log-model";
import { UserData } from "@/models/user-model";
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
  ActivityAction,
  ResourceType,
} from "@/constants/activity-log-constants";
import { defaultWinstonLogger } from "@/utilities/winston-logger";
import { ActivityCategorization } from "./activity-categorization";
import { ActivityValidation } from "./activity-validation";
import { ActivityMetadataUtils } from "./activity-metadata";

/**
 * Activity logging parameters interface
 */
export interface ActivityLogParams {
  userId?: number | null;
  sessionId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: number | null;
  resourceUuid?: string | null;
  description: string;
  oldValues?: any | null;
  newValues?: any | null;
  metadata?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity?: ActivitySeverity;
  category?: ActivityCategory;
  status?: ActivityStatus;
}

/**
 * Activity logging result interface
 */
export interface ActivityLogResult {
  success: boolean;
  activityId?: number;
  error?: string;
  message?: string;
}

/**
 * Activity Log Service Class
 */
export class ActivityLogService {
  /**
   * Core activity logging method
   *
   * @param params - Activity logging parameters
   * @returns Promise<ActivityLogResult>
   */
  public static async logActivity(
    params: ActivityLogParams
  ): Promise<ActivityLogResult> {
    try {
      // Validate required parameters
      const validationResult = ActivityValidation.validateParams(params);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      // Apply categorization logic
      const categorizedParams = this.applyCategorization(params);

      // Collect automatic metadata
      const enrichedParams =
        ActivityMetadataUtils.collectMetadata(categorizedParams);

      // Create activity log record
      const activityLog = await ActivityLog.query().insert({
        user_id: enrichedParams.userId,
        session_id: enrichedParams.sessionId,
        action: enrichedParams.action,
        resource_type: enrichedParams.resourceType,
        resource_id: enrichedParams.resourceId,
        resource_uuid: enrichedParams.resourceUuid,
        description: enrichedParams.description,
        old_values: enrichedParams.oldValues,
        new_values: enrichedParams.newValues,
        metadata: enrichedParams.metadata,
        ip_address: enrichedParams.ipAddress,
        user_agent: enrichedParams.userAgent,
        severity: enrichedParams.severity,
        category: enrichedParams.category,
        status: enrichedParams.status,
        created_at: new Date(),
      });

      // Log to Winston
      await defaultWinstonLogger.asyncInfo("Activity logged successfully", {
        activityId: activityLog.id,
        action: enrichedParams.action,
        userId: enrichedParams.userId || undefined,
        severity: enrichedParams.severity,
        category: enrichedParams.category,
      });

      return {
        success: true,
        activityId: activityLog.id,
        message: "Activity logged successfully",
      };
    } catch (error) {
      // Log error to Winston
      await defaultWinstonLogger.asyncError("Failed to log activity", {
        error: error instanceof Error ? error.message : String(error),
        params: ActivityValidation.sanitizeParams(params),
      });

      return {
        success: false,
        error: "Failed to log activity",
      };
    }
  }

  /**
   * Log user-specific actions
   *
   * @param user - User data
   * @param action - Action performed
   * @param resourceType - Resource type affected
   * @param description - Action description
   * @param additionalParams - Additional parameters
   * @returns Promise<ActivityLogResult>
   */
  public static async logUserAction(
    user: UserData,
    action: string,
    resourceType: string,
    description: string,
    additionalParams: Partial<ActivityLogParams> = {}
  ): Promise<ActivityLogResult> {
    const params: ActivityLogParams = {
      userId: user.id,
      action,
      resourceType,
      description,
      category: ActivityCategory.USER_MANAGEMENT,
      severity: ActivityCategorization.getSeverityForAction(action),
      ...additionalParams,
    };

    return this.logActivity(params);
  }

  /**
   * Log system events
   *
   * @param action - System action
   * @param description - Event description
   * @param additionalParams - Additional parameters
   * @returns Promise<ActivityLogResult>
   */
  public static async logSystemEvent(
    action: string,
    description: string,
    additionalParams: Partial<ActivityLogParams> = {}
  ): Promise<ActivityLogResult> {
    const params: ActivityLogParams = {
      userId: null, // System events don't have a user
      action,
      resourceType: "system",
      description,
      category: ActivityCategory.SYSTEM,
      severity: ActivityCategorization.getSeverityForAction(action),
      ...additionalParams,
    };

    return this.logActivity(params);
  }

  /**
   * Log security events
   *
   * @param action - Security action
   * @param description - Event description
   * @param severity - Security severity level
   * @param additionalParams - Additional parameters
   * @returns Promise<ActivityLogResult>
   */
  public static async logSecurityEvent(
    action: string,
    description: string,
    severity: ActivitySeverity = ActivitySeverity.HIGH,
    additionalParams: Partial<ActivityLogParams> = {}
  ): Promise<ActivityLogResult> {
    const params: ActivityLogParams = {
      action,
      resourceType: "security",
      description,
      category: ActivityCategory.SECURITY,
      severity,
      ...additionalParams,
    };

    return this.logActivity(params);
  }

  /**
   * Log authentication events
   *
   * @param userId - User ID (if applicable)
   * @param action - Authentication action
   * @param description - Event description
   * @param sessionId - Session ID (if applicable)
   * @param additionalParams - Additional parameters
   * @returns Promise<ActivityLogResult>
   */
  public static async logAuthenticationEvent(
    userId: number | null,
    action: string,
    description: string,
    sessionId?: string,
    additionalParams: Partial<ActivityLogParams> = {}
  ): Promise<ActivityLogResult> {
    const params: ActivityLogParams = {
      userId,
      sessionId,
      action,
      resourceType: "authentication",
      description,
      category: ActivityCategory.AUTHENTICATION,
      severity: ActivityCategorization.getSeverityForAction(action),
      ...additionalParams,
    };

    return this.logActivity(params);
  }

  /**
   * Apply categorization logic to parameters
   *
   * @param params - Original parameters
   * @returns ActivityLogParams with applied categorization
   */
  private static applyCategorization(
    params: ActivityLogParams
  ): ActivityLogParams {
    // Auto-detect category if not provided
    if (!params.category) {
      params.category = ActivityCategorization.detectCategory(params.action);
    }

    // Auto-assign severity if not provided
    if (!params.severity) {
      params.severity = ActivityCategorization.getSeverityForAction(
        params.action
      );
    }

    // Auto-assign status if not provided
    if (!params.status) {
      params.status = ActivityCategorization.getStatusForAction(params.action);
    }

    return params;
  }

  /**
   * Bulk log multiple activities
   *
   * @param activities - Array of activity parameters
   * @returns Promise<ActivityLogResult[]>
   */
  public static async logBulkActivities(
    activities: ActivityLogParams[]
  ): Promise<ActivityLogResult[]> {
    const results: ActivityLogResult[] = [];

    for (const activity of activities) {
      const result = await this.logActivity(activity);
      results.push(result);
    }

    return results;
  }

  /**
   * Get activity logging statistics
   *
   * @returns Promise<object>
   */
  public static async getLoggingStatistics(): Promise<{
    totalActivities: number;
    successRate: number;
    categoryCounts: Record<string, number>;
    severityCounts: Record<string, number>;
  }> {
    try {
      const totalActivities = await ActivityLog.query().count().first();
      const successCount = await ActivityLog.query()
        .where("status", ActivityStatus.SUCCESS)
        .count()
        .first();

      const categoryStats = await ActivityLog.query()
        .select("category")
        .count("id as count")
        .groupBy("category");

      const severityStats = await ActivityLog.query()
        .select("severity")
        .count("id as count")
        .groupBy("severity");

      const categoryCounts: Record<string, number> = {};
      categoryStats.forEach((stat: any) => {
        categoryCounts[stat.category] = parseInt(stat.count);
      });

      const severityCounts: Record<string, number> = {};
      severityStats.forEach((stat: any) => {
        severityCounts[stat.severity] = parseInt(stat.count);
      });

      return {
        totalActivities: parseInt(totalActivities?.count || "0"),
        successRate:
          (parseInt(successCount?.count || "0") /
            parseInt(totalActivities?.count || "1")) *
          100,
        categoryCounts,
        severityCounts,
      };
    } catch (error) {
      await defaultWinstonLogger.asyncError(
        "Failed to get logging statistics",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return {
        totalActivities: 0,
        successRate: 0,
        categoryCounts: {},
        severityCounts: {},
      };
    }
  }
}

export default ActivityLogService;
