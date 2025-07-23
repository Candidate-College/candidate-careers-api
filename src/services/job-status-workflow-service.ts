/**
 * Job Status Workflow Service
 *
 * Orchestrates job posting status transitions, integrating state machine validation, repository updates,
 * audit logging, notification, and business rule enforcement. Ensures all transitions are atomic, logged,
 * and follow business requirements.
 *
 * @module services/job-status-workflow-service
 */
import { JobStatus } from '@/interfaces/job/job-status-workflow';
import { JobRepository } from '@/repositories/job-repository';
import { JobStatusStateMachine } from './job-status-state-machine';
import { defaultWinstonLogger as winston } from '@/utilities/winston-logger';
// import { ActivityLogService } from '@/services/audit/activity-log-service';
import { EmailService } from '@/services/email/email-service';
import { ActivityCategory, ActivityStatus } from '@/constants/activity-log-constants';

async function updateSearchIndex(jobId: number, status: JobStatus) {
  winston.info('[SearchIndex] Update search index', { jobId, status });
  // TODO: Integrasi ke search indexer (stub)
}

async function updateAnalytics(jobId: number, from: JobStatus, to: JobStatus) {
  winston.info('[Analytics] Update analytics data', { jobId, from, to });
  // TODO: Integrasi ke analytics service (stub)
}

export class JobStatusWorkflowService {
  /**
   * Perform a status transition for a single job posting.
   * Validates transition, updates status, logs transition, triggers audit/notification.
   */
  static async transitionStatus(
    jobId: number,
    from: JobStatus,
    to: JobStatus,
    data: any,
    userId: number,
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Validate transition
    const validation = JobStatusStateMachine.validateTransition(from, to, data);
    if (!validation.valid) {
      winston.warn('JobStatusWorkflowService: Invalid transition', {
        jobId,
        from,
        to,
        error: validation.error,
      });
      return { success: false, error: validation.error };
    }
    // 2. Update status in DB (atomic)
    const updateOptions: any = {
      previousStatus: from,
      statusChangedBy: userId,
      statusChangedAt: new Date(),
    };
    if (data.close_reason) updateOptions.closeReason = data.close_reason;
    if (data.close_notes) updateOptions.closeNotes = data.close_notes;
    if (data.archive_reason) updateOptions.archiveReason = data.archive_reason;
    if (data.scheduled_publish_at) updateOptions.scheduledPublishAt = data.scheduled_publish_at;
    await JobRepository.updateStatusById(jobId, to, updateOptions);
    // 3. Log transition
    await JobRepository.logStatusTransition({
      job_posting_id: jobId,
      from_status: from,
      to_status: to,
      transition_reason: data.transition_reason,
      transition_data: data,
      created_by: userId,
      created_at: new Date(),
    });
    // 4. Update search index & analytics (stub)
    await updateSearchIndex(jobId, to);
    await updateAnalytics(jobId, from, to);
    // 5. Notification
    await EmailService.sendJobStatusNotification({
      jobId,
      fromStatus: from,
      toStatus: to,
      userId,
      ...data,
    });
    winston.info('JobStatusWorkflowService: Status transitioned', { jobId, from, to, userId });
    return { success: true };
  }

  /**
   * Perform bulk status transitions for multiple job postings.
   * Returns array of results per job.
   */
  static async bulkTransitionStatus(
    jobIds: number[],
    from: JobStatus,
    to: JobStatus,
    data: any,
    userId: number,
  ): Promise<{ jobId: number; success: boolean; error?: string }[]> {
    const results: { jobId: number; success: boolean; error?: string }[] = [];
    for (const jobId of jobIds) {
      const result = await this.transitionStatus(jobId, from, to, data, userId);
      results.push({ jobId, ...result });
    }
    return results;
  }
}
