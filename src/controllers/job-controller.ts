import { JobService } from '@/services/job-service';
import { AuthenticatedRequest } from '@/types/express-extension';
import { Response } from 'express';
import { JobResource } from '@/resources/job-posting-resource';

interface ControllerError {
  status?: number;
  message?: string;
  errors?: unknown;
}

export class JobController {
  static async createJobPosting(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 401,
          message: 'Unauthorized. You must be logged in to create a job posting.',
        });
      }

      // 3. Pass the validated user ID to the service.
      const job = await JobService.createJobPosting(req.body, userId);

      // --- End of Fix ---

      return res.status(201).json({
        status: 201,
        message: 'Job posting created successfully',
        data: JobResource.serialize(job),
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object') {
        const errObj = error as ControllerError;
        const status = errObj.status || 500;
        return res.status(status).json({
          message: errObj.message || 'Internal server error',
          errors: errObj.errors,
        });
      }
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
}
