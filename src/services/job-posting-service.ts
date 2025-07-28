import { JobPostingRepository, IJobPostingRepository } from "@/repositories/job-posting-repository";
import { UserData } from "@/models/user-model";
import { JobPostingsData } from "@/models/job-postings-model";
import { createNotFoundError, createError, ErrorType } from "@/utilities/error-handler";
import { SlugGenerationService } from "@/services/slug-generation-service";
import { SlugHistoryService } from "@/services/slug-history-service";
import { SlugChangeReason } from "@/interfaces/slug/slug-history";
import { IJobUpdatePayload, DeleteJobOptions, DeleteJobResponse } from "@/interfaces/job/job-posting";

export class JobPostingService {
    private repo: IJobPostingRepository;

    /**
     * Constructor for JobPostingService
     * @param repo - The repository for job posting operations
     */
    constructor(repo: IJobPostingRepository = new JobPostingRepository()) {
        this.repo = repo;
    }


    // --------------------------------------------------------------------------------------------------
    // Public Methods
    // --------------------------------------------------------------------------------------------------

    /**
     * Update a job posting with authorization and business rule checks
     * @param jobPostingUuid - Job posting UUID
     * @param user - UserData performing the action
     * @param payload - The update data from the client.
     * @returns The updated job posting data.
     */
    async updateJobPosting(
        jobPostingUuid: string,
        user: UserData,
        payload: IJobUpdatePayload):
        Promise<JobPostingsData | null> {
        const jobPosting = await this.repo.findByUuid(jobPostingUuid);
        if (!jobPosting || jobPosting.deleted_at) {
            throw createNotFoundError('JobPosting', jobPostingUuid);
        }

        this.checkJobAuthorization('update', jobPosting, user);
        await this.validateUpdateBusinessRules(jobPosting, payload);
        const dataToUpdate = await this.prepareUpdateData(payload, jobPosting, user);
        const updatedCount = await this.repo.update(jobPosting.uuid, payload.version, dataToUpdate);

        if (updatedCount === 0) {
            throw createError(
                ErrorType.RESOURCE_CONFLICT,
                'Job posting has been modified by another user. Please refresh and try again.'
            );
        }

        return await this.repo.findByUuid(jobPostingUuid);
    }

    /**
     * Delete a job posting with authorization and business rule checks
     * @param jobPostingUuid - Job posting UUID
     * @param user - UserData performing the action
     * @param option - DeleteJobOptions (force, preserveApplications)
     * @returns DeleteJobResponse with detailed information about the deletion
     */
    async deleteJobPosting(
        jobPostingUuid: string,
        user: UserData,
        option: DeleteJobOptions = {}):
        Promise<DeleteJobResponse> {
        const jobPosting = await this.repo.findByUuid(jobPostingUuid);
        if (!jobPosting || jobPosting.deleted_at) {
            throw createNotFoundError('JobPosting', jobPostingUuid);
        }

        // Check authorization
        this.checkJobAuthorization('delete', jobPosting, user);

        // Check business rules unless bypassed
        const shouldBypassBusinessRules = option.force === true && this.isSuperAdmin(user);
        if (!shouldBypassBusinessRules) {
            await this.validateDeleteBusinessRules(jobPosting, jobPostingUuid, option);
        }

        // Perform soft delete
        await this.repo.softDelete(jobPostingUuid);

        // Get updated job data and prepare response
        return await this.prepareDeletionResponse(jobPostingUuid, user, jobPosting, option);
    }

    /**
     * Restore a soft-deleted job posting with authorization and business rule checks
     * @param jobPostingUuid - Job posting UUID
     * @param user - UserData performing the action
     */
    async restoreJobPosting(jobPostingUuid: string, user: UserData): Promise<void> {
        const jobPosting = await this.repo.findByUuid(jobPostingUuid);
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


    // --------------------------------------------------------------------------------------------------
    // Private Helpers: Authorization
    // --------------------------------------------------------------------------------------------------

    /**
     * Check if user is Super Admin
     */
    private isSuperAdmin(user: UserData): boolean {
        return user.role?.name === 'Super Admin';
    }

    /**
     * Check if user is Head Of HR
     */
    private isHeadOfHr(user: UserData): boolean {
        return user.role?.name === 'Head Of HR';
    }

    /**
     * Check if user is the owner of the job posting
     */
    private isOwner(job: JobPostingsData, user: UserData): boolean {
        return job.created_by === user.id;
    }

    /**
     * Authorization checker for job posting actions
     * @param action - 'delete' | 'restore' | 'update'
     * @param job - JobPostingsData
     * @param user - UserData
     */
    private checkJobAuthorization(
        action: 'delete' | 'restore' | 'update',
        job: JobPostingsData,
        user: UserData):
        void {
        const isSuperAdmin = this.isSuperAdmin(user);
        const isHeadOfHr = this.isHeadOfHr(user);
        const isOwner = this.isOwner(job, user);

        if (action === 'delete' || action === 'restore') {
            if (!isSuperAdmin) {
                throw createError(
                    ErrorType.ACCESS_DENIED,
                    'Only Super Admin can perform this action.'
                );
            }
            return;
        }

        if (action === 'update') {
            if (isSuperAdmin || isHeadOfHr) {
                return;
            }
            if (user.role?.name === 'HR Staff' && isOwner) {
                return;
            }
            throw createError(
                ErrorType.ACCESS_DENIED,
                'You do not have permission to update this job posting.'
            );
        }
    }


    // --------------------------------------------------------------------------------------------------
    // Private Helpers: Update Logic
    // --------------------------------------------------------------------------------------------------

    /**
     * Validate business rules for job update
     */
    private async validateUpdateBusinessRules(job: JobPostingsData, payload: IJobUpdatePayload): Promise<void> {
        this.validateUpdateOnPublishedJob(job, payload);
        await this.validateUpdateOnPublishedJobWithApplications(job, payload);
        this.validateUpdateOnApplicationDeadline(payload);
        this.validateUpdateOnClosedJob(job, payload);
    }

    /**
     * Validate update on published job
     */
    private validateUpdateOnPublishedJob(job: JobPostingsData, payload: IJobUpdatePayload): void {
        if (job.status === 'published') {
            const allowedFields = [
                'priority_level',
                'description',
                'requirements',
                'responsibilities',
                'benefits',
                'team_info',
                'application_info',
                'max_application'
            ];
            const payloadFields = Object.keys(payload);
            const notAllowed = payloadFields.filter(f => !allowedFields.includes(f) && f !== 'version');
            if (notAllowed.length > 0) {
                throw createError(
                    ErrorType.RESOURCE_CONFLICT,
                    `Cannot update fields [${notAllowed.join(', ')}] for published jobs.`
                );
            }
        }
    }

    /**
     * Validate update on published job with active applications
     */
    private async validateUpdateOnPublishedJobWithApplications(job: JobPostingsData, payload: IJobUpdatePayload): Promise<void> {
        const hasActiveApplication = await this.repo.findWithActiveApplication(job.uuid);

        if (hasActiveApplication) {
            if (payload.requirements || payload.responsibilities) {
                throw createError(
                    ErrorType.RESOURCE_CONFLICT,
                    'Cannot change requirements or responsibilities for jobs with active applications.'
                );
            }
        }
    }

    /**
     * Validate update on application deadline
     */
    private validateUpdateOnApplicationDeadline(payload: IJobUpdatePayload): void {
        if (payload.application_deadline) {
            const deadline = new Date(payload.application_deadline);
            if (isNaN(deadline.getTime()) || deadline <= new Date()) {
                throw createError(
                    ErrorType.RESOURCE_CONFLICT,
                    'Application deadline must be a future date.'
                );
            }
        }
    }

    /**
    * Validate update on closed job
    */
    private validateUpdateOnClosedJob(job: JobPostingsData, payload: IJobUpdatePayload): void {
        if (job.status === 'closed') {
            throw createError(
                ErrorType.RESOURCE_CONFLICT,
                'Cannot update closed job postings. Job is already closed and cannot be modified.'
            );
        }
    }

    /**
     * Prepared Update Data
     */
    private async prepareUpdateData(
        payload: IJobUpdatePayload,
        job: JobPostingsData,
        user: UserData
    ): Promise<Partial<IJobUpdatePayload> & { slug?: string }> {
        const dataToUpdate: Partial<IJobUpdatePayload> & { slug?: string } = { ...payload };

        if (payload.title && payload.title !== job.title) {
            try {
                const newSlug = await SlugGenerationService.regenerateSlug(
                    job.id,
                    payload.title,
                    async (slug: string, excludeJobId?: number | null) => {
                        return await this.repo.isSlugTaken(slug, job.id);
                    },
                    // Proper slug history tracking implementation
                    async (jobId: number, oldSlug: string, newSlug: string, reason: string) => {
                        await this.trackSlugChange(jobId, oldSlug, newSlug, reason as SlugChangeReason, user.id);
                    },
                    job.slug || ''
                );

                dataToUpdate.slug = newSlug;
            } catch (error) {
                throw createError(
                    ErrorType.RESOURCE_CONFLICT,
                    `Failed to generate slug`
                );
            }
        }

        return dataToUpdate;
    }

    /**
    * Track slug change using SlugHistoryService
    */
    private async trackSlugChange(
        jobId: number,
        oldSlug: string,
        newSlug: string,
        reason: SlugChangeReason,
        createdBy: number
    ): Promise<void> {
        try {
            await SlugHistoryService.trackSlugChange(
                jobId,
                oldSlug,
                newSlug,
                reason,
                createdBy,
                // Function to persist slug history record
                async (record) => {
                    await this.repo.createSlugHistory(record);
                }
            );
        } catch (error) {
            // Use proper logger instead of console.error
            console.error('Failed to track slug history:', error);
            // Don't throw to prevent job update from failing
        }
    }


    // --------------------------------------------------------------------------------------------------
    // Private Helpers: Delete Logic
    // --------------------------------------------------------------------------------------------------

    /**
     * Validate business rules for job deletion
     */
    private async validateDeleteBusinessRules(job: JobPostingsData, jobPostingUuid: string, option: DeleteJobOptions): Promise<void> {
        await this.validateDeleteOnPublishedJobWithApplications(job, jobPostingUuid, option);
        this.validateClosedJobGracePeriod(job);
    }

    /**
     * Validate delete on published job with active applications
     */
    private async validateDeleteOnPublishedJobWithApplications(job: JobPostingsData, jobPostingUuid: string, option: DeleteJobOptions): Promise<void> {
        if (job.status !== 'published') {
            return;
        }

        const hasActiveApplication = await this.repo.findWithActiveApplication(jobPostingUuid);
        if (hasActiveApplication && !option.preserveApplications) {
            throw createError(
                ErrorType.RESOURCE_CONFLICT,
                'Cannot delete job with active applications.'
            );
        }
    }

    /**
     * Validate closed job grace period (7 days)
     */
    private validateClosedJobGracePeriod(job: JobPostingsData): void {
        if (job.status !== 'closed' || !job.closed_at) {
            return;
        }

        const closedAt = new Date(job.closed_at);
        const now = new Date();
        const diffDays = (now.getTime() - closedAt.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays < 7) {
            throw createError(
                ErrorType.RESOURCE_CONFLICT,
                'Cannot delete job within 7 days of being closed.'
            );
        }
    }

    /**
     * Prepare deletion response with detailed information
     */
    private async prepareDeletionResponse(
        jobPostingUuid: string,
        user: UserData,
        originalJob: JobPostingsData,
        option: DeleteJobOptions
    ): Promise<DeleteJobResponse> {
        const deletedJob = await this.repo.findByUuid(jobPostingUuid);
        if (!deletedJob) {
            throw createError(ErrorType.INTERNAL_SERVER_ERROR, 'Failed to retrieve deleted job data');
        }

        const recoveryDeadline = this.calculateRecoveryDeadline(deletedJob.deleted_at!);

        return {
            deleted_job: {
                uuid: deletedJob.uuid,
                title: deletedJob.title,
                status: 'deleted',
                deleted_at: deletedJob.deleted_at!,
                deleted_by: user.id,
            },
            related_data: {
                applications_preserved: option.preserveApplications ? originalJob.applications_count || 0 : 0,
                notes_preserved: 0,
                views_count_archived: originalJob.views_count || 0,
            },
            recovery_info: {
                recovery_possible: true,
                recovery_deadline: recoveryDeadline,
            },
        };
    }

    /**
     * Calculate recovery deadline (30 days from deletion)
     */
    private calculateRecoveryDeadline(deletedAt: Date): Date {
        const recoveryDeadline = new Date(deletedAt);
        recoveryDeadline.setDate(recoveryDeadline.getDate() + 30);
        return recoveryDeadline;
    }
}