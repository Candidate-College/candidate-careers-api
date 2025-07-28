import { JobPostings, JobPostingsData } from '@/models/job-postings-model';
import { Transaction } from 'objection';
import { IJobUpdatePayload } from '@/interfaces/payloads/job-postings-payload';
const knex = require('@/config/database/query-builder');

/**
 * Interface for JobPostingRepository
 */
export interface IJobPostingRepository {
  findJobPostingByUuid(jobPostingUuid: string): Promise<JobPostingsData | null>;
  findWithActiveApplication(jobPostingUuid: string): Promise<boolean>;
  update(uuid: string, currentVersion: number, payload: Partial<IJobUpdatePayload>): Promise<number>;
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
  private async findJobPostingByUuidWithSelect(jobPostingUuid: string, selectFields?: string[]) {
    const query = JobPostings.query().findOne({ uuid: jobPostingUuid });
    if (selectFields && selectFields.length > 0) {
      query.select(...selectFields);
    }
    return await query;
  }

  /**
   * Find a job posting by its uuid
   * @param jobPostingUuid job posting uuid
   * @returns JobPostingsData or null
   */
  async findJobPostingByUuid(jobPostingUuid: string): Promise<JobPostingsData | null> {
    const job = await this.findJobPostingByUuidWithSelect(jobPostingUuid);
    return job ?? null;
  }

  /**
   * Efficiently check if a job posting has any application with status 'pending' or 'under_review' using .first()
   * @param jobPostingUuid job posting uuid
   * @returns true if there is at least one such application, false otherwise
   */
  async findWithActiveApplication(jobPostingUuid: string): Promise<boolean> {
    const job = await this.findJobPostingByUuidWithSelect(jobPostingUuid, ['id', 'uuid']);
    if (!job) return false;
    
    const application = await JobPostings.relatedQuery('jobApplications')
      .for(job.id)
      .whereIn('status', ['pending', 'under_review'])
      .first();
    return !!application;
  }

  /**
   * Update a job posting with optimistic locking (version increment)
   * @param uuid - job posting uuid
   * @param currentVersion - current version for optimistic lock
   * @param payload - partial update payload
   * @returns number of rows updated
   */
  public async update(uuid: string, currentVersion: number, payload: Partial<IJobUpdatePayload>): Promise<number> {
    // Prepare update object, increment version atomically
    const { version, ...updateData } = payload
    const updatedCount = await JobPostings.query()
      .where({
        uuid: uuid,
        version: currentVersion,
      })
      .patch({
        ...updateData,
        version: knex.raw('version + 1'),
      })
    return updatedCount;
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