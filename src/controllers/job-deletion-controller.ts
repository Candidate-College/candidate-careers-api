import { Response, NextFunction } from 'express';
import { JobDeletionService, DeleteJobResponse, DeleteJobOptions } from '@/services/job-deletion-service';
import { JobPostingRepository } from '@/repositories/job-posting-repository';
import { sendErrorResponse, createInternalError, AppError } from '@/utilities/error-handler';
import { UserData } from '@/models/user-model';
import { JsonResponse, AuthenticatedRequest } from '@/types/express-extension';

// Extend AuthenticatedRequest for job-specific params
interface JobDeletionRequest extends AuthenticatedRequest {
  params: {
    uuid: string;
  };
}

const repo = new JobPostingRepository();
const service = new JobDeletionService(repo);

export class JobDeletionController {
  /**
   * Delete a job posting (soft delete)
   * Route: DELETE /api/v1/jobs/:uuid
   */
  static async deleteJobPosting(req: JobDeletionRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobPostingUuid: string = req.params.uuid;
      const user: UserData = req.user as UserData; // Type assertion since middleware ensures user exists
      
      // Get options from query parameters with proper type checking
      const options: DeleteJobOptions = {
        force: req.query.force === 'true',
        preserveApplications: req.query.preserveApplications === 'true',
      };
      
      const result: DeleteJobResponse = await service.deleteJobPosting(jobPostingUuid, user, options);
      
      const response = {
        status: 200,
        message: 'Job posting deleted successfully',
        data: result,
      };
      
      res.status(200).json(response);
    } catch (error: unknown) {
      // Handle different types of errors properly
      if (error && typeof error === 'object' && 'statusCode' in error) {
        // This is an AppError from our error handler
        sendErrorResponse(res as JsonResponse, error as AppError);
      } else {
        // This is an unexpected error, create internal error
        const internalError = createInternalError(error);
        sendErrorResponse(res as JsonResponse, internalError);
      }
    }
  }

  /**
   * Restore a soft-deleted job posting
   * Route: POST /api/v1/jobs/:uuid/restore
   */
  static async restoreJobPosting(req: JobDeletionRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobPostingUuid: string = req.params.uuid;
      const user: UserData = req.user as UserData; // Type assertion since middleware ensures user exists
      
      await service.restoreJobPosting(jobPostingUuid, user);
      
      const response = {
        status: 200,
        message: 'Job posting restored successfully',
        data: null,
      };
      
      res.status(200).json(response);
    } catch (error: unknown) {
      // Handle different types of errors properly
      if (error && typeof error === 'object' && 'statusCode' in error) {
        // This is an AppError from our error handler
        sendErrorResponse(res as JsonResponse, error as AppError);
      } else {
        // This is an unexpected error, create internal error
        const internalError = createInternalError(error);
        sendErrorResponse(res as JsonResponse, internalError);
      }
    }
  }
} 