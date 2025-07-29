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
import {
  createError,
  createInternalError,
  ErrorType,
  sendErrorResponse,
} from '@/utilities/error-handler';

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
      if (err.appError) {
        return sendErrorResponse(res, err.appError);
      }

      if (err.category && err.type) {
        return sendErrorResponse(res, err);
      }

      return sendErrorResponse(res, createInternalError(err));
    }
  }

  /**
   * Handles the retrieval of a public job posting by its slug.
   *
   * @param {Request} req - The Express request object.
   * @param {JsonResponse} res - The Express response object.
   * @returns {Promise<void>}
   */
  static async getPublicJobBySlug(req: any, res: JsonResponse) {
    try {
      const { slug } = req.params;
      const trackView = req.query.track_view === 'true';

      const job = await JobService.getPublicJobBySlug(slug, { trackView });

      return res.status(200).json({
        status: 200,
        message: 'Job posting retrieved successfully',
        data: JobResource.getPublicJobBySlugResponse(job),
      });
    } catch (err: any) {
      if (err.appError) {
        return sendErrorResponse(res, err.appError);
      }

      return sendErrorResponse(
        res,
        createError(ErrorType[err.type as keyof typeof ErrorType], err.message),
      );
    }
  }

  static async getJobByUUID(req: AuthenticatedRequest, res: JsonResponse) {
    const rawUuid = req.params.uuid;
    try {
      const sanitizedUuid = rawUuid.replace(/^"|"$/g, '');

      const trackView = req.query.track_view === 'true';
      const include = (req.query.include as string)?.split(',').map(item => item.trim()) ?? [];

      const job = await JobService.getJobByUUID(sanitizedUuid, { trackView, include });

      return res.status(200).json({
        status: 200,
        message: 'Job posting retrieved successfully',
        data: JobResource.getJobByUUIDResponse(job),
      });
    } catch (err: any) {
      if (err.appError) {
        return sendErrorResponse(res, err.appError);
      }

      return sendErrorResponse(
        res,
        createError(
          ErrorType[err.type as keyof typeof ErrorType] || ErrorType.INTERNAL_SERVER_ERROR,
          err?.message,
          err.message,
        ),
      );
    }
  }
}
