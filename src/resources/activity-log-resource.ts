/**
 * Activity Log Resource
 *
 * Resource serializer for activity log data with comprehensive
 * sensitive data filtering and clean API response formatting.
 */

import { ActivityLogData } from "@/models/activity-log-model";
import { UserData } from "@/models/user-model";

/**
 * Serialization options for activity log resource
 */
export interface ActivityLogResourceOptions {
  includeUser?: boolean;
  includeIpAddress?: boolean;
  includeSessionId?: boolean;
}

/**
 * Serialized user data for API responses
 */
export interface SerializedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

/**
 * Serialized activity log data for API responses
 */
export interface SerializedActivityLog {
  id: number;
  user_id?: number | null;
  session_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: number | null;
  resource_uuid?: string | null;
  description: string;
  old_values?: any | null;
  new_values?: any | null;
  metadata?: any | null;
  ip_address?: string | null;
  user_agent?: string | null;
  severity: string;
  category: string;
  status: string;
  created_at: string;
  user?: SerializedUser;
}

/**
 * Activity Log Resource Class
 */
export class ActivityLogResource {
  public options: Required<ActivityLogResourceOptions>;

  private static readonly SENSITIVE_FIELDS = [
    "password",
    "token",
    "secret",
    "key",
    "hash",
    "credential",
    "authentication_token",
    "refresh_token",
    "sensitive_token",
    "api_key",
    "private_key",
  ];

  constructor(options: ActivityLogResourceOptions = {}) {
    this.options = {
      includeUser: false,
      includeIpAddress: false,
      includeSessionId: false,
      ...options,
    };
  }

  /**
   * Serialize single activity log
   */
  serialize(data: ActivityLogData): SerializedActivityLog {
    const serialized: SerializedActivityLog = {
      id: data.id,
      action: data.action,
      resource_type: data.resource_type,
      description: data.description,
      severity: data.severity,
      category: data.category,
      status: data.status,
      created_at: this.formatTimestamp(data.created_at),
    };

    // Conditionally include fields based on options
    if (data.user_id !== undefined) {
      serialized.user_id = data.user_id;
    }

    if (this.options.includeSessionId && data.session_id !== undefined) {
      serialized.session_id = data.session_id;
    }

    if (data.resource_id !== undefined) {
      serialized.resource_id = data.resource_id;
    }

    if (data.resource_uuid !== undefined) {
      serialized.resource_uuid = data.resource_uuid;
    }

    if (data.old_values !== undefined) {
      serialized.old_values = this.filterSensitiveData(data.old_values);
    }

    if (data.new_values !== undefined) {
      serialized.new_values = this.filterSensitiveData(data.new_values);
    }

    if (data.metadata !== undefined) {
      serialized.metadata = data.metadata;
    }

    if (this.options.includeIpAddress && data.ip_address !== undefined) {
      serialized.ip_address = data.ip_address;
    }

    if (data.user_agent !== undefined) {
      serialized.user_agent = data.user_agent;
    }

    // Include user data if requested and available
    if (this.options.includeUser && data.user) {
      serialized.user = this.serializeUser(data.user);
    }

    return serialized;
  }

  /**
   * Serialize multiple activity logs
   */
  serializeMany(data: ActivityLogData[]): SerializedActivityLog[] {
    return data.map((item) => this.serialize(item));
  }

  /**
   * Format timestamp to ISO string
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString();
  }

  /**
   * Filter sensitive data from objects
   */
  private filterSensitiveData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Handle malformed JSON strings
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        // Return as-is if not valid JSON
        return data;
      }
    }

    if (typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.filterSensitiveData(item));
    }

    const filtered: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (!this.isSensitiveField(key)) {
        filtered[key] = this.filterSensitiveData(value);
      }
    }

    return filtered;
  }

  /**
   * Check if field name indicates sensitive data
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return ActivityLogResource.SENSITIVE_FIELDS.some((sensitiveField) =>
      lowerFieldName.includes(sensitiveField)
    );
  }

  /**
   * Serialize user data for inclusion in activity log
   */
  private serializeUser(user: UserData): SerializedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name ?? 'admin',
      created_at: this.formatTimestamp(user.created_at),
      updated_at: this.formatTimestamp(user.updated_at),
    };
  }
}
