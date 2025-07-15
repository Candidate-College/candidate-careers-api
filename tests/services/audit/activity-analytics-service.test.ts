/**
 * Activity Analytics Service Tests
 *
 * Focus on verifying statistical calculations, dashboard aggregation,
 * anomaly detection logic, and compliance report generation. Database access
 * is mocked via ActivityLog model to ensure unit-level isolation.
 */

import ActivityAnalyticsService from "../../../src/services/audit/activity-analytics-service";
import { ActivityLog } from "../../../src/models/activity-log-model";
import {
  ActivityCategory,
  ActivitySeverity,
} from "../../../src/constants/activity-log-constants";
import dayjs from "dayjs";

// Mock dependencies
jest.mock("../../../src/models/activity-log-model");
const mockActivityLog = ActivityLog as jest.Mocked<typeof ActivityLog>;

describe("ActivityAnalyticsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getActivityStatistics", () => {
    it("should group statistics by default period and category", async () => {
      const mockStats = [
        { period_value: "2025-07", count: 10 },
        { period_value: "2025-08", count: 5 },
      ];

      // Refactored to reduce nesting depth
      const orderByMock = jest.fn().mockResolvedValue(mockStats);
      const groupByMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const countMock = jest.fn().mockReturnValue({ groupBy: groupByMock });
      const selectRawMock = jest.fn().mockReturnValue({ count: countMock });

      mockActivityLog.query.mockReturnValue({
        selectRaw: selectRawMock,
      } as any);

      const result = await ActivityAnalyticsService.getActivityStatistics();

      expect(result.success).toBe(true);
      expect(result.data?.stats).toEqual(mockStats);
      expect(result.data?.period).toBe("month");
    });

    it("should handle query errors gracefully", async () => {
      mockActivityLog.query.mockImplementation(() => {
        throw new Error("DB failure");
      });

      const result = await ActivityAnalyticsService.getActivityStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toBe("DB failure");
    });
  });

  describe("getDashboardData", () => {
    it("should return zeroed dashboard when no events exist", async () => {
      mockActivityLog.query.mockReturnValue({
        resultSize: () => 0,
      } as any);

      const result = await ActivityAnalyticsService.getDashboardData();

      expect(result.success).toBe(true);
      expect(result.data?.totalEvents).toBe(0);
      expect(result.data?.recentTrend).toEqual([]);
    });

    it("should calculate dashboard aggregates correctly", async () => {
      // Mock total events
      const totalEventsQuery: any = {
        resultSize: jest.fn().mockResolvedValue(20),
      };
      // Mock successful events query
      const successEventsQuery: any = {
        where: jest.fn().mockReturnThis(),
        resultSize: jest.fn().mockResolvedValue(15),
      };
      // Mock category breakdown
      const categoryRows = [
        { category: ActivityCategory.AUTHENTICATION, count: 8 },
        { category: ActivityCategory.SYSTEM, count: 12 },
      ];
      const severityRows = [
        { severity: ActivitySeverity.LOW, count: 10 },
        { severity: ActivitySeverity.HIGH, count: 10 },
      ];
      const trendRows = [{ date: dayjs().format("YYYY-MM-DD"), count: 20 }];

      // Refactored mocks for categories
      const groupByCategoryMock = jest.fn().mockResolvedValue(categoryRows);
      const countCategoryMock = jest.fn().mockReturnThis();
      const selectCategoryMock = jest.fn().mockReturnThis();
      const categoryQuery = {
        select: selectCategoryMock,
        count: countCategoryMock,
        groupBy: groupByCategoryMock,
      };

      // Refactored mocks for severities
      const groupBySeverityMock = jest.fn().mockResolvedValue(severityRows);
      const countSeverityMock = jest.fn().mockReturnThis();
      const selectSeverityMock = jest.fn().mockReturnThis();
      const severityQuery = {
        select: selectSeverityMock,
        count: countSeverityMock,
        groupBy: groupBySeverityMock,
      };

      // Refactored mocks for trend
      const orderByTrendMock = jest.fn().mockResolvedValue(trendRows);
      const groupByRawTrendMock = jest.fn().mockReturnThis();
      const whereTrendMock = jest.fn().mockReturnThis();
      const countTrendMock = jest.fn().mockReturnThis();
      const selectRawTrendMock = jest.fn().mockReturnThis();
      const trendQuery = {
        selectRaw: selectRawTrendMock,
        count: countTrendMock,
        where: whereTrendMock,
        groupByRaw: groupByRawTrendMock,
        orderBy: orderByTrendMock,
      };

      // Chain mocks based on the order of execution inside getDashboardData
      mockActivityLog.query
        .mockReturnValueOnce(totalEventsQuery) // totalEvents
        .mockReturnValueOnce(successEventsQuery) // successfulEvents
        .mockReturnValueOnce(categoryQuery) // categories
        .mockReturnValueOnce(severityQuery) // severities
        .mockReturnValueOnce(trendQuery); // trend

      const result = await ActivityAnalyticsService.getDashboardData();

      expect(result.success).toBe(true);
      expect(result.data?.totalEvents).toBe(20);
      expect(result.data?.successRate).toBeCloseTo((15 / 20) * 100);
      expect(result.data?.categories[ActivityCategory.SYSTEM]).toBe(12);
      expect(result.data?.severityBreakdown[ActivitySeverity.LOW]).toBe(10);
      expect(result.data?.recentTrend).toHaveLength(1);
    });
  });

  describe("detectAnomalousActivity", () => {
    it("should flag anomaly when count exceeds threshold", async () => {
      // current window count
      const currentWindowQuery: any = {
        where: jest.fn().mockReturnThis(),
        resultSize: jest.fn().mockResolvedValue(50),
      };
      // historical average
      const historicalQuery: any = {
        selectRaw: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };
      historicalQuery.selectRaw.mockResolvedValue([{ avg: 10 }]);

      mockActivityLog.query
        .mockReturnValueOnce(currentWindowQuery)
        .mockReturnValueOnce(historicalQuery);

      const result = await ActivityAnalyticsService.detectAnomalousActivity();

      expect(result.success).toBe(true);
      expect(result.data?.anomalous).toBe(true);
    });
  });

  describe("generateComplianceReport", () => {
    it("should require date range", async () => {
      const result = await ActivityAnalyticsService.generateComplianceReport(
        null as any,
        null as any
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe("Date range required");
    });
  });
});
