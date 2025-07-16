/**
 * UserManagementController
 *
 * Maps HTTP requests to UserManagementService methods and formats JSON
 * responses using the project's response middleware helpers attached to `res`.
 *
 * @module src/controllers/user-management-controller
 */

import { Request, Response, NextFunction } from 'express';
import { UserManagementService } from '@/services/user/user-management-service';

export class UserManagementController {
  /** GET /admin/users */
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserManagementService.listUsers(req.query);
      return (res as any).success('Users retrieved successfully', result);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /admin/users/:uuid */
  static async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserManagementService.getUserByUuid(req.params.uuid);
      if (!user) return (res as any).error('User not found', 404);
      return (res as any).success('User retrieved successfully', user);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /admin/users/:uuid/activity */
  static async getUserActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { UserActivityService } = await import('@/services/user/user-activity-service');
      const result = await UserActivityService.getUserActivity(req.params.uuid, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        action: req.query.action as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      });
      return (res as any).success('User activity retrieved successfully', result);
    } catch (err) {
      return next(err);
    }
  }

  /** POST /admin/users */
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserManagementService.createUser(req.body);
      return (res as any).success('User created successfully', user, 201);
    } catch (err) {
      return next(err);
    }
  }
}
