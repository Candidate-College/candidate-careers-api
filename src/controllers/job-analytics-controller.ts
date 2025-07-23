/**
 * JobAnalyticsController
 *
 * Handles job, bulk, department, and platform analytics endpoints for job postings.
 * Delegates business logic to analytics services and formats API responses.
 * Integrates with Winston logger for observability and error handling.
 *
 * @module controllers/job-analytics-controller
 */

import { Request, Response } from 'express';
import { ViewTrackingService } from '../services/view-tracking-service';
import { ApplicationMetricsService } from '../services/application-metrics-service';
import { PerformanceCalculatorService } from '../services/performance-calculator-service';
import { AnalyticsAggregationService } from '../services/analytics-aggregation-service';
import { defaultWinstonLogger as logger } from '../utilities/winston-logger';
import { toJobAnalyticsResource } from '../resources/job-analytics-resource';

export class JobAnalyticsController {
  /**
   * GET /api/v1/jobs/:uuid/analytics
   * Returns analytics for a single job posting.
   */
  static async getJobAnalytics(req: Request, res: Response) {
    try {
      const { uuid } = req.params;
      const { period, granularity, include_comparisons, metrics, start_date, end_date } = req.query;
      // Business logic: fetch analytics, trends, comparisons, insights
      // (Assume jobId is resolved from uuid elsewhere)
      const jobId = Number(uuid); // Replace with actual lookup if needed
      const allowedGranularities = ['day', 'week', 'month'] as const;
      type Granularity = (typeof allowedGranularities)[number];
      const granularityParam = (granularity as string) || 'day';
      const granularityValue: Granularity = allowedGranularities.includes(
        granularityParam as Granularity,
      )
        ? (granularityParam as Granularity)
        : 'day';
      const analytics = await AnalyticsAggregationService.aggregateByTimePeriod(
        jobId,
        start_date as string,
        end_date as string,
        granularityValue,
      );
      const metricsSummary = await ApplicationMetricsService.getApplicationStats(
        jobId,
        start_date as string,
        end_date as string,
      );
      const insights = PerformanceCalculatorService.generateInsights(metricsSummary);
      logger.info('Job analytics retrieved', { jobId });
      return res.status(200).json({
        status: 200,
        message: 'Job analytics retrieved successfully',
        data: toJobAnalyticsResource(analytics, metricsSummary, insights),
      });
    } catch (error) {
      logger.error('Failed to get job analytics', { error });
      return res.status(500).json({ status: 500, message: 'Failed to get job analytics' });
    }
  }

  /**
   * GET /api/v1/jobs/analytics/bulk
   * Returns analytics for multiple jobs (bulk).
   */
  static async getBulkJobAnalytics(req: Request, res: Response) {
    try {
      const { job_uuids, period, metrics, sort_by, order } = req.query;
      // Business logic: fetch analytics for multiple jobs
      // (Assume jobIds are resolved from uuids elsewhere)
      const jobIds = (job_uuids as string).split(',').map(Number);
      const analytics = await Promise.all(
        jobIds.map(jobId =>
          ApplicationMetricsService.getApplicationStats(jobId, period as string, period as string),
        ),
      );
      logger.info('Bulk job analytics retrieved', { jobIds });
      return res.status(200).json({
        status: 200,
        message: 'Bulk job analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      logger.error('Failed to get bulk job analytics', { error });
      return res.status(500).json({ status: 500, message: 'Failed to get bulk job analytics' });
    }
  }

  /**
   * GET /api/v1/analytics/departments/:department_id
   * Returns department-wide job performance metrics.
   */
  static async getDepartmentAnalytics(req: Request, res: Response) {
    try {
      const { department_id } = req.params;
      const { period, start_date, end_date } = req.query;
      const summary = await AnalyticsAggregationService.generateDepartmentSummary(
        Number(department_id),
        start_date as string,
        end_date as string,
      );
      logger.info('Department analytics retrieved', { department_id });
      return res.status(200).json({
        status: 200,
        message: 'Department analytics retrieved successfully',
        data: summary,
      });
    } catch (error) {
      logger.error('Failed to get department analytics', { error });
      return res.status(500).json({ status: 500, message: 'Failed to get department analytics' });
    }
  }

  /**
   * GET /api/v1/analytics/overview
   * Returns platform-wide recruitment analytics and KPIs.
   */
  static async getPlatformOverview(req: Request, res: Response) {
    try {
      const { period, start_date, end_date } = req.query;
      const kpis = await AnalyticsAggregationService.calculatePlatformKPIs(
        start_date as string,
        end_date as string,
      );
      logger.info('Platform analytics overview retrieved');
      return res.status(200).json({
        status: 200,
        message: 'Platform analytics overview retrieved successfully',
        data: kpis,
      });
    } catch (error) {
      logger.error('Failed to get platform analytics overview', { error });
      return res
        .status(500)
        .json({ status: 500, message: 'Failed to get platform analytics overview' });
    }
  }

  /**
   * GET /api/v1/analytics/export
   * Returns analytics data export (CSV/JSON).
   */
  static async exportAnalytics(req: Request, res: Response) {
    try {
      // Placeholder: implement export logic (CSV/JSON)
      logger.info('Analytics export requested');
      return res.status(200).json({ status: 200, message: 'Analytics export not yet implemented' });
    } catch (error) {
      logger.error('Failed to export analytics', { error });
      return res.status(500).json({ status: 500, message: 'Failed to export analytics' });
    }
  }
}
