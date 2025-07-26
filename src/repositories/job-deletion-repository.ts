import { JobPostings, JobPostingsData } from '@/models/job-postings-model';
import { Transaction } from 'objection';

/**
 * Interface for JobPostingRepository
 */
export interface IJobPostingRepository {
  findJobPostingByUuid(jobPostingUuid: string): Promise<JobPostingsData | null>;
  findWithActiveApplication(jobPostingUuid: string): Promise<boolean>;
  softDelete(jobPostingUuid: string, trx?: Transaction): Promise<number>;
  restore(jobPostingUuid: string, trx?: Transaction): Promise<number>;
}

/**
 * Repository for job_postings table operations, focused on deletion and restoration logic.
 */
export class JobPostingRepository implements IJobPostingRepository {
  /**
   * Find a job posting by its uuid
   * @param jobPostingUuid job posting uuid
   * @returns JobPostingsData or null
   */
  async findJobPostingByUuid(jobPostingUuid: string): Promise<JobPostingsData | null> {
    const job = await JobPostings.query().findOne({ uuid: jobPostingUuid });
    return job ?? null;
  }

  /**
   * Efficiently check if a job posting has any application with status 'pending' or 'under_review' using .first()
   * @param jobPostingUuid job posting uuid
   * @returns true if there is at least one such application, false otherwise
   */
  async findWithActiveApplication(jobPostingUuid: string): Promise<boolean> {
    // Find job posting by uuid to get id
    const job = await JobPostings.query().findOne({ uuid: jobPostingUuid }).select('uuid');
    if (!job) return false;
    const application = await JobPostings.relatedQuery('applications')
      .for(job.id)
      .whereIn('status', ['pending', 'under_review'])
      .first();
    return !!application;
  }

  /**
   * Soft delete a job posting (sets deleted_at)
   * @param jobPostingUuid job posting uuid
   * @param trx optional transaction
   * @returns number of rows updated
   */
  async softDelete(jobPostingUuid: string, trx?: Transaction): Promise<number> {
    const result = await JobPostings.query(trx)
      .findOne({ uuid: jobPostingUuid })
      .patch({ deleted_at: new Date() });
    return result;
  }

  /**
   * Restore a soft-deleted job posting (sets deleted_at to null)
   * @param jobPostingUuid job posting uuid
   * @param trx optional transaction
   * @returns number of rows updated
   */
  async restore(jobPostingUuid: string, trx?: Transaction): Promise<number> {
    const result = await JobPostings.query(trx)
      .findOne({ uuid: jobPostingUuid })
      .patch({ deleted_at: null });
    return result;
  }
} 