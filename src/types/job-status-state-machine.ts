/**
 * Job Status State Machine Types
 *
 * Defines types for job status state machine transitions.
 *
 * @module types/job-status-state-machine
 */
import { JobStatus } from '@/interfaces/job/job-status-workflow';

export type JobStatusTransition = {
  from: JobStatus;
  to: JobStatus;
  allowed: boolean;
  requiredFields?: string[];
  businessRule?: (data: any) => boolean | string;
};
