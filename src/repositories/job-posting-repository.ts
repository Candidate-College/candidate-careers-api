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
   * Private method to find job posting by UUID with optional field selection
   * @param jobPostingUuid job posting uuid
   * @param selectFields optional array of fields to select
   * @returns JobPostingsData or null
   */
  private async findJobPostingByUuidWithSelect(
    jobPostingUuid: string, 
    selectFields?: (keyof JobPostingsData)[]
  ): Promise<JobPostingsData | null> {
    const query = JobPostings.query().findOne({ uuid: jobPostingUuid });
    if (selectFields && selectFields.length > 0) {
      query.select(...selectFields);
    }
    const result = await query;
    return result ?? null;
  }

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
   * Efficiently check if a job posting has any application with status 'pending' or 'under_review' using a single query
   * @param jobPostingUuid job posting uuid
   * @returns true if job posting exists and has at least one active application, false otherwise
   */
  async findWithActiveApplication(jobPostingUuid: string): Promise<boolean> {
    const job = await JobPostings.query()
      .where('uuid', jobPostingUuid)
      .whereExists(
        JobPostings.relatedQuery('jobApplications')
          .whereIn('status', ['pending', 'under_review'])
      )
      .first();
    
    return !!job;
  }

  /**
   * Soft delete a job posting (sets deleted_at)
   * @param jobPostingUuid job posting uuid
   * @param trx optional transaction
   * @returns number of rows updated
   */
  async softDelete(jobPostingUuid: string, trx?: Transaction): Promise<number> {
    return await JobPostings.query(trx)
      .findOne({ uuid: jobPostingUuid })
      .patch({ deleted_at: new Date() });
  }

  /**
   * Restore a soft-deleted job posting (sets deleted_at to null)
   * @param jobPostingUuid job posting uuid
   * @param trx optional transaction
   * @returns number of rows updated
   */
  async restore(jobPostingUuid: string, trx?: Transaction): Promise<number> {
    return await JobPostings.query(trx)
      .findOne({ uuid: jobPostingUuid })
      .patch({ deleted_at: null });
  }
} 