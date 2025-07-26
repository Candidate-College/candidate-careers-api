import { JobPostingRepository } from "@/repositories/job-deletion-repository";
import { UserData } from "@/models/user-model";
import { createNotFoundError, createError, ErrorType } from "@/utilities/error-handler";

export interface DeleteJobOptions {
    force?: boolean;
    preserveApplications?: boolean;
}

export interface DeletedJobData {
    uuid: string;
    title: string;
    status: string;
    deleted_at: Date;
    deleted_by: number;
}

export interface RelatedData {
    applications_preserved: number;
    notes_preserved: number;
    views_count_archived: number;
}

export interface RecoveryInfo {
    recovery_possible: boolean;
    recovery_deadline: Date;
}

export interface DeleteJobResponse {
    deleted_job: DeletedJobData;
    related_data: RelatedData;
    recovery_info: RecoveryInfo;
}

export class JobDeletionService {
    constructor(private readonly repo: JobPostingRepository) {}

    /**
     * Delete a job posting with authorization and business rule checks
     * @param jobPostingUuid - Job posting UUID
     * @param user - UserData performing the action
     * @param option - DeleteJobOptions (force, preserveApplications)
     * @returns DeleteJobResponse with detailed information about the deletion
     */
    async deleteJobPosting(jobPostingUuid: string, user: UserData, option: DeleteJobOptions = {}): Promise<DeleteJobResponse> {
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

        // Perform soft delete
        await this.repo.softDelete(jobPostingUuid);
        
        // Get updated job data after deletion
        const deletedJob = await this.repo.findJobPostingByUuid(jobPostingUuid);
        if (!deletedJob) {
            throw createError(ErrorType.INTERNAL_SERVER_ERROR, 'Failed to retrieve deleted job data');
        }

        // Calculate recovery deadline (30 days from deletion)
        const recoveryDeadline = new Date(deletedJob.deleted_at!);
        recoveryDeadline.setDate(recoveryDeadline.getDate() + 30);

        // Prepare response data
        const response: DeleteJobResponse = {
            deleted_job: {
                uuid: deletedJob.uuid,
                title: deletedJob.title,
                status: 'deleted',
                deleted_at: deletedJob.deleted_at!,
                deleted_by: user.id,
            },
            related_data: {
                applications_preserved: option.preserveApplications ? jobPosting.applications_count || 0 : 0,
                notes_preserved: 0, // TODO: Implement when notes feature is available
                views_count_archived: jobPosting.views_count || 0,
            },
            recovery_info: {
                recovery_possible: true,
                recovery_deadline: recoveryDeadline,
            },
        };

        return response;
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