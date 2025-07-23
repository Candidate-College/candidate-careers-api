/**
 * ViewTrackingService
 *
 * Provides atomic view tracking, unique view calculation, and view metrics for job postings.
 * Integrates with JobViewRepository and Winston logger for observability and reliability.
 *
 * @module services/view-tracking-service
 */

import { JobViewRepository } from '@/repositories/job-view-repository';
import { defaultWinstonLogger } from '@/utilities/winston-logger';

export class ViewTrackingService {
  /**
   * Atomically increment view count for a job posting, with optional tracking metadata.
   */
  static async incrementViewCount(
    jobPostingId: number,
    trackingData: Partial<{
      ip_address: string;
      user_agent: string;
      session_id: string;
      referrer: string;
      viewed_at: Date;
    }>,
  ) {
    try {
      const view = await JobViewRepository.insertView({
        job_posting_id: jobPostingId,
        ...trackingData,
        viewed_at: trackingData.viewed_at || new Date(),
      });
      await defaultWinstonLogger.asyncInfo('Job view incremented', {
        jobPostingId,
        viewId: view.id,
      });
      return view;
    } catch (error) {
      await defaultWinstonLogger.asyncError('Failed to increment job view', {
        jobPostingId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Retrieve view metrics for a job posting within a specified date or range.
   */
  static async getViewMetrics(jobPostingId: number, date?: string) {
    try {
      const totalViews = await JobViewRepository.countTotalViews(jobPostingId, date);
      const uniqueViews = await JobViewRepository.countUniqueViews(jobPostingId, date);
      await defaultWinstonLogger.asyncInfo('Job view metrics retrieved', {
        jobPostingId,
        date,
        totalViews,
        uniqueViews,
      });
      return { totalViews, uniqueViews };
    } catch (error) {
      await defaultWinstonLogger.asyncError('Failed to get job view metrics', {
        jobPostingId,
        date,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Calculate unique views for a job posting within a specified date or range.
   */
  static async getUniqueViews(jobPostingId: number, date?: string) {
    try {
      const uniqueViews = await JobViewRepository.countUniqueViews(jobPostingId, date);
      await defaultWinstonLogger.asyncInfo('Job unique views calculated', {
        jobPostingId,
        date,
        uniqueViews,
      });
      return uniqueViews;
    } catch (error) {
      await defaultWinstonLogger.asyncError('Failed to calculate unique job views', {
        jobPostingId,
        date,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
