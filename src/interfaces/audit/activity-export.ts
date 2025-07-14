/**
 * Activity Export Service – Shared Interfaces
 *
 * Houses TypeScript interfaces used by `ActivityExportService` to enforce
 * type-safety across layers while keeping the service file itself lean.
 *
 * @module interfaces/audit/activity-export
 */

import {
  ActivityCategory,
  ActivitySeverity,
} from "@/constants/activity-log-constants";

/**
 * Optional filters supported by export operations.
 */
export interface ActivityExportFilters {
  userId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  severity?: ActivitySeverity;
  category?: ActivityCategory;
}

/**
 * Result returned by each export method.
 */
export interface ActivityExportResult {
  buffer: Buffer;
  byteLength: number;
  totalRows: number;
  format: "csv" | "json" | "xlsx";
}
