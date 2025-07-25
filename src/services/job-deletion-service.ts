import { JobPostingRepository } from "@/repositories/job-deletion-repository";
import { UserData } from "@/models/user-model";
import { createNotFoundError, createError, ErrorType } from "@/utilities/error-handler";

export interface DeleteJobOptions {
    force?: boolean;
    preserveApplications?: boolean;
}

export class JobDeletionService {
    constructor(private readonly repo: JobPostingRepository) {}

    /**
     * Delete a job posting with authorization and business rule checks
     * @param jobPostingUuid - Job posting UUID
     * @param user - UserData performing the action
     * @param option - DeleteJobOptions (force, preserveApplications)
     */
    async deleteJobPosting(jobPostingUuid: string, user: UserData, option: DeleteJobOptions = {}): Promise<void> {
        const jobPosting = await this.repo.findJobPostingByUuid(jobPostingUuid);
        if (!jobPosting || jobPosting.deleted_at) {
            throw createNotFoundError('JobPosting', jobPostingUuid);
        }

        // Authorization: Only Super Admin or creator can delete
        const isSuperAdmin = user.role?.name === 'Super Admin';
        if (!isSuperAdmin && user.id !== jobPosting.created_by) {
            throw createError(
                ErrorType.ACCESS_DENIED,
                'You do not have permission to delete this job posting.'
            );
        }

        // Only bypass business rules if force is true and user is Super Admin
        const shouldBypassBusinessRules = option.force === true && isSuperAdmin;
        if (!shouldBypassBusinessRules) {
            // Business Rule: If published and has active applications, block deletion
            if (jobPosting.status === 'published') {
                const hasActiveApplication = await this.repo.findWithActiveApplication(jobPostingUuid);
                if (hasActiveApplication && !option.preserveApplications) {
                    throw createError(
                        ErrorType.RESOURCE_CONFLICT,
                        'Cannot delete job with active applications.'
                    );
                }
            }

            // Business Rule: If closed and closed_at < 7 days ago, block deletion
            if (jobPosting.status === 'closed' && jobPosting.closed_at) {
                const closedAt = new Date(jobPosting.closed_at);
                const now = new Date();
                const diffDays = (now.getTime() - closedAt.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays < 7) {
                    throw createError(
                        ErrorType.RESOURCE_CONFLICT,
                        'Cannot delete job within 7 days of being closed.'
                    );
                }
            }
        }

        await this.repo.softDelete(jobPostingUuid);
    }

    /**
     * Restore a soft-deleted job posting with authorization and business rule checks
     * @param jobPostingUuid - Job posting UUID
     * @param user - UserData performing the action
     */
    async restoreJobPosting(jobPostingUuid: string, user: UserData): Promise<void> {
        const jobPosting = await this.repo.findJobPostingByUuid(jobPostingUuid);
        if (!jobPosting) {
            throw createNotFoundError('JobPosting', jobPostingUuid);
        }
        if (!jobPosting.deleted_at) {
            throw createError(
                ErrorType.RESOURCE_CONFLICT,
                'Job posting is not deleted.'
            );
        }

        // Authorization: Only Super Admin can restore
        const isSuperAdmin = user.role?.name === 'Super Admin';
        if (!isSuperAdmin) {
            throw createError(
                ErrorType.ACCESS_DENIED,
                'Only Super Admin can restore job postings.'
            );
        }

        // Business Rule: Only allow restore if deleted_at < 30 days ago
        const deletedAt = new Date(jobPosting.deleted_at);
        const now = new Date();
        const diffDays = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) {
            throw createError(
                ErrorType.RESOURCE_CONFLICT,
                'Cannot restore job posting deleted more than 30 days ago.'
            );
        }

        await this.repo.restore(jobPostingUuid);
    }
}