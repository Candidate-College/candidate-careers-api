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
import { JobStatusWorkflowResource } from '@/resources/job-status-workflow-resource';
import { defaultWinstonLogger as winston } from '@/utilities/winston-logger';
import { JobRepository } from '@/repositories/job-repository';
import { JobStatus } from '@/interfaces/job/job-status-workflow';
import { Job } from '@/models/job-model';

// Polyfill for JobRepository.findByUuid and findByUuids if not present
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
    try {
      const { uuid } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 401, message: 'Unauthorized: user not found' });
      }
      const data = req.body;
      jobStatusWorkflowValidator.validatePublish(data);
      // Lookup job by uuid, get current status
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
      return res.status(200).json(JobStatusWorkflowResource.successResponse(to, from));
    } catch (err: any) {
      winston.error('Publish job error', { error: err.message });
      return res.status(500).json({ status: 500, message: err.message });
    }
  }

  /**
   * Close job posting
   */
  static async close(req: AuthenticatedRequest, res: Response) {
    try {
      const { uuid } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 401, message: 'Unauthorized: user not found' });
      }
      const data = req.body;
      jobStatusWorkflowValidator.validateClose(data);
      // Lookup job by uuid, get current status
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
      return res.status(200).json(JobStatusWorkflowResource.successResponse(to, from));
    } catch (err: any) {
      winston.error('Close job error', { error: err.message });
      return res.status(500).json({ status: 500, message: err.message });
    }
  }

  /**
   * Archive job posting
   */
  static async archive(req: AuthenticatedRequest, res: Response) {
    try {
      const { uuid } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 401, message: 'Unauthorized: user not found' });
      }
      const data = req.body;
      jobStatusWorkflowValidator.validateArchive(data);
      // Lookup job by uuid, get current status
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
      return res.status(200).json(JobStatusWorkflowResource.successResponse(to, from));
    } catch (err: any) {
      winston.error('Archive job error', { error: err.message });
      return res.status(500).json({ status: 500, message: err.message });
    }
  }

  /**
   * Reopen job posting
   */
  static async reopen(req: AuthenticatedRequest, res: Response) {
    try {
      const { uuid } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 401, message: 'Unauthorized: user not found' });
      }
      const data = req.body;
      jobStatusWorkflowValidator.validateReopen(data);
      // Lookup job by uuid, get current status
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
      return res.status(200).json(JobStatusWorkflowResource.successResponse(to, from));
    } catch (err: any) {
      winston.error('Reopen job error', { error: err.message });
      return res.status(500).json({ status: 500, message: err.message });
    }
  }

  /**
   * Bulk status update
   */
  static async bulkStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 401, message: 'Unauthorized: user not found' });
      }
      const { job_uuids, target_status, transition_data } = req.body;
      jobStatusWorkflowValidator.validateBulkStatus(req.body);
      // Lookup jobs by uuids, get current status for each
      const jobs: Job[] = await (JobRepository as any).findByUuids(job_uuids);
      if (!jobs || jobs.length !== job_uuids.length) {
        return res.status(404).json({ status: 404, message: 'One or more jobs not found' });
      }
      // For demo, assume all from published, but here we get actual status
      const fromStatuses: JobStatus[] = jobs.map((j: Job) => j.status);
      // Only allow bulk if all jobs have the same from status (for simplicity)
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
      return res.status(200).json(JobStatusWorkflowResource.bulkResponse(results));
    } catch (err: any) {
      winston.error('Bulk status job error', { error: err.message });
      return res.status(500).json({ status: 500, message: err.message });
    }
  }
}
