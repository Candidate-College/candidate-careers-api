/**
 * JobRepository
 *
 * Provides methods for interacting with the job posting data layer, including operations for creating jobs,
 * validating slugs, checking related entity statuses, updating job workflow statuses, logging status transitions,
 * and performing bulk status operations.
 *
 * @module repositories/job-repository
 */
import { Job } from '@/models/job-model';
import { JobCategory } from '@/models/job-category-model';
import { Department } from '@/models/department-model';
import { JobStatusTransition } from '@/models/job-status-transition-model';
import { Transaction } from 'objection';

export class JobRepository {
  /**
   * Creates a new job posting.
   *
   * @param {Partial<Job>} jobData - The job data to insert.
   * @returns {Promise<Job>} The created job record.
   */
  static async create(jobData: Partial<Job>): Promise<Job> {
    return await Job.query().insert(jobData).returning('*');
  }

  /**
   * Checks if a job slug already exists.
   *
   * @param {string} slug - The slug to check.
   * @returns {Promise<boolean>} `true` if the slug exists, otherwise `false`.
   */
  static async slugExists(slug: string): Promise<boolean> {
    const result = await Job.query().select('id').findOne({ slug });
    return !!result;
  }

  /**
   * Checks whether a department is active.
   *
   * @param {number} id - Department ID.
   * @returns {Promise<boolean>} `true` if active, otherwise `false`.
   */
  static async isDepartmentActive(id: number): Promise<boolean> {
    const department = await Department.query().findById(id);
    return !!department && department.status === 'active';
  }

  /**
   * Checks whether a job category is active.
   *
   * @param {number} id - Job category ID.
   * @returns {Promise<boolean>} `true` if active, otherwise `false`.
   */
  static async isJobCategoryActive(id: number): Promise<boolean> {
    const category = await JobCategory.query().findById(id);
    return !!category && category.status === 'active';
  }

  /**
   * Updates the status of a job posting by ID, including workflow metadata such as who changed the status and when.
   *
   * @param {number} jobId - ID of the job to update.
   * @param {string} newStatus - New status to apply.
   * @param {Object} [options] - Additional workflow and audit information.
   * @param {string} [options.previousStatus] - The previous status of the job.
   * @param {number} [options.statusChangedBy] - The user ID who changed the status.
   * @param {Date} [options.statusChangedAt] - The date/time when the status change occurred.
   * @param {string} [options.closeReason] - Reason for closing the job (if applicable).
   * @param {string} [options.closeNotes] - Additional notes for job closure.
   * @param {string} [options.archiveReason] - Reason for archiving the job.
   * @param {Date} [options.scheduledPublishAt] - Optional scheduled publish date.
   * @param {Transaction} [options.trx] - Objection.js transaction object.
   * @returns {Promise<Job>} The updated job record.
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
   * Logs a job status transition event to track workflow history.
   *
   * @param {Partial<JobStatusTransition>} data - Transition data to insert.
   * @param {Transaction} [trx] - Optional transaction object.
   * @returns {Promise<JobStatusTransition>} The inserted transition record.
   */
  static async logStatusTransition(
    data: Partial<JobStatusTransition>,
    trx?: Transaction,
  ): Promise<JobStatusTransition> {
    return await JobStatusTransition.query(trx).insert(data);
  }

  /**
   * Updates the status of multiple jobs in bulk.
   *
   * @param {number[]} jobIds - List of job IDs to update.
   * @param {string} newStatus - The new status to apply to all.
   * @param {Object} [options] - Optional metadata for audit.
   * @param {string} [options.previousStatus] - Previous status.
   * @param {number} [options.statusChangedBy] - User ID performing the change.
   * @param {Date} [options.statusChangedAt] - Timestamp of change.
   * @param {Transaction} [options.trx] - Optional transaction object.
   * @returns {Promise<number>} The number of rows updated.
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
   * Retrieves all status transitions for a specific job posting.
   *
   * @param {number} jobId - ID of the job posting.
   * @returns {Promise<JobStatusTransition[]>} Array of job status transitions sorted chronologically.
   */
  static async findTransitionsByJobId(jobId: number): Promise<JobStatusTransition[]> {
    return await JobStatusTransition.query()
      .where('job_posting_id', jobId)
      .orderBy('created_at', 'asc');
  }
}
