/**
 * ApplicationMetricsService
 *
 * Provides application statistics, conversion rate calculation, and application trends for job postings.
 * Integrates with analytics repositories and Winston logger for observability and reliability.
 *
 * @module services/application-metrics-service
 */

import { JobAnalyticsDailyRepository } from '@/repositories/job-analytics-daily-repository';
import { defaultWinstonLogger } from '@/utilities/winston-logger';

export class ApplicationMetricsService {
  /**
   * Retrieve application statistics for a job posting within a specified date range.
   */
  static async getApplicationStats(jobPostingId: number, startDate: string, endDate: string) {
    try {
      const analytics = await JobAnalyticsDailyRepository.aggregateMetrics(
        jobPostingId,
        startDate,
        endDate,
      );
      await defaultWinstonLogger.asyncInfo('Job application stats retrieved', {
        jobPostingId,
        startDate,
        endDate,
        analytics,
      });
      return analytics;
    } catch (error) {
      await defaultWinstonLogger.asyncError('Failed to get job application stats', {
        jobPostingId,
        startDate,
        endDate,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Calculate conversion rate for a job posting within a specified date range.
   */
  static calculateConversionRate(views: number, applications: number): number {
    if (!views || views === 0) return 0;
    return Math.round((applications / views) * 100 * 100) / 100; // 2 decimal places
  }

  /**
   * Retrieve application trends for a job posting over time (daily granularity).
   */
  static async getApplicationTrends(jobPostingId: number, startDate: string, endDate: string) {
    try {
      const analytics = await JobAnalyticsDailyRepository.getAnalyticsByJobAndRange(
        jobPostingId,
        startDate,
        endDate,
      );
      const trends = analytics.map(a => ({
        date: a.analytics_date,
        applications: a.total_applications,
        conversion_rate: a.conversion_rate,
        views: a.total_views,
      }));
      await defaultWinstonLogger.asyncInfo('Job application trends retrieved', {
        jobPostingId,
        startDate,
        endDate,
        trends,
      });
      return trends;
    } catch (error) {
      await defaultWinstonLogger.asyncError('Failed to get job application trends', {
        jobPostingId,
        startDate,
        endDate,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
