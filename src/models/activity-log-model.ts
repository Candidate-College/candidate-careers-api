/**
 * Activity Log Model
 *
 * Comprehensive model for activity logging with validation, relationships,
 * and serialization. Supports audit trail requirements with strict validation.
 */

import { User, UserData } from "./user-model";
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
  ActivityAction,
  ResourceType,
} from "@/constants/activity-log-constants";

const Model = require("@/config/database/orm");

/**
 * Activity Log Data Interface
 */
export interface ActivityLogData {
  id: number;
  user_id: number | null;
  session_id?: string | null;
  action: ActivityAction;
  resource_type: ResourceType;
  resource_id?: number | null;
  resource_uuid?: string | null;
  description: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  severity: ActivitySeverity;
  category: ActivityCategory;
  status: ActivityStatus;
  created_at: Date;
  user?: UserData;
}

/**
 * Activity Log Model Class
 */
export class ActivityLog extends Model {
  static readonly tableName = "activity_logs";
  static readonly softDelete = false;

  static readonly relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "activity_logs.user_id",
        to: "users.id",
      },
    },
  };

  /**
   * Validate activity log data
   */
  validate(data: Partial<ActivityLogData>): void {
    this.validateRequiredFields(data);
    this.validateFieldLengths(data);
    this.validateEnums(data);
    this.validateSpecialFormats(data);
    this.validateDataTypes(data);
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(data: Partial<ActivityLogData>): void {
    if (!data.action) {
      throw new Error("Action is required");
    }
    if (!data.resource_type) {
      throw new Error("Resource type is required");
    }
    if (!data.description) {
      throw new Error("Description is required");
    }
    if (!data.category) {
      throw new Error("Category is required");
    }
  }

  /**
   * Validate field lengths
   */
  private validateFieldLengths(data: Partial<ActivityLogData>): void {
    if (data.action && data.action.length > 100) {
      throw new Error("Action must not exceed 100 characters");
    }
    if (data.resource_type && data.resource_type.length > 100) {
      throw new Error("Resource type must not exceed 100 characters");
    }
    if (data.ip_address && data.ip_address.length > 45) {
      throw new Error("IP address must not exceed 45 characters");
    }
  }

  /**
   * Validate enum values
   */
  private validateEnums(data: Partial<ActivityLogData>): void {
    if (
      data.severity &&
      !Object.values(ActivitySeverity).includes(data.severity)
    ) {
      throw new Error("Invalid severity value");
    }
    if (
      data.category &&
      !Object.values(ActivityCategory).includes(data.category)
    ) {
      throw new Error("Invalid category value");
    }
    if (data.status && !Object.values(ActivityStatus).includes(data.status)) {
      throw new Error("Invalid status value");
    }
  }

  /**
   * Validate special formats
   */
  private validateSpecialFormats(data: Partial<ActivityLogData>): void {
    // IP address format validation
    if (data.ip_address && !this.isValidIP(data.ip_address)) {
      throw new Error("Invalid IP address format");
    }

    // UUID format validation
    if (data.resource_uuid && !this.isValidUUID(data.resource_uuid)) {
      throw new Error("Invalid UUID format");
    }

    // Resource ID validation
    if (
      data.resource_id !== null &&
      data.resource_id !== undefined &&
      data.resource_id < 0
    ) {
      throw new Error("Resource ID must be positive");
    }
  }

  /**
   * Validate data types
   */
  private validateDataTypes(data: Partial<ActivityLogData>): void {
    // JSON field validation
    if (data.old_values && typeof data.old_values === "string") {
      throw new Error("old_values must be a valid JSON object");
    }
    if (data.new_values && typeof data.new_values === "string") {
      throw new Error("new_values must be a valid JSON object");
    }
    if (data.metadata && typeof data.metadata === "string") {
      throw new Error("metadata must be a valid JSON object");
    }
  }

  /**
   * Serialize activity log data for API responses
   */
  serialize(data: Partial<ActivityLogData>): Partial<ActivityLogData> {
    return {
      id: data.id,
      user_id: data.user_id,
      session_id: data.session_id,
      action: data.action,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      resource_uuid: data.resource_uuid,
      description: data.description,
      old_values: data.old_values,
      new_values: data.new_values,
      metadata: data.metadata,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      severity: data.severity,
      category: data.category,
      status: data.status,
      created_at: data.created_at,
      user: data.user,
    };
  }

  /**
   * Validate IP address format (IPv4 and IPv6)
   */
  private isValidIP(ip: string): boolean {
    return this.isValidIPv4(ip) || this.isValidIPv6(ip);
  }

  /**
   * Validate IPv4 format
   */
  private isValidIPv4(ip: string): boolean {
    // Simplified IPv4 regex with less complexity
    const ipv4Part = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
    const parts = ip.split(".");

    if (parts.length !== 4) {
      return false;
    }

    return parts.every((part) => ipv4Part.test(part));
  }

  /**
   * Validate IPv6 format
   */
  private isValidIPv6(ip: string): boolean {
    // Simplified IPv6 check
    if (ip === "::1" || ip === "::") {
      return true;
    }

    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Regex.test(ip);
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
