import { Request, Response } from 'express';
import { JobCategoryService } from '@/services/job-category-service';
import {
  toJobCategoryResource,
  toJobCategoryListResource,
} from '@/resources/job-category-resource';
import { AuthenticatedRequest, JsonResponse } from '@/types/express-extension';
import { 
  sendErrorResponse, 
  createInternalError 
} from '@/utilities/error-handler';

/**
 * Job Category Controller
 * 
 * Handles HTTP requests for job category operations.
 * Uses centralized error handling and relies on middleware for validation and authentication.
 * 
 * @module controllers/job-category-controller
 */
export class JobCategoryController {
  /**
   * Create Job Category
   * 
   * Creates a new job category. Requires authentication and job_categories.create permission.
   * Validation and authentication are handled by middleware.
   * 
   * @param req - Express request object (with user from auth middleware)
   * @param res - Express response object
   */
  static async create(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 401,
          message: 'Unauthorized. You must be logged in to create a job category.',
        });
      }
      
      const jobCategory = await JobCategoryService.createJobCategory(req.body, userId);
      
      return res.status(201).json({
        status: 201,
        message: 'Job category created successfully',
        data: toJobCategoryResource(jobCategory),
      });
    } catch (err: any) {
      // Handle custom error classes with appError property
      if (err.appError) {
        return sendErrorResponse(res as JsonResponse, err.appError);
      }

      // Fallback to internal server error
      return sendErrorResponse(res as JsonResponse, createInternalError(err));
    }
  }

  /**
   * Get All Job Categories
   * 
   * Retrieves a list of job categories with optional filtering and pagination.
   * Validation is handled by middleware.
   * 
   * @param req - Express request object
   * @param res - Express response object
   */
  static async list(req: Request, res: Response) {
    try {
      const result = await JobCategoryService.listJobCategories(req.query);
      
      return res.status(200).json({
        status: 200,
        message: 'Job categories retrieved successfully',
        data: toJobCategoryListResource(result),
      });
    } catch (err: any) {
      // Handle custom error classes with appError property
      if (err.appError) {
        return sendErrorResponse(res as JsonResponse, err.appError);
      }

      // Fallback to internal server error
      return sendErrorResponse(res as JsonResponse, createInternalError(err));
    }
  }

  /**
   * Get Job Category by ID
   * 
   * Retrieves a specific job category by its ID.
   * Validation is handled by middleware.
   * 
   * @param req - Express request object
   * @param res - Express response object
   */
  static async detail(req: Request, res: Response) {
    try {
      const jobCategory = await JobCategoryService.getJobCategoryById(Number(req.params.id));
      
      if (!jobCategory) {
        return res.status(404).json({ 
          status: 404, 
          message: 'Job category not found' 
        });
      }
      
      return res.status(200).json({
        status: 200,
        message: 'Job category retrieved successfully',
        data: toJobCategoryResource(jobCategory),
      });
    } catch (err: any) {
      // Handle custom error classes with appError property
      if (err.appError) {
        return sendErrorResponse(res as JsonResponse, err.appError);
      }

      // Fallback to internal server error
      return sendErrorResponse(res as JsonResponse, createInternalError(err));
    }
  }

  /**
   * Update Job Category
   * 
   * Updates an existing job category. Requires authentication and job_categories.update permission.
   * Validation and authentication are handled by middleware.
   * 
   * @param req - Express request object (with user from auth middleware)
   * @param res - Express response object
   */
  static async update(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 401,
          message: 'Unauthorized. You must be logged in to update a job category.',
        });
      }
      
      const jobCategory = await JobCategoryService.updateJobCategory(Number(req.params.id), req.body, userId);
      
      return res.status(200).json({
        status: 200,
        message: 'Job category updated successfully',
        data: toJobCategoryResource(jobCategory),
      });
    } catch (err: any) {
      // Handle custom error classes with appError property
      if (err.appError) {
        return sendErrorResponse(res as JsonResponse, err.appError);
      }

      // Fallback to internal server error
      return sendErrorResponse(res as JsonResponse, createInternalError(err));
    }
  }

  /**
   * Delete Job Category
   * 
   * Deletes a job category. Requires authentication and job_categories.delete permission.
   * Validation and authentication are handled by middleware.
   * 
   * @param req - Express request object (with user from auth middleware)
   * @param res - Express response object
   */
  static async delete(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 401,
          message: 'Unauthorized. You must be logged in to delete a job category.',
        });
      }
      
      const jobCategory = await JobCategoryService.deleteJobCategory(Number(req.params.id), userId);
      
      return res.status(200).json({
        status: 200,
        message: 'Job category deleted successfully',
        data: toJobCategoryResource(jobCategory),
      });
    } catch (err: any) {
      // Handle custom error classes with appError property
      if (err.appError) {
        return sendErrorResponse(res as JsonResponse, err.appError);
      }

      // Fallback to internal server error
      return sendErrorResponse(res as JsonResponse, createInternalError(err));
    }
  }
} 