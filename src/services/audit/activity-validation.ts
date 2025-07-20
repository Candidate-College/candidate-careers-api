/**
 * Activity Validation Utilities
 *
 * Provides validation and sanitization utilities for activity logging
 * including parameter validation and sensitive data removal.
 *
 * @module services/audit/activity-validation
 */

import { ActivityLogParams } from "./activity-log-service";

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  field?: string;
}

/**
 * Activity Validation Utility Class
 */
export class ActivityValidation {
  /**
   * Validate activity logging parameters
   *
   * @param params - Parameters to validate
   * @returns ValidationResult
   */
  public static validateParams(params: ActivityLogParams): ValidationResult {
    // Check required fields
    const requiredFieldResult = this.validateRequiredFields(params);
    if (!requiredFieldResult.isValid) {
      return requiredFieldResult;
    }

    // Validate field lengths
    const fieldLengthResult = this.validateFieldLengths(params);
    if (!fieldLengthResult.isValid) {
      return fieldLengthResult;
    }

    // Validate optional fields
    const optionalFieldResult = this.validateOptionalFields(params);
    if (!optionalFieldResult.isValid) {
      return optionalFieldResult;
    }

    return { isValid: true };
  }

  /**
   * Validate required fields
   *
   * @param params - Parameters to validate
   * @returns ValidationResult
   */
  private static validateRequiredFields(
    params: ActivityLogParams
  ): ValidationResult {
    if (!params.action) {
      return {
        isValid: false,
        error: "Action is required",
        field: "action",
      };
    }

    if (!params.resourceType) {
      return {
        isValid: false,
        error: "Resource type is required",
        field: "resourceType",
      };
    }

    if (!params.description) {
      return {
        isValid: false,
        error: "Description is required",
        field: "description",
      };
    }

    return { isValid: true };
  }

  /**
   * Validate field lengths
   *
   * @param params - Parameters to validate
   * @returns ValidationResult
   */
  private static validateFieldLengths(
    params: ActivityLogParams
  ): ValidationResult {
    if (params.action.length > 100) {
      return {
        isValid: false,
        error: "Action must be 100 characters or less",
        field: "action",
      };
    }

    if (params.resourceType.length > 100) {
      return {
        isValid: false,
        error: "Resource type must be 100 characters or less",
        field: "resourceType",
      };
    }

    if (params.description.length > 1000) {
      return {
        isValid: false,
        error: "Description must be 1000 characters or less",
        field: "description",
      };
    }

    return { isValid: true };
  }

  /**
   * Validate optional fields
   *
   * @param params - Parameters to validate
   * @returns ValidationResult
   */
  private static validateOptionalFields(
    params: ActivityLogParams
  ): ValidationResult {
    if (params.resourceUuid && !this.isValidUUID(params.resourceUuid)) {
      return {
        isValid: false,
        error: "Resource UUID must be a valid UUID format",
        field: "resourceUuid",
      };
    }

    if (params.ipAddress && !this.isValidIP(params.ipAddress)) {
      return {
        isValid: false,
        error: "IP address must be a valid IPv4 or IPv6 format",
        field: "ipAddress",
      };
    }

    if (params.sessionId && params.sessionId.length > 255) {
      return {
        isValid: false,
        error: "Session ID must be 255 characters or less",
        field: "sessionId",
      };
    }

    if (params.userAgent && params.userAgent.length > 500) {
      return {
        isValid: false,
        error: "User agent must be 500 characters or less",
        field: "userAgent",
      };
    }

    const idValidationResult = this.validateIDs(params);
    if (!idValidationResult.isValid) {
      return idValidationResult;
    }

    return { isValid: true };
  }

  /**
   * Validate ID fields
   *
   * @param params - Parameters to validate
   * @returns ValidationResult
   */
  private static validateIDs(params: ActivityLogParams): ValidationResult {
    if (
      params.resourceId !== undefined &&
      params.resourceId !== null &&
      params.resourceId <= 0
    ) {
      return {
        isValid: false,
        error: "Resource ID must be a positive number",
        field: "resourceId",
      };
    }

    if (
      params.userId !== undefined &&
      params.userId !== null &&
      params.userId <= 0
    ) {
      return {
        isValid: false,
        error: "User ID must be a positive number",
        field: "userId",
      };
    }

    return { isValid: true };
  }

  /**
   * Sanitize parameters for logging (remove sensitive data)
   *
   * @param params - Parameters to sanitize
   * @returns Sanitized parameters
   */
  public static sanitizeParams(
    params: ActivityLogParams
  ): Partial<ActivityLogParams> {
    const sanitized: Partial<ActivityLogParams> = {
      action: params.action,
      resourceType: params.resourceType,
      description: params.description,
      userId: params.userId,
      resourceId: params.resourceId,
      resourceUuid: params.resourceUuid,
      severity: params.severity,
      category: params.category,
      status: params.status,
    };

    // Remove sensitive fields from sanitized output
    // oldValues, newValues, and metadata may contain sensitive information
    // ipAddress and sessionId are also considered sensitive

    return sanitized;
  }

  /**
   * Validate IP address format (IPv4 or IPv6)
   *
   * @param ip - IP address to validate
   * @returns boolean
   */
  private static isValidIP(ip: string): boolean {
    return this.isValidIPv4(ip) || this.isValidIPv6(ip);
  }

  /**
   * Validate IPv4 format
   *
   * @param ip - IP address to validate
   * @returns boolean
   */
  private static isValidIPv4(ip: string): boolean {
    // Simplified IPv4 validation using parts approach
    const parts = ip.split(".");
    if (parts.length !== 4) {
      return false;
    }

    const ipv4Part = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
    return parts.every((part) => ipv4Part.test(part));
  }

  /**
   * Validate IPv6 format
   *
   * @param ip - IP address to validate
   * @returns boolean
   */
  private static isValidIPv6(ip: string): boolean {
    // Simplified IPv6 check for common formats
    if (ip === "::1" || ip === "::") {
      return true;
    }

    const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Pattern.test(ip);
  }

  /**
   * Validate UUID format
   *
   * @param uuid - UUID to validate
   * @returns boolean
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(uuid);
  }

  /**
   * Validate JSON data
   *
   * @param data - Data to validate
   * @returns ValidationResult
   */
  public static validateJSON(data: unknown): ValidationResult {
    if (data === null || data === undefined) {
      return { isValid: true };
    }

    try {
      // Try to serialize and deserialize to check for circular references
      const serialized = JSON.stringify(data);
      JSON.parse(serialized);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error:
          "Invalid JSON data: " +
          (error instanceof Error ? error.message : String(error)),
        field: "json",
      };
    }
  }

  /**
   * Validate required string field
   *
   * @param value - Value to validate
   * @param fieldName - Field name for error reporting
   * @param maxLength - Maximum length allowed
   * @returns ValidationResult
   */
  public static validateRequiredString(
    value: unknown,
    fieldName: string,
    maxLength: number = 255
  ): ValidationResult {
    if (value === null || value === undefined || typeof value !== "string") {
      return {
        isValid: false,
        error: `${fieldName} is required and must be a string`,
        field: fieldName,
      };
    }

    if (value.trim().length === 0) {
      return {
        isValid: false,
        error: `${fieldName} cannot be empty`,
        field: fieldName,
      };
    }

    if (value.length > maxLength) {
      return {
        isValid: false,
        error: `${fieldName} must be ${maxLength} characters or less`,
        field: fieldName,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate optional string field
   *
   * @param value - Value to validate
   * @param fieldName - Field name for error reporting
   * @param maxLength - Maximum length allowed
   * @returns ValidationResult
   */
  public static validateOptionalString(
    value: unknown,
    fieldName: string,
    maxLength: number = 255
  ): ValidationResult {
    if (value === null || value === undefined) {
      return { isValid: true };
    }

    if (typeof value !== "string") {
      return {
        isValid: false,
        error: `${fieldName} must be a string`,
        field: fieldName,
      };
    }

    if (value.length > maxLength) {
      return {
        isValid: false,
        error: `${fieldName} must be ${maxLength} characters or less`,
        field: fieldName,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate positive integer
   *
   * @param value - Value to validate
   * @param fieldName - Field name for error reporting
   * @returns ValidationResult
   */
  public static validatePositiveInteger(
    value: unknown,
    fieldName: string
  ): ValidationResult {
    if (value === null || value === undefined) {
      return { isValid: true };
    }

    if (typeof value !== "number" || !Number.isInteger(value)) {
      return {
        isValid: false,
        error: `${fieldName} must be an integer`,
        field: fieldName,
      };
    }

    if (value <= 0) {
      return {
        isValid: false,
        error: `${fieldName} must be a positive number`,
        field: fieldName,
      };
    }

    return { isValid: true };
  }
}

export default ActivityValidation;
