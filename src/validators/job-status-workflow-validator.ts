/**
 * Job Status Workflow Validator
 *
 * Provides validation logic for job posting status workflow endpoints (publish, close, archive, reopen, bulk).
 *
 * @module validators/job-status-workflow-validator
 */

export const jobStatusWorkflowValidator = {
  validatePublish(data: any) {
    // Example: scheduled_publish_at must be future date if present
    if (data.scheduled_publish_at && new Date(data.scheduled_publish_at) <= new Date()) {
      throw { status: 422, message: 'scheduled_publish_at must be a future date' };
    }
    // Add more validation as needed
  },
  validateClose(data: any) {
    if (!data.close_reason) {
      throw { status: 422, message: 'close_reason is required' };
    }
    if (
      !['position_filled', 'budget_constraints', 'requirements_changed', 'cancelled'].includes(
        data.close_reason,
      )
    ) {
      throw { status: 422, message: 'Invalid close_reason' };
    }
    if (!data.handle_pending_applications) {
      throw { status: 422, message: 'handle_pending_applications is required' };
    }
    if (
      !['reject_all', 'keep_pending', 'manual_review'].includes(data.handle_pending_applications)
    ) {
      throw { status: 422, message: 'Invalid handle_pending_applications' };
    }
    if (data.close_notes && data.close_notes.length > 1000) {
      throw { status: 422, message: 'close_notes max 1000 chars' };
    }
  },
  validateArchive(data: any) {
    if (!data.archive_reason || data.archive_reason.length > 500) {
      throw { status: 422, message: 'archive_reason is required and max 500 chars' };
    }
    if (
      data.retention_period_days &&
      (data.retention_period_days < 1 || data.retention_period_days > 3650)
    ) {
      throw { status: 422, message: 'retention_period_days must be 1-3650' };
    }
  },
  validateReopen(data: any) {
    if (data.new_deadline && new Date(data.new_deadline) <= new Date()) {
      throw { status: 422, message: 'new_deadline must be a future date' };
    }
    // Add more validation as needed
  },
  validateBulkStatus(data: any) {
    if (!Array.isArray(data.job_uuids) || data.job_uuids.length === 0) {
      throw { status: 422, message: 'job_uuids must be a non-empty array' };
    }
    if (data.job_uuids.length > 100) {
      throw { status: 422, message: 'job_uuids max 100 jobs per bulk operation' };
    }
    if (!data.target_status) {
      throw { status: 422, message: 'target_status is required' };
    }
    // Add more validation as needed
  },
};
