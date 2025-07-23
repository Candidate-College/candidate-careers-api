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
   * Publish job posting
   */
  static async publish(req: AuthenticatedRequest, res: Response) {
    winston.info('JobStatusWorkflowController.publish: start', {
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
      jobStatusWorkflowValidator.validatePublish(data);
      const job = await (JobRepository as any).findByUuid(uuid);
      if (!job) {
        return res.status(404).json({ status: 404, message: 'Job not found' });
      }
      const from: JobStatus = job.status;
      const to: JobStatus = 'published';
      const result = await JobStatusWorkflowService.transitionStatus(
        job.id,
        from,
        to,
        data,
        userId,
      );
      if (!result.success) {
        winston.warn('Publish job failed', { uuid, error: result.error });
        return res.status(409).json({ status: 409, message: result.error });
      }
      winston.info('JobStatusWorkflowController.publish: success', { uuid, userId });
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
      winston.error('Publish job error', { error: err.message, stack: err.stack });
      return res.status(500).json({ status: 500, message: err.message || 'Internal server error' });
    }
  }

  /**
   * Close job posting
   */
  static async close(req: AuthenticatedRequest, res: Response) {
    winston.info('JobStatusWorkflowController.close: start', {
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
      jobStatusWorkflowValidator.validateClose(data);
      const job = await (JobRepository as any).findByUuid(uuid);
      if (!job) {
        return res.status(404).json({ status: 404, message: 'Job not found' });
      }
      const from: JobStatus = job.status;
      const to: JobStatus = 'closed';
      const result = await JobStatusWorkflowService.transitionStatus(
        job.id,
        from,
        to,
        data,
        userId,
      );
      if (!result.success) {
        winston.warn('Close job failed', { uuid, error: result.error });
        return res.status(409).json({ status: 409, message: result.error });
      }
      winston.info('JobStatusWorkflowController.close: success', { uuid, userId });
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
      winston.error('Close job error', { error: err.message, stack: err.stack });
      return res.status(500).json({ status: 500, message: err.message || 'Internal server error' });
    }
  }

  /**
   * Archive job posting
   */
  static async archive(req: AuthenticatedRequest, res: Response) {
    winston.info('JobStatusWorkflowController.archive: start', {
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
      jobStatusWorkflowValidator.validateArchive(data);
      const job = await (JobRepository as any).findByUuid(uuid);
      if (!job) {
        return res.status(404).json({ status: 404, message: 'Job not found' });
      }
      const from: JobStatus = job.status;
      const to: JobStatus = 'archived';
      const result = await JobStatusWorkflowService.transitionStatus(
        job.id,
        from,
        to,
        data,
        userId,
      );
      if (!result.success) {
        winston.warn('Archive job failed', { uuid, error: result.error });
        return res.status(409).json({ status: 409, message: result.error });
      }
      winston.info('JobStatusWorkflowController.archive: success', { uuid, userId });
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
      winston.error('Archive job error', { error: err.message, stack: err.stack });
      return res.status(500).json({ status: 500, message: err.message || 'Internal server error' });
    }
  }

  /**
   * Reopen job posting
   */
  static async reopen(req: AuthenticatedRequest, res: Response) {
    winston.info('JobStatusWorkflowController.reopen: start', {
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
      jobStatusWorkflowValidator.validateReopen(data);
      const job = await (JobRepository as any).findByUuid(uuid);
      if (!job) {
        return res.status(404).json({ status: 404, message: 'Job not found' });
      }
      const from: JobStatus = job.status;
      const to: JobStatus = 'published';
      const result = await JobStatusWorkflowService.transitionStatus(
        job.id,
        from,
        to,
        data,
        userId,
      );
      if (!result.success) {
        winston.warn('Reopen job failed', { uuid, error: result.error });
        return res.status(409).json({ status: 409, message: result.error });
      }
      winston.info('JobStatusWorkflowController.reopen: success', { uuid, userId });
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
      winston.error('Reopen job error', { error: err.message, stack: err.stack });
      return res.status(500).json({ status: 500, message: err.message || 'Internal server error' });
    }
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
        return res
          .status(400)
          .json({
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
