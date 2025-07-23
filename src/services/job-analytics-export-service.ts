/**
 * JobAnalyticsExportService
 *
 * Provides utilities to export job analytics data into CSV or JSON formats.
 * Supports batch processing for large datasets and integrates Winston logger for observability.
 *
 * @module services/job-analytics-export-service
 */

import { JobAnalyticsDailyRepository } from '../repositories/job-analytics-daily-repository';
import { defaultWinstonLogger } from '../utilities/winston-logger';

export class JobAnalyticsExportService {
  /**
   * Export job analytics data to JSON format.
   */
  static async exportToJSON(jobId: number, startDate: string, endDate: string): Promise<Buffer> {
    try {
      const analytics = await JobAnalyticsDailyRepository.getAnalyticsByJobAndRange(
        jobId,
        startDate,
        endDate,
      );
      defaultWinstonLogger.info('Exported job analytics to JSON', {
        jobId,
        count: analytics.length,
      });
      return Buffer.from(JSON.stringify(analytics, null, 2));
    } catch (error) {
      await defaultWinstonLogger.asyncError('Failed to export job analytics to JSON', {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Export job analytics data to CSV format.
   */
  static async exportToCSV(jobId: number, startDate: string, endDate: string): Promise<Buffer> {
    try {
      const analytics = await JobAnalyticsDailyRepository.getAnalyticsByJobAndRange(
        jobId,
        startDate,
        endDate,
      );
      if (!analytics.length) return Buffer.from('');
      const headers = Object.keys(analytics[0]);
      const csvRows = [headers.join(',')];
      for (const row of analytics) {
        csvRows.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
      }
      defaultWinstonLogger.info('Exported job analytics to CSV', {
        jobId,
        count: analytics.length,
      });
      return Buffer.from(csvRows.join('\n'));
    } catch (error) {
      await defaultWinstonLogger.asyncError('Failed to export job analytics to CSV', {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
