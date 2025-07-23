/**
 * JobViewRepository
 *
 * Repository for job view tracking and analytics data access.
 * Provides methods for atomic view insertion, unique view calculation, and view retrieval.
 *
 * @module repositories/job-view-repository
 */

import { JobView } from '@/models/job-view-model';

export class JobViewRepository {
  static async insertView(viewData: Partial<JobView>): Promise<JobView> {
    return await JobView.query().insert(viewData).returning('*');
  }

  static async countTotalViews(jobPostingId: number, date?: string): Promise<number> {
    let query = JobView.query().where('job_posting_id', jobPostingId);
    if (date) query = query.whereRaw('DATE(viewed_at) = ?', [date]);
    return await query.resultSize();
  }

  static async countUniqueViews(jobPostingId: number, date?: string): Promise<number> {
    let query = JobView.query().where('job_posting_id', jobPostingId);
    if (date) query = query.whereRaw('DATE(viewed_at) = ?', [date]);
    return await query.distinct('ip_address', 'session_id').resultSize();
  }

  static async getViewsByJobAndDate(jobPostingId: number, date: string): Promise<JobView[]> {
    return await JobView.query()
      .where('job_posting_id', jobPostingId)
      .whereRaw('DATE(viewed_at) = ?', [date]);
  }
}
