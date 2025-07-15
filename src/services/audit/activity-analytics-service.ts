/**
 * Activity Analytics Service
 *
 * Provides statistical and analytical insights over activity logs.
 * Includes success rate calculations, category breakdowns, time-based analytics,
 * trend analysis, anomaly detection, dashboard aggregation, and compliance
 * report generation.
 *
 * Design notes:
 * 1. All methods are static to avoid the need for instantiation.
 * 2. Objection.js query builder is leveraged through the ActivityLog model.
 * 3. All heavy lifting is executed at the database level for performance.
 * 4. Functions return strongly-typed results and never expose ORM instances.
 * 5. Guard clauses are used heavily to keep nesting shallow.
 *
 * @module services/audit/activity-analytics-service
 */

import { ActivityLog } from "@/models/activity-log-model";
import {
  ActivityCategory,
  ActivitySeverity,
  ActivityStatus,
} from "@/constants/activity-log-constants";
import { defaultWinstonLogger } from "@/utilities/winston-logger";
import dayjs from "dayjs";

import {
  StatisticsPeriod,
  GroupByOption,
  StatisticsFilters,
  ActivityStatisticsResult,
  DashboardDataResult,
  AnomalyDetectionResult,
  ComplianceReportResult,
} from "@/types/activity-analytics";

export class ActivityAnalyticsService {
  private static readonly DEFAULT_PERIOD: StatisticsPeriod = "month";
  private static readonly MAX_TREND_POINTS = 30;

  /**
   * Calculate statistics over activity logs.
   */
  public static async getActivityStatistics(
    filters: StatisticsFilters = {}
  ): Promise<ActivityStatisticsResult> {
    try {
      const period = filters.period ?? this.DEFAULT_PERIOD;
      const groupBy = filters.groupBy ?? "category";

      // Base query within date range if provided
      let query = ActivityLog.query();
      if (filters.dateFrom) {
        query = query.where(
          "created_at",
          ">=",
          dayjs(filters.dateFrom).toDate()
        );
      }
      if (filters.dateTo) {
        query = query.where(
          "created_at",
          "<=",
          dayjs(filters.dateTo).toDate()
        );
      }

      // Apply period grouping using database date functions
      const periodColumn = this.getPeriodColumn(period);
      const stats = await query
        .selectRaw(`${periodColumn} as period_value`)
        .count("id as count")
        .groupBy("period_value")
        .orderBy("period_value", "asc");

      defaultWinstonLogger.info("Activity statistics generated", {
        filters,
      });

      return {
        success: true,
        data: { groupBy, period, stats },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      defaultWinstonLogger.error("Failed to generate activity statistics", {
        error: message,
      });
      return {
        success: false,
        error: message,
        message: "Failed to generate activity statistics",
      };
    }
  }

  /**
   * Aggregate dashboard data such as totals, success rate, category/severity breakdowns, and recent trend.
   */
  public static async getDashboardData(): Promise<DashboardDataResult> {
    try {
      // Total events
      const totalEvents = await ActivityLog.query().resultSize();
      if (totalEvents === 0) {
        return {
          success: true,
          data: {
            totalEvents: 0,
            successRate: 0,
            categories: {} as any,
            severityBreakdown: {} as any,
            recentTrend: [],
          },
        };
      }

      // Success rate (status = success)
      const successfulEvents = await ActivityLog.query()
        .where("status", ActivityStatus.SUCCESS)
        .resultSize();
      const successRate = (successfulEvents / totalEvents) * 100;

      // Category breakdown
      const categoryRows = await ActivityLog.query()
        .select("category")
        .count("id as count")
        .groupBy("category");
      const categories: Record<ActivityCategory, number> = categoryRows.reduce(
        (acc: any, row: any) => {
          acc[row.category] = Number(row.count);
          return acc;
        },
        {} as Record<ActivityCategory, number>
      );

      // Severity breakdown
      const severityRows = await ActivityLog.query()
        .select("severity")
        .count("id as count")
        .groupBy("severity");
      const severityBreakdown: Record<ActivitySeverity, number> = severityRows.reduce(
        (acc: any, row: any) => {
          acc[row.severity] = Number(row.count);
          return acc;
        },
        {} as Record<ActivitySeverity, number>
      );

      // Recent trend (last N days)
      const fromDate = dayjs().subtract(this.MAX_TREND_POINTS - 1, "day").startOf("day").toDate();
      const trendRows = await ActivityLog.query()
        .selectRaw("DATE(created_at) as date")
        .count("id as count")
        .where("created_at", ">=", fromDate)
        .groupByRaw("DATE(created_at)")
        .orderBy("date", "asc");
      const recentTrend = trendRows.map((row: any) => ({
        date: row.date,
        count: Number(row.count),
      }));

      return {
        success: true,
        data: {
          totalEvents,
          successRate,
          categories,
          severityBreakdown,
          recentTrend,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      defaultWinstonLogger.error("Failed to generate dashboard data", {
        error: message,
      });
      return { success: false, error: message, message: "Failed to generate dashboard data" };
    }
  }

  /**
   * Detect anomalous activity using simple threshold-based detection.
   * A real implementation would leverage statistical models; for now a basic
   * threshold comparison is provided as a placeholder.
   */
  public static async detectAnomalousActivity(
    userId: number | null = null,
    timeWindowHours = 1,
    thresholdMultiplier = 3
  ): Promise<AnomalyDetectionResult> {
    try {
      const windowStart = dayjs().subtract(timeWindowHours, "hour").toDate();

      const baseQuery = ActivityLog.query().where("created_at", ">=", windowStart);
      const scopedQuery = userId ? baseQuery.where("user_id", userId) : baseQuery;

      const count = await scopedQuery.resultSize();

      // Expected value: average per same length window in last 7 days
      const historicalStart = dayjs().subtract(7, "day").toDate();
      const historicalRows = await ActivityLog.query()
        .where("created_at", ">=", historicalStart)
        .selectRaw("COUNT(*) / 7 as avg");
      const expected = Number(historicalRows[0]?.avg ?? 0);

      const anomalous = expected > 0 ? count > expected * thresholdMultiplier : false;

      return {
        success: true,
        data: { anomalous, metric: "events", value: count, expected },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      defaultWinstonLogger.error("Failed to detect anomalous activity", { error: message });
      return { success: false, error: message, message: "Failed to detect anomalous activity" };
    }
  }

  /**
   * Generate a compliance report summarising key audit metrics between two dates.
   */
  public static async generateComplianceReport(
    startDate: Date | string,
    endDate: Date | string
  ): Promise<ComplianceReportResult> {
    try {
      if (!startDate || !endDate) {
        return { success: false, error: "Date range required", message: "startDate and endDate are mandatory" };
      }

      const stats = await this.getActivityStatistics({ dateFrom: startDate, dateTo: endDate });
      const dashboard = await this.getDashboardData();

      return {
        success: true,
        data: {
          statistics: stats.data,
          dashboard: dashboard.data,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      defaultWinstonLogger.error("Failed to generate compliance report", { error: message });
      return { success: false, error: message, message: "Failed to generate compliance report" };
    }
  }

  /* Helper to map requested period to DB function */
  private static getPeriodColumn(period: StatisticsPeriod): string {
    switch (period) {
      case "day":
        return "DATE(created_at)";
      case "week":
        return "YEARWEEK(created_at, 1)"; // ISO week number
      case "month":
        return "DATE_FORMAT(created_at, '%Y-%m')";
      case "year":
        return "YEAR(created_at)";
      default:
        return "DATE_FORMAT(created_at, '%Y-%m')";
    }
  }
}

export default ActivityAnalyticsService;
