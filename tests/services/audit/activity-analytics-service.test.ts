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
  ActivityStatus,
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
      mockActivityLog.query.mockReturnValue({
        selectRaw: () => ({
          count: () => ({
            groupBy: () => ({
              orderBy: () => Promise.resolve(mockStats),
            }),
          }),
        }),
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
      const totalEventsQuery: any = { resultSize: jest.fn().mockResolvedValue(20) };
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
      const trendRows = [
        { date: dayjs().format("YYYY-MM-DD"), count: 20 },
      ];

      // Chain mocks based on the order of execution inside getDashboardData
      mockActivityLog.query
        .mockReturnValueOnce(totalEventsQuery) // totalEvents
        .mockReturnValueOnce(successEventsQuery) // successfulEvents
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockResolvedValue(categoryRows),
        }) // categories
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockResolvedValue(severityRows),
        }) // severities
        .mockReturnValueOnce({
          selectRaw: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupByRaw: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockResolvedValue(trendRows),
        }); // trend

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
