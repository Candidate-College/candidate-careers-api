import { Request, Response, NextFunction } from 'express';
import { JobDeletionService } from '@/services/job-deletion-service';
import { JobPostingRepository } from '@/repositories/job-deletion-repository';
import { sendErrorResponse } from '@/utilities/error-handler';
import { UserData } from '@/models/user-model';
import { JsonResponse } from '@/types/express-extension';

const repo = new JobPostingRepository();
const service = new JobDeletionService(repo);

export class JobDeletionController {
  /**
   * Delete a job posting (soft delete)
   * Route: DELETE /api/v1/job-postings/:uuid
   */
  static async deleteJobPosting(req: Request, res: Response, next: NextFunction) {
    try {
      const jobPostingUuid = req.params.uuid as string;
      // Type assertion to access req.user injected by auth middleware
      const user = (req as any).user as UserData;
      await service.deleteJobPosting(jobPostingUuid, user);
      res.status(204).send();
    } catch (err: any) {
      sendErrorResponse(res as unknown as JsonResponse, err);
    }
  }

  /**
   * Restore a soft-deleted job posting
   * Route: POST /api/v1/job-postings/:uuid/restore
   */
  static async restoreJobPosting(req: Request, res: Response, next: NextFunction) {
    try {
      const jobPostingUuid = req.params.uuid as string;
      // Type assertion to access req.user injected by auth middleware
      const user = (req as any).user as UserData;
      await service.restoreJobPosting(jobPostingUuid, user);
      res.status(200).json({ message: 'Job posting restored successfully.' });
    } catch (err: any) {
      sendErrorResponse(res as unknown as JsonResponse, err);
    }
  }
} 