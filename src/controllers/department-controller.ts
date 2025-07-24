import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '@/services/department-service';
import {
  toDepartmentResource,
  toDepartmentListResource,
} from '@/resources/department-resource';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '@/types/express-extension';

export class DepartmentController {
  /**
   * Helper: Extract user or return 401
   */
  private static getUserOr401(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user || typeof authReq.user.id !== 'number') {
      res.status(401).json({ status: 401, message: 'Authentication required' });
      return null;
    }
    return authReq.user as import('@/models/user-model').UserData;
  }

  /**
   * Helper: Handle error mapping
   */
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

  /**
   * Create Department
   * POST /api/v1/departments
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const user = DepartmentController.getUserOr401(req, res);
      if (!user) return;
      const department = await DepartmentService.createDepartment(req.body, user);
      return res.status(201).json({
        status: 201,
        message: 'Department created successfully',
        data: toDepartmentResource(department),
      });
    } catch (err: any) {
      return DepartmentController.handleError(err, res, next);
    }
  }

  /**
   * Get All Departments
   * GET /api/v1/departments
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const result = await DepartmentService.listDepartments(req.query);
      return res.status(200).json({
        status: 200,
        message: 'Departments retrieved successfully',
        data: toDepartmentListResource(result),
      });
    } catch (err: any) {
      return next(err);
    }
  }

  /**
   * Get Department by ID
   * GET /api/v1/departments/:id
   */
  static async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const user = DepartmentController.getUserOr401(req, res);
      if (!user) return;
      const department = await DepartmentService.getDepartmentById(Number(req.params.id));
      if (!department) {
        return res.status(404).json({ status: 404, message: 'Department not found' });
      }
      return res.status(200).json({
        status: 200,
        message: 'Department retrieved successfully',
        data: toDepartmentResource(department),
      });
    } catch (err: any) {
      return next(err);
    }
  }

  /**
   * Update Department
   * PUT /api/v1/departments/:id
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const user = DepartmentController.getUserOr401(req, res);
      if (!user) return;
      const department = await DepartmentService.updateDepartment(Number(req.params.id), req.body, user);
      return res.status(200).json({
        status: 200,
        message: 'Department updated successfully',
        data: toDepartmentResource(department),
      });
    } catch (err: any) {
      return DepartmentController.handleError(err, res, next);
    }
  }

  /**
   * Delete Department
   * DELETE /api/v1/departments/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ status: 422, message: 'Validation error', errors: errors.array() });
      }
      const user = DepartmentController.getUserOr401(req, res);
      if (!user) return;
      const department = await DepartmentService.deleteDepartment(Number(req.params.id), user);
      return res.status(200).json({
        status: 200,
        message: 'Department soft deleted successfully',
        data: toDepartmentResource(department),
      });
    } catch (err: any) {
      return DepartmentController.handleError(err, res, next);
    }
  }
} 