/**
 * JobController
 *
 * Handles HTTP requests related to job postings. Acts as an interface between
 * client requests and the JobService business logic.
 *
 * @module controllers/job-controller
 */

import { JobResource } from '@/resources/job-posting-resource';
import { JobService } from '@/services/job-service';
import { AuthenticatedRequest, JsonResponse } from '@/types/express-extension';
import { createInternalError, sendErrorResponse } from '@/utilities/error-handler';

/**
 * Controller for managing job-related routes and logic.
 */
export class JobController {
  /**
   * Create a new job posting.
   *
   * @async
   * @function
   * @param {AuthenticatedRequest} req - The Express request object extended with user authentication
   * @param {JsonResponse} res - The Express response object extended for consistent JSON formatting
   * @returns {Promise<void>} Responds with JSON containing the newly created job or an error
   *
   * @example
   * POST /api/jobs
   * Body:
   * {
   *   "title": "Frontend Developer",
   *   "department_id": 1,
   *   ...
   * }
   *
   * Success Response:
   * {
   *   "status": 201,
   *   "message": "Job posting created successfully",
   *   "data": { ...jobData }
   * }
   *
   * Error Responses:
   * - 401 Unauthorized if user is not authenticated
   * - 422 Validation Failed if input is invalid or department/category is inactive
   * - 500 Internal Server Error for unhandled exceptions
   */
  static async createJobPosting(req: AuthenticatedRequest, res: JsonResponse) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 401,
          message: 'Unauthorized. You must be logged in to create a job posting.',
        });
      }

      const job = await JobService.createJobPosting(req.body, userId);

      return res.status(201).json({
        status: 201,
        message: 'Job posting created successfully',
        data: JobResource.serialize(job),
      });
    } catch (err: any) {
      // Handle known AppError (custom validation, etc.)
      if (err.appError) {
        return sendErrorResponse(res, err.appError);
      }

      // Handle known error with category/type structure
      if (err.category && err.type) {
        return sendErrorResponse(res, err);
      }

      // Fallback to internal server error
      return sendErrorResponse(res, createInternalError(err));
    }
  }
}
