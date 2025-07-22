/**
 * Slug History Service
 *
 * Provides methods for tracking, retrieving, and resolving slug history for job postings.
 * Supports SEO, analytics, and redirect functionality by maintaining a record of slug changes.
 *
 * @module src/services/slug-history-service
 */

import { SlugHistoryRecord, SlugChangeReason } from '@/interfaces/slug/slug-history';
import { defaultWinstonLogger as logger } from '@/utilities/winston-logger';

export class SlugHistoryService {
  /**
   * Track a slug change for a job posting.
   *
   * @param jobId - The job posting ID
   * @param oldSlug - The previous slug (can be null for creation)
   * @param newSlug - The new slug
   * @param reason - The reason for the change
   * @param createdBy - (Optional) User ID who made the change
   * @param createHistoryFn - Function to persist the slug history record
   */
  public static async trackSlugChange(
    jobId: number,
    oldSlug: string | null,
    newSlug: string,
    reason: SlugChangeReason,
    createdBy: number | null = null,
    createHistoryFn?: (record: Omit<SlugHistoryRecord, 'id' | 'createdAt'>) => Promise<void>,
  ): Promise<void> {
    try {
      if (!createHistoryFn) {
        throw new Error('No createHistoryFn provided');
      }
      await createHistoryFn({
        jobPostingId: jobId,
        oldSlug,
        newSlug,
        changeReason: reason,
        createdBy: createdBy || undefined,
      });
    } catch (err) {
      logger.error('SlugHistoryService.trackSlugChange error', {
        err,
        jobId,
        oldSlug,
        newSlug,
        reason,
      });
      throw err;
    }
  }

  /**
   * Retrieve the complete slug history for a job posting.
   *
   * @param jobId - The job posting ID
   * @param getHistoryFn - Function to fetch slug history records
   * @returns Array of SlugHistoryRecord
   */
  public static async getSlugHistory(
    jobId: number,
    getHistoryFn: (jobId: number) => Promise<SlugHistoryRecord[]>,
  ): Promise<SlugHistoryRecord[]> {
    try {
      return await getHistoryFn(jobId);
    } catch (err) {
      logger.error('SlugHistoryService.getSlugHistory error', { err, jobId });
      throw err;
    }
  }

  /**
   * Find a job posting by a historical slug (for redirect/lookup).
   *
   * @param slug - The historical slug
   * @param findBySlugFn - Function to find job by historical slug
   * @returns The job posting ID or null if not found
   */
  public static async findJobByHistoricalSlug(
    slug: string,
    findBySlugFn: (slug: string) => Promise<{ jobPostingId: number; currentSlug: string } | null>,
  ): Promise<{ jobPostingId: number; currentSlug: string } | null> {
    try {
      return await findBySlugFn(slug);
    } catch (err) {
      logger.error('SlugHistoryService.findJobByHistoricalSlug error', { err, slug });
      throw err;
    }
  }
}
export default SlugHistoryService;
