/**
 * Job Status State Machine Constants
 *
 * Defines the state transition matrix for job status workflow.
 *
 * @module constants/job-status-state-machine
 */
import { JobStatusTransition } from '@/types/job-status-state-machine';

export const TRANSITIONS: JobStatusTransition[] = [
  { from: 'draft', to: 'published', allowed: true },
  { from: 'draft', to: 'archived', allowed: true, requiredFields: ['archive_reason'] },
  {
    from: 'published',
    to: 'closed',
    allowed: true,
    requiredFields: ['close_reason', 'handle_pending_applications'],
  },
  {
    from: 'published',
    to: 'archived',
    allowed: true,
    requiredFields: ['archive_reason'],
    businessRule: data =>
      !data.hasPendingApplications || 'Cannot archive with pending applications',
  },
  { from: 'closed', to: 'published', allowed: true }, // reopen
  { from: 'closed', to: 'archived', allowed: true, requiredFields: ['archive_reason'] },
  // Forbidden transitions
  { from: 'published', to: 'draft', allowed: false },
  { from: 'archived', to: 'published', allowed: false },
  { from: 'archived', to: 'closed', allowed: false },
  { from: 'archived', to: 'draft', allowed: false },
];
