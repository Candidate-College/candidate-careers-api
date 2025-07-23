/**
 * JobRepository
 *
 * Repository for job posting data access, including workflow status operations and audit trail.
 *
 * @module repositories/job-repository
 */
// src/repositories/job-repository.ts
import { Job } from '@/models/job-model';
import { JobCategory } from '@/models/job-category-model';
import { Department } from '@/models/department-model';
import { JobStatusTransition } from '@/models/job-status-transition-model';
import { Transaction } from 'objection';

export class JobRepository {
  static async create(jobData: Partial<Job>): Promise<Job> {
    return await Job.query().insert(jobData).returning('*');
  }

  static async slugExists(slug: string): Promise<boolean> {
    const result = await Job.query().select('id').findOne({ slug });
    return !!result;
  }

  static async isDepartmentActive(id: number): Promise<boolean> {
    const department = await Department.query().findById(id);
    return !!department && department.status === 'active';
  }

  static async isJobCategoryActive(id: number): Promise<boolean> {
    const category = await JobCategory.query().findById(id);
    return !!category && category.status === 'active';
  }

  /**
   * Update job status by ID, with workflow/audit fields.
   */
  static async updateStatusById(
    jobId: number,
    newStatus: string,
    options: {
      previousStatus?: string;
      statusChangedBy?: number;
      statusChangedAt?: Date;
      closeReason?: string;
      closeNotes?: string;
      archiveReason?: string;
      scheduledPublishAt?: Date;
      trx?: Transaction;
    } = {},
  ): Promise<Job> {
    const patch: any = {
      status: newStatus,
      previous_status: options.previousStatus,
      status_changed_by: options.statusChangedBy,
      status_changed_at: options.statusChangedAt || new Date(),
    };
    if (options.closeReason) patch.close_reason = options.closeReason;
    if (options.closeNotes) patch.close_notes = options.closeNotes;
    if (options.archiveReason) patch.archive_reason = options.archiveReason;
    if (options.scheduledPublishAt) patch.scheduled_publish_at = options.scheduledPublishAt;
    return await Job.query(options.trx).patchAndFetchById(jobId, patch);
  }

  /**
   * Log a job status transition.
   */
  static async logStatusTransition(
    data: Partial<JobStatusTransition>,
    trx?: Transaction,
  ): Promise<JobStatusTransition> {
    return await JobStatusTransition.query(trx).insert(data);
  }

  /**
   * Bulk update job statuses.
   */
  static async bulkUpdateStatus(
    jobIds: number[],
    newStatus: string,
    options: {
      previousStatus?: string;
      statusChangedBy?: number;
      statusChangedAt?: Date;
      trx?: Transaction;
    } = {},
  ): Promise<number> {
    const patch: any = {
      status: newStatus,
      previous_status: options.previousStatus,
      status_changed_by: options.statusChangedBy,
      status_changed_at: options.statusChangedAt || new Date(),
    };
    return await Job.query(options.trx).patch(patch).whereIn('id', jobIds);
  }

  /**
   * Find all status transitions for a job.
   */
  static async findTransitionsByJobId(jobId: number): Promise<JobStatusTransition[]> {
    return await JobStatusTransition.query()
      .where('job_posting_id', jobId)
      .orderBy('created_at', 'asc');
  }
}
