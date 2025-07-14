/**
 * Activity Analytics Types
 *
 * Shared type definitions for the `ActivityAnalyticsService` to keep the main
 * service file lean and under the 300-line project limit.
 */

import { ActivityCategory, ActivitySeverity } from "@/constants/activity-log-constants";

/** Period enum supported by statistics endpoint */
export type StatisticsPeriod = "day" | "week" | "month" | "year";

/** Group-by options supported by statistics endpoint */
export type GroupByOption = "action" | "category" | "user" | "hour";

export interface StatisticsFilters {
  period?: StatisticsPeriod;
  groupBy?: GroupByOption;
  dateFrom?: Date | string;
  dateTo?: Date | string;
}

export interface ActivityStatisticsResult {
  success: boolean;
  data?: any; // aggregated shapes vary – kept flexible
  error?: string;
  message?: string;
}

export interface DashboardDataResult {
  success: boolean;
  data?: {
    totalEvents: number;
    successRate: number;
    categories: Record<ActivityCategory, number>;
    severityBreakdown: Record<ActivitySeverity, number>;
    recentTrend: Array<{ date: string; count: number }>;
  };
  error?: string;
  message?: string;
}

export interface AnomalyDetectionResult {
  success: boolean;
  data?: {
    anomalous: boolean;
    metric: string;
    value: number;
    expected: number;
  };
  error?: string;
  message?: string;
}

export interface ComplianceReportResult {
  success: boolean;
  data?: any; // detailed compliance report structure TBD
  error?: string;
  message?: string;
}
