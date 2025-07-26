import { Request, Response, NextFunction } from 'express';
import { JobCategoryService } from '@/services/job-category-service';
import {
  toJobCategoryResource,
  toJobCategoryListResource,
} from '@/resources/job-category-resource';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '@/types/express-extension';

export class JobCategoryController {
  /** Helper: Extract user or return 401 */
  private static getUserOr401(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user || typeof authReq.user.id !== 'number') {
      res.status(401).json({ status: 401, message: 'Authentication required' });
      return null;
    }
    return authReq.user as import('@/models/user-model').UserData;
  }

  /** Helper: Handle error mapping */
  private static handleError(err: any, res: Response, next: NextFunction) {
    if (err.message?.includes('unique')) {
      return res.status(409).json({ status: 409, message: err.message });
    }
    if (err.message?.includes('active job postings')) {
      return res.status(409).json({ status: 409, message: err.message });
    }
    if (err.message?.includes('not found')) {
      return res.status(404).json({ status: 404, message: err.message });
    }
    if (err.message?.includes('Forbidden')) {
      return res.status(403).json({ status: 403, message: err.message });
    }
    if (err.message?.includes('authentication')) {
      return res.status(401).json({ status: 401, message: err.message });
    }
    return next(err);
  }

  /** Create Job Category */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const user = JobCategoryController.getUserOr401(req, res);
      if (!user) return;
      const jobCategory = await JobCategoryService.createJobCategory(req.body, user);
      return res.status(201).json({
        status: 201,
        message: 'Job category created successfully',
        data: toJobCategoryResource(jobCategory),
      });
    } catch (err: any) {
      return JobCategoryController.handleError(err, res, next);
    }
  }

  /** Get All Job Categories */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const result = await JobCategoryService.listJobCategories(req.query);
      return res.status(200).json({
        status: 200,
        message: 'Job categories retrieved successfully',
        data: toJobCategoryListResource(result),
      });
    } catch (err: any) {
      return next(err);
    }
  }

  /** Get Job Category by ID */
  static async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const jobCategory = await JobCategoryService.getJobCategoryById(Number(req.params.id));
      if (!jobCategory) {
        return res.status(404).json({ status: 404, message: 'Job category not found' });
      }
      return res.status(200).json({
        status: 200,
        message: 'Job category retrieved successfully',
        data: toJobCategoryResource(jobCategory),
      });
    } catch (err: any) {
      return next(err);
    }
  }

  /** Update Job Category */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const user = JobCategoryController.getUserOr401(req, res);
      if (!user) return;
      const jobCategory = await JobCategoryService.updateJobCategory(Number(req.params.id), req.body, user);
      return res.status(200).json({
        status: 200,
        message: 'Job category updated successfully',
        data: toJobCategoryResource(jobCategory),
      });
    } catch (err: any) {
      return JobCategoryController.handleError(err, res, next);
    }
  }

  /** Delete Job Category */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const user = JobCategoryController.getUserOr401(req, res);
      if (!user) return;
      const jobCategory = await JobCategoryService.deleteJobCategory(Number(req.params.id), user);
      return res.status(200).json({
        status: 200,
        message: 'Job category soft deleted successfully',
        data: toJobCategoryResource(jobCategory),
      });
    } catch (err: any) {
      return JobCategoryController.handleError(err, res, next);
    }
  }
} 