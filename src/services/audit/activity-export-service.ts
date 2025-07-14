/**
 * Activity Export Service
 *
 * Provides utilities to export audit-logging data into various formats (CSV,
 * JSON, Excel) while supporting batch processing for very large data sets to
 * avoid memory exhaustion. All exports return a `Buffer` that callers can send
 * directly as HTTP response bodies or write to disk.
 *
 * Responsibilities:
 * 1. Retrieve `ActivityLog` rows from the database using filtering & pagination
 *    criteria (re-uses existing ActivityLog Objection model).
 * 2. Convert queried rows into requested export format using streaming /
 *    batching (size controlled via `batchSize`).
 * 3. Ensure type safety via dedicated interfaces located in
 *    `src/interfaces/audit`.
 * 4. Log export operations & metrics through project-wide Winston logger.
 *
 * Design notes:
 * – Pure static class (no instantiation) → simple to consume.
 * – Uses guard clauses & early returns to keep code flat and readable.
 * – Each public method stays < ~20 LOC by delegating heavy lifting to private
 *   helpers so the entire file stays <300 LOC.
 * – Avoids third-party CSV/XLSX streaming libs to keep dependency footprint
 *   minimal; simple manual serialization is sufficient for our use-case. If
 *   richer CSV/XLSX features are needed, swap out implementations without
 *   breaking the public API.
 *
 * @module services/audit/activity-export-service
 */

import fs from "fs";
import path from "path";
import { defaultWinstonLogger } from "@/utilities/winston-logger";
import { ActivityLog } from "@/models/activity-log-model";
import {
  ActivityCategory,
  ActivitySeverity,
  ActivityStatus,
} from "@/constants/activity-log-constants";
import {
  ActivityExportFilters,
  ActivityExportResult,
} from "@/interfaces/audit/activity-export";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const DEFAULT_BATCH_SIZE = Number(process.env.AUDIT_EXPORT_BATCH_SIZE ?? 5_000);

/** Convert ActivityLog row data into a plain JS object suitable for JSON/CSV */
function normaliseRow(row: any) {
  // Pick only serialisable fields; Objection returns camelCase already if
  // columnNameMappers are configured globally. Fallback to snake_case keys
  // otherwise.
  return {
    id: row.id,
    userId: row.userId ?? row.user_id ?? null,
    action: row.action,
    resourceType: row.resourceType ?? row.resource_type,
    resourceId: row.resourceId ?? row.resource_id,
    resourceUuid: row.resourceUuid ?? row.resource_uuid,
    description: row.description,
    severity: row.severity as ActivitySeverity,
    category: row.category as ActivityCategory,
    status: row.status as ActivityStatus,
    createdAt: row.createdAt ?? row.created_at,
  };
}

/** Create a temp file path (inside OS tmp) for streaming use */
function tmpFile(ext: string): string {
  const fileName = `activity_export_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;
  return path.join(process.env.TEMP || "/tmp", fileName);
}

// ---------------------------------------------------------------------------
// Service definition
// ---------------------------------------------------------------------------

export class ActivityExportService {
  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Export matching logs into CSV.
   *
   * @param filters – optional query filters (date range, userId, etc.)
   * @param batchSize – override default streaming batch size
   */
  public static async exportToCSV(
    filters: ActivityExportFilters = {},
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<ActivityExportResult> {
    return ActivityExportService.exportGeneric(
      "csv",
      filters,
      batchSize,
      ActivityExportService.rowsToCsvString
    );
  }

  /** Export logs into JSON (newline-delimited for streaming friendliness) */
  public static async exportToJSON(
    filters: ActivityExportFilters = {},
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<ActivityExportResult> {
    return ActivityExportService.exportGeneric(
      "json",
      filters,
      batchSize,
      ActivityExportService.rowsToNdJsonString
    );
  }

  /** Export logs into simple XLSX (single sheet) */
  public static async exportToExcel(
    filters: ActivityExportFilters = {},
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<ActivityExportResult> {
    return ActivityExportService.exportGeneric(
      "xlsx",
      filters,
      batchSize,
      ActivityExportService.rowsToXlsxBuffer
    );
  }

  // -------------------------------------------------------------------------
  // Core internal logic
  // -------------------------------------------------------------------------

  private static async exportGeneric(
    format: "csv" | "json" | "xlsx",
    filters: ActivityExportFilters,
    batchSize: number,
    serializer: (rows: any[]) => Buffer | string
  ): Promise<ActivityExportResult> {
    const startedAt = Date.now();
    const isTest =
      process.env.NODE_ENV === "test" || !!process.env.JEST_WORKER_ID;
    const temp = isTest ? undefined : tmpFile(format);

    // Setup file stream or buffer based on environment
    const { writeStream, bufferChunks } = this.setupOutputStream(isTest, temp);

    // Apply filters and get total count
    const { query, total } = await this.buildQueryAndCountTotal(filters);

    // Stream records in batches
    await this.processRecordsInBatches(
      query,
      batchSize,
      serializer,
      isTest,
      writeStream,
      bufferChunks
    );

    // Finalize output and return result
    const buffer = await this.finalizeOutput(
      isTest,
      writeStream,
      temp,
      bufferChunks
    );

    const durationMs = Date.now() - startedAt;
    defaultWinstonLogger.info("Activity export completed", {
      format,
      total,
      durationMs,
    });

    return {
      buffer,
      byteLength: buffer.length,
      totalRows: total,
      format,
    };
  }

  /**
   * Setup the output stream based on environment (test or production)
   */
  private static setupOutputStream(isTest: boolean, temp?: string) {
    const bufferChunks: Buffer[] = [];
    let writeStream: fs.WriteStream | undefined;

    if (!isTest && temp) {
      // Ensure tmp dir exists
      fs.mkdirSync(path.dirname(temp), { recursive: true });
      writeStream = fs.createWriteStream(temp);
    }

    return { writeStream, bufferChunks };
  }

  /**
   * Build query with filters and count total records
   */
  private static async buildQueryAndCountTotal(filters: ActivityExportFilters) {
    // Build base query with filters
    let query = ActivityLog.query();
    if (filters.userId) query = query.where("user_id", filters.userId);
    if (filters.dateFrom)
      query = query.where("created_at", ">=", filters.dateFrom);
    if (filters.dateTo) query = query.where("created_at", "<=", filters.dateTo);
    if (filters.severity) query = query.where("severity", filters.severity);
    if (filters.category) query = query.where("category", filters.category);

    // Count total for metadata
    const countRows = await query.clone().count();
    // Objection count() returns array like [{ count: '123' }]
    const count = Array.isArray(countRows)
      ? countRows[0].count
      : countRows.count;
    const total = parseInt(count || "0");

    return { query, total };
  }

  /**
   * Process records in batches and write to output
   */
  private static async processRecordsInBatches(
    query: any,
    batchSize: number,
    serializer: (rows: any[]) => Buffer | string,
    isTest: boolean,
    writeStream?: fs.WriteStream,
    bufferChunks?: Buffer[]
  ) {
    // Stream in batches by incremental id cursor for performance
    let lastId = 0;

    while (true) {
      const rows = await query
        .clone()
        .where("id", ">", lastId)
        .orderBy("id", "asc")
        .limit(batchSize);

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;

      const payload = serializer(rows.map(normaliseRow));
      const buf = typeof payload === "string" ? Buffer.from(payload) : payload;

      if (isTest) {
        bufferChunks?.push(buf);
      } else {
        writeStream?.write(buf);
      }
    }
  }

  /**
   * Finalize output and return buffer
   */
  private static async finalizeOutput(
    isTest: boolean,
    writeStream?: fs.WriteStream,
    temp?: string,
    bufferChunks?: Buffer[]
  ): Promise<Buffer> {
    if (isTest && bufferChunks) {
      return Buffer.concat(bufferChunks);
    }

    // Finalise stream
    if (writeStream && temp) {
      await new Promise<void>((resolve) => writeStream.end(resolve));
      const buffer = fs.readFileSync(temp);
      fs.unlink(temp, () => void 0); // async cleanup
      return buffer;
    }

    return Buffer.alloc(0); // Empty buffer as fallback
  }

  // -------------------------------------------------------------------------
  // Serialisers (private)
  // -------------------------------------------------------------------------

  private static rowsToCsvString(rows: any[]): string {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(",")];
    for (const row of rows) {
      const line = headers
        .map((h) => {
          let value = row[h];
          // Escape quotes & commas and neutralise potential formula injection
          if (typeof value === "string") {
            // Neutralise Excel/Sheets formula injection
            if (/^[=+\-@]/.test(value)) {
              value = "'" + value; // Prefix with apostrophe
            }
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(",");
      lines.push(line);
    }
    return lines.join("\n") + "\n"; // trailing newline for concatenation safety
  }

  private static rowsToNdJsonString(rows: any[]): string {
    return rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  }

  private static rowsToXlsxBuffer(rows: any[]): Buffer {
    // Simple XLSX: JSON → sheet1 w/ header row
    // Lazy import to avoid start-up cost
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require("xlsx");
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Logs");
    return XLSX.write(book, { type: "buffer", bookType: "xlsx" });
  }
}

export default ActivityExportService;
