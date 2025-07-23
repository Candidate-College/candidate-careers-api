/**
 * Job Status Workflow Types
 *
 * Defines types and interfaces for job status transitions, workflow, and audit trail.
 *
 * @module interfaces/job/job-status-workflow
 */
export type JobStatus = 'draft' | 'published' | 'closed' | 'archived';
export type JobCloseReason =
  | 'position_filled'
  | 'budget_constraints'
  | 'requirements_changed'
  | 'cancelled';

export interface JobStatusTransitionData {
  job_posting_id: number;
  from_status: JobStatus;
  to_status: JobStatus;
  transition_reason?: string;
  transition_data?: Record<string, any>;
  created_by: number;
  created_at?: Date;
}
