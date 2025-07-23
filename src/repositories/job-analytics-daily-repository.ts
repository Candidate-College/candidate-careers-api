/**
 * JobAnalyticsDailyRepository
 *
 * Repository for daily job analytics aggregation and retrieval.
 * Provides methods for upserting analytics, querying by job/date, and aggregating metrics.
 *
 * @module repositories/job-analytics-daily-repository
 */

import { JobAnalyticsDaily } from '@/models/job-analytics-daily-model';

export class JobAnalyticsDailyRepository {
  static async upsertDailyAnalytics(
    jobPostingId: number,
    analyticsDate: string,
    data: Partial<JobAnalyticsDaily>,
  ): Promise<JobAnalyticsDaily> {
    const existing = await JobAnalyticsDaily.query().findOne({
      job_posting_id: jobPostingId,
      analytics_date: analyticsDate,
    });
    if (existing) {
      return await existing.$query().patchAndFetch(data);
    }
    return await JobAnalyticsDaily.query().insert({
      job_posting_id: jobPostingId,
      analytics_date: analyticsDate,
      ...data,
    });
  }

  static async getAnalyticsByJobAndRange(
    jobPostingId: number,
    startDate: string,
    endDate: string,
  ): Promise<JobAnalyticsDaily[]> {
    return await JobAnalyticsDaily.query()
      .where('job_posting_id', jobPostingId)
      .where('analytics_date', '>=', startDate)
      .where('analytics_date', '<=', endDate)
      .orderBy('analytics_date', 'asc');
  }

  static async aggregateMetrics(
    jobPostingId: number,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    return await JobAnalyticsDaily.query()
      .where('job_posting_id', jobPostingId)
      .where('analytics_date', '>=', startDate)
      .where('analytics_date', '<=', endDate)
      .sum('total_views as total_views')
      .sum('unique_views as unique_views')
      .sum('total_applications as total_applications')
      .avg('conversion_rate as avg_conversion_rate')
      .first();
  }
}
