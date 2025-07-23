/**
 * Job Status Workflow Controller
 *
 * Handles API endpoints for job posting status transitions (publish, close, archive, reopen, bulk).
 * Integrates with workflow service, validator, and resource serializer.
 *
 * @module controllers/job-status-workflow-controller
 */
import { Response } from 'express';
import { AuthenticatedRequest } from '@/types/express-extension';
import { JobStatusWorkflowService } from '@/services/job-status-workflow-service';
import { jobStatusWorkflowValidator } from '@/validators/job-status-workflow-validator';
import { defaultWinstonLogger as winston } from '@/utilities/winston-logger';
import { JobRepository } from '@/repositories/job-repository';
import { JobStatus } from '@/interfaces/job/job-status-workflow';
import { Job } from '@/models/job-model';

if (!('findByUuid' in JobRepository)) {
  (JobRepository as any).findByUuid = async (uuid: string) => {
    return await (Job as any).query().where('uuid', uuid).first();
  };
}
if (!('findByUuids' in JobRepository)) {
  (JobRepository as any).findByUuids = async (uuids: string[]) => {
    return await (Job as any).query().whereIn('uuid', uuids);
  };
}

export class JobStatusWorkflowController {
  /**
   * Helper to handle status transitions (publish, close, archive, reopen)
   * @private
   */
  private static async handleStatusTransition(
    req: AuthenticatedRequest,
    res: Response,
    validatorFn: (data: any) => void,
    to: JobStatus,
    operation: string,
  ) {
    winston.info(`JobStatusWorkflowController.${operation}: start`, {
      uuid: req.params.uuid,
      userId: req.user?.id,
    });
    try {
      const { uuid } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 401, message: 'Unauthorized: user not found' });
      }
      const data = req.body;
      validatorFn(data);
      const job = await (JobRepository as any).findByUuid(uuid);
      if (!job) {
        return res.status(404).json({ status: 404, message: 'Job not found' });
      }
      const from: JobStatus = job.status;
      const result = await JobStatusWorkflowService.transitionStatus(
        job.id,
        from,
        to,
        data,
        userId,
      );
      if (!result.success) {
        winston.warn(`${operation} job failed`, { uuid, error: result.error });
        return res.status(409).json({ status: 409, message: result.error });
      }
      winston.info(`JobStatusWorkflowController.${operation}: success`, { uuid, userId });
      return res.status(200).json({
        status: 200,
        message: `Job status changed from ${from} to ${to} successfully`,
        data: {
          transition: {
            from_status: from,
            to_status: to,
          },
        },
      });
    } catch (err: any) {
      winston.error(`${operation} job error`, { error: err.message, stack: err.stack });
      return res.status(500).json({ status: 500, message: err.message || 'Internal server error' });
    }
  }

  /**
   * Publish job posting
   */
  static async publish(req: AuthenticatedRequest, res: Response) {
    return JobStatusWorkflowController.handleStatusTransition(
      req,
      res,
      jobStatusWorkflowValidator.validatePublish,
      'published',
      'publish',
    );
  }

  /**
   * Close job posting
   */
  static async close(req: AuthenticatedRequest, res: Response) {
    return JobStatusWorkflowController.handleStatusTransition(
      req,
      res,
      jobStatusWorkflowValidator.validateClose,
      'closed',
      'close',
    );
  }

  /**
   * Archive job posting
   */
  static async archive(req: AuthenticatedRequest, res: Response) {
    return JobStatusWorkflowController.handleStatusTransition(
      req,
      res,
      jobStatusWorkflowValidator.validateArchive,
      'archived',
      'archive',
    );
  }

  /**
   * Reopen job posting
   */
  static async reopen(req: AuthenticatedRequest, res: Response) {
    return JobStatusWorkflowController.handleStatusTransition(
      req,
      res,
      jobStatusWorkflowValidator.validateReopen,
      'published',
      'reopen',
    );
  }

  /**
   * Bulk status update
   */
  static async bulkStatus(req: AuthenticatedRequest, res: Response) {
    winston.info('JobStatusWorkflowController.bulkStatus: start', { userId: req.user?.id });
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 401, message: 'Unauthorized: user not found' });
      }
      const { job_uuids, target_status, transition_data } = req.body;
      jobStatusWorkflowValidator.validateBulkStatus(req.body);
      const jobs: Job[] = await (JobRepository as any).findByUuids(job_uuids);
      if (!jobs || jobs.length !== job_uuids.length) {
        return res.status(404).json({ status: 404, message: 'One or more jobs not found' });
      }
      const fromStatuses: JobStatus[] = jobs.map((j: Job) => j.status);
      const uniqueFrom = Array.from(new Set(fromStatuses));
      if (uniqueFrom.length !== 1) {
        return res.status(400).json({
          status: 400,
          message: 'All jobs must have the same current status for bulk operation',
        });
      }
      const from: JobStatus = uniqueFrom[0];
      const to: JobStatus = target_status;
      const jobIds = jobs.map((j: Job) => j.id);
      const results = await JobStatusWorkflowService.bulkTransitionStatus(
        jobIds,
        from,
        to,
        transition_data,
        userId,
      );
      winston.info('JobStatusWorkflowController.bulkStatus: success', { userId });
      return res.status(200).json({
        status: 200,
        message: 'Bulk job status update completed',
        data: results,
      });
    } catch (err: any) {
      winston.error('Bulk status job error', { error: err.message, stack: err.stack });
      return res.status(500).json({ status: 500, message: err.message || 'Internal server error' });
    }
  }
}
