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
}
