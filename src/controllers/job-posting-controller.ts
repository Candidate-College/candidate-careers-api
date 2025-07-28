import { Request, Response, NextFunction } from 'express';
import { JobPostingService } from '@/services/job-posting-service';
import { IJobUpdatePayload, DeleteJobResponse } from '@/interfaces/job/job-posting';
import { sendErrorResponse } from '@/utilities/error-handler';
import { UserData } from '@/models/user-model';
import { JsonResponse } from '@/types/express-extension';
import { toJobUpdateResource } from '@/resources/job-posting-resource';

export class JobPostingController {

  /**
   * Update a job posting
   * Route: PUT /api/v1/jobs/:uuid
   */
  static async updateJobPosting(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new JobPostingService();

      const jobPostingUuid = req.params.uuid as string;
      // Type assertion to access req.user injected by auth middleware
      const user = (req as any).user as UserData;
      const payload = req.body as IJobUpdatePayload;

      const result = await service.updateJobPosting(jobPostingUuid, user, payload);
      const responseData = toJobUpdateResource(result);
      res.status(200).json({
        status: 200,
        message: 'Job posting updated successfully',
        data: responseData,
      });
    } catch (err: any) {
      sendErrorResponse(res as unknown as JsonResponse, err);
    }
  }


  /**
   * Delete a job posting (soft delete)
   * Route: DELETE /api/v1/jobs/:uuid
   */
  static async deleteJobPosting(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new JobPostingService();

      const jobPostingUuid = req.params.uuid as string;
      // Type assertion to access req.user injected by auth middleware
      const user = (req as any).user as UserData;
      
      // Get options from query parameters
      const options = {
        force: req.query.force === 'true',
        preserveApplications: req.query.preserveApplications === 'true',
      };
      
      const result: DeleteJobResponse = await service.deleteJobPosting(jobPostingUuid, user, options);
      
      res.status(200).json({
        status: 200,
        message: 'Job posting deleted successfully',
        data: result,
      });
    } catch (err: any) {
      sendErrorResponse(res as unknown as JsonResponse, err);
    }
  }

  /**
   * Restore a soft-deleted job posting
   * Route: POST /api/v1/jobs/:uuid/restore
   */
  static async restoreJobPosting(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new JobPostingService();

      const jobPostingUuid = req.params.uuid as string;
      // Type assertion to access req.user injected by auth middleware
      const user = (req as any).user as UserData;

      await service.restoreJobPosting(jobPostingUuid, user);

      res.status(200).json({
        status: 200,
        message: 'Job posting restored successfully',
      });
    } catch (err: any) {
      sendErrorResponse(res as unknown as JsonResponse, err);
    }
  }
} 