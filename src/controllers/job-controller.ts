import { JobService } from '@/services/job-service';
import { AuthenticatedRequest } from '@/types/express-extension';
import { Response } from 'express';

export class JobController {
  static async createJobPosting(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      console.log(req.user);

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
        data: {
          id: job.id,
          uuid: job.uuid,
          title: job.title,
          slug: job.slug,
          department_id: job.department_id,
          job_category_id: job.job_category_id,
          job_type: job.job_type,
          employment_level: job.employment_level,
          priority_level: job.priority_level,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities,
          benefits: job.benefits,
          team_info: job.team_info,
          status: job.status,
          views_count: job.views_count,
          applications_count: job.applications_count,
          application_deadline: job.application_deadline,
          max_applications: job.max_applications,
          published_at: job.published_at,
          created_by: job.created_by,
          created_at: job.created_at,
          updated_at: job.updated_at,
        },
      });
    } catch (error: any) {
      // This generic error handling remains the same.
      const err = error as { status?: number; message: string; errors?: any };
      const status = err.status || 500;
      return res.status(status).json({
        message: err.message,
        errors: err.errors,
      });
    }
  }
}
