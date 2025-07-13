/**
 * Activity Metadata Utilities
 *
 * Provides metadata collection and enrichment utilities for activity logging
 * including automatic metadata generation and data enrichment.
 *
 * @module services/audit/activity-metadata
 */

import { ActivityLogParams } from "./activity-log-service";
import { ActivityCategorization } from "./activity-categorization";

/**
 * Metadata collection interface
 */
export interface ActivityMetadata {
  timestamp: string;
  categorization: {
    category: string;
    severity: string;
    status: string;
  };
  actionInfo: {
    action: string;
    isValidAction: boolean;
  };
  systemInfo?: {
    nodeVersion: string;
    processId: number;
    platform: string;
  };
  requestInfo?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
  [key: string]: any;
}

/**
 * Activity Metadata Utility Class
 */
export class ActivityMetadataUtils {
  /**
   * Collect automatic metadata for activity logging
   *
   * @param params - Activity logging parameters
   * @returns Enriched parameters with metadata
   */
  public static collectMetadata(params: ActivityLogParams): ActivityLogParams {
    // Create metadata object if not exists
    if (!params.metadata) {
      params.metadata = {};
    }

    // Merge with automatic metadata
    const automaticMetadata = this.generateAutomaticMetadata(params);
    params.metadata = {
      ...automaticMetadata,
      ...params.metadata, // User-provided metadata takes precedence
    };

    return params;
  }

  /**
   * Generate automatic metadata
   *
   * @param params - Activity logging parameters
   * @returns ActivityMetadata
   */
  private static generateAutomaticMetadata(
    params: ActivityLogParams
  ): ActivityMetadata {
    const categorization = ActivityCategorization.getCategorization(
      params.action
    );

    const metadata: ActivityMetadata = {
      timestamp: new Date().toISOString(),
      categorization: {
        category: categorization.category,
        severity: categorization.severity,
        status: categorization.status,
      },
      actionInfo: {
        action: params.action,
        isValidAction: ActivityCategorization.isValidAction(params.action),
      },
    };

    // Add system information
    metadata.systemInfo = this.getSystemInfo();

    // Add request information if available
    if (params.userAgent || params.ipAddress || params.sessionId) {
      metadata.requestInfo = {
        userAgent: params.userAgent || undefined,
        ipAddress: params.ipAddress || undefined,
        sessionId: params.sessionId || undefined,
      };
    }

    return metadata;
  }

  /**
   * Get system information
   *
   * @returns System information object
   */
  private static getSystemInfo(): {
    nodeVersion: string;
    processId: number;
    platform: string;
  } {
    return {
      nodeVersion: process.version,
      processId: process.pid,
      platform: process.platform,
    };
  }

  /**
   * Enrich metadata with additional context
   *
   * @param metadata - Existing metadata
   * @param context - Additional context to add
   * @returns Enriched metadata
   */
  public static enrichMetadata(
    metadata: any,
    context: Record<string, any>
  ): any {
    if (!metadata) {
      metadata = {};
    }

    // Add context information
    if (context) {
      metadata.context = {
        ...metadata.context,
        ...context,
      };
    }

    return metadata;
  }

  /**
   * Sanitize metadata for logging (remove sensitive information)
   *
   * @param metadata - Metadata to sanitize
   * @returns Sanitized metadata
   */
  public static sanitizeMetadata(metadata: any): any {
    if (!metadata) {
      return {};
    }

    // Create a copy to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(metadata));

    // Remove sensitive fields recursively
    this.removeSensitiveFields(sanitized);

    return sanitized;
  }

  /**
   * Remove sensitive fields from object recursively
   *
   * @param obj - Object to process
   */
  private static removeSensitiveFields(obj: any): void {
    if (!obj || typeof obj !== "object") {
      return;
    }

    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "credential",
      "auth",
      "authorization",
      "cookie",
      "session",
      "api_key",
      "apikey",
      "access_token",
      "refresh_token",
    ];

    for (const field in obj) {
      if (obj.hasOwnProperty(field)) {
        // Check if field name contains sensitive keywords
        const fieldLower = field.toLowerCase();
        const isSensitive = sensitiveFields.some((sensitive) =>
          fieldLower.includes(sensitive)
        );

        if (isSensitive) {
          obj[field] = "[REDACTED]";
        } else if (typeof obj[field] === "object") {
          // Recursively process nested objects
          this.removeSensitiveFields(obj[field]);
        }
      }
    }
  }

  /**
   * Validate metadata structure
   *
   * @param metadata - Metadata to validate
   * @returns Validation result
   */
  public static validateMetadata(metadata: any): {
    isValid: boolean;
    error?: string;
  } {
    if (!metadata) {
      return { isValid: true };
    }

    try {
      // Check if metadata can be serialized to JSON
      const serialized = JSON.stringify(metadata);

      // Check size limit (1MB)
      if (serialized.length > 1024 * 1024) {
        return {
          isValid: false,
          error: "Metadata exceeds 1MB size limit",
        };
      }

      // Check for circular references by parsing back
      JSON.parse(serialized);

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error:
          "Invalid metadata structure: " +
          (error instanceof Error ? error.message : String(error)),
      };
    }
  }

  /**
   * Merge metadata objects
   *
   * @param base - Base metadata
   * @param additional - Additional metadata to merge
   * @returns Merged metadata
   */
  public static mergeMetadata(base: any, additional: any): any {
    if (!base) {
      return additional || {};
    }

    if (!additional) {
      return base;
    }

    // Deep merge metadata objects
    return this.deepMerge(base, additional);
  }

  /**
   * Deep merge two objects
   *
   * @param target - Target object
   * @param source - Source object
   * @returns Merged object
   */
  private static deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === "object" &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          // Overwrite with source value
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Extract metadata from request object
   *
   * @param request - Request object (Express request-like)
   * @returns Extracted metadata
   */
  public static extractRequestMetadata(request: any): Record<string, any> {
    if (!request) {
      return {};
    }

    const metadata: Record<string, any> = {};

    // Extract basic request information
    if (request.method) {
      metadata.method = request.method;
    }

    if (request.url) {
      metadata.url = request.url;
    }

    if (request.headers) {
      metadata.headers = {
        userAgent: request.headers["user-agent"],
        contentType: request.headers["content-type"],
        acceptLanguage: request.headers["accept-language"],
      };
    }

    if (request.ip) {
      metadata.ip = request.ip;
    }

    if (request.params) {
      metadata.params = request.params;
    }

    if (request.query) {
      metadata.query = request.query;
    }

    // Remove sensitive information
    return this.sanitizeMetadata(metadata);
  }
}

export default ActivityMetadataUtils;
