/**
 * Job Status State Machine
 *
 * Implements the state matrix, transition validation, and business rules for job posting status workflow.
 * Provides a single-responsibility, reusable, and testable state machine for job status transitions.
 *
 * @module services/job-status-state-machine
 */
import { JobStatus } from '@/interfaces/job/job-status-workflow';
import { TRANSITIONS } from '@/constants/job-status-state-machine';

export class JobStatusStateMachine {
  /**
   * Validate if a status transition is allowed and meets business rules.
   * @param from Current status
   * @param to Target status
   * @param data Additional data (fields, business context)
   * @returns { valid: boolean, error?: string, requiredFields?: string[] }
   */
  static validateTransition(
    from: JobStatus,
    to: JobStatus,
    data: any = {},
  ): { valid: boolean; error?: string; requiredFields?: string[] } {
    const rule = TRANSITIONS.find(t => t.from === from && t.to === to);
    if (!rule || !rule.allowed) {
      return { valid: false, error: `Transition from ${from} to ${to} is not allowed.` };
    }
    if (rule.requiredFields) {
      for (const field of rule.requiredFields) {
        if (!data[field]) {
          return {
            valid: false,
            error: `Field '${field}' is required for this transition.`,
            requiredFields: rule.requiredFields,
          };
        }
      }
    }
    if (rule.businessRule) {
      const result = rule.businessRule(data);
      if (result !== true) {
        return {
          valid: false,
          error: typeof result === 'string' ? result : 'Business rule validation failed.',
        };
      }
    }
    return { valid: true };
  }

  /**
   * Get all valid next statuses from a given status.
   */
  static getNextStatuses(from: JobStatus): JobStatus[] {
    return TRANSITIONS.filter(t => t.from === from && t.allowed).map(t => t.to);
  }

  /**
   * Get required fields for a transition.
   */
  static getRequiredFields(from: JobStatus, to: JobStatus): string[] | undefined {
    const rule = TRANSITIONS.find(t => t.from === from && t.to === to);
    return rule?.requiredFields;
  }
}
