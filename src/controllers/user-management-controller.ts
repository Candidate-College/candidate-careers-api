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
import { AuthenticatedRequest, JsonResponse } from '@/types/express-extension';

export class UserManagementController {
  /** GET /admin/users */
  static async listUsers(req: Request, res: JsonResponse, next: NextFunction) {
    try {
      const result = await UserManagementService.listUsers(req.query);
      return res.success('Users retrieved successfully', result);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /admin/users/:uuid */
  static async getUserDetail(req: Request, res: JsonResponse, next: NextFunction) {
    try {
      const user = await UserManagementService.getUserByUuid(req.params.uuid);
      if (!user) return res.error(404, 'User not found');
      return res.success('User retrieved successfully', user);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /admin/users/:uuid/activity */
  static async getUserActivity(req: Request, res: JsonResponse, next: NextFunction) {
    try {
      const { UserActivityService } = await import('@/services/user/user-activity-service');
      const result = await UserActivityService.getUserActivity(req.params.uuid, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        action: req.query.action as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      });
      return res.success('User activity retrieved successfully', result);
    } catch (err) {
      return next(err);
    }
  }

  /** POST /admin/users */
  static async createUser(req: Request, res: JsonResponse, next: NextFunction) {
    try {
      const user = await UserManagementService.createUser(req.body);
      return res.success('User created successfully', user);
    } catch (err) {
      return next(err);
    }
  }

  /** PUT /admin/users/:uuid */
  static async updateUser(req: AuthenticatedRequest, res: JsonResponse, next: NextFunction) {
    try {
      const { uuid } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.error(401, 'Unauthorized');
      }

      const user = await UserManagementService.updateUser(uuid, req.body, adminId);
      return res.success('User updated successfully', user);
    } catch (err) {
      return next(err);
    }
  }

  /** DELETE /admin/users/:uuid */
  static async deleteUser(req: AuthenticatedRequest, res: JsonResponse, next: NextFunction) {
    try {
      const { uuid } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.error(401, 'Unauthorized');
      }

      const result = await UserManagementService.deleteUser(uuid, req.body, adminId);
      return res.success('User deleted successfully', result);
    } catch (err) {
      return next(err);
    }
  }

  /** POST /admin/users/bulk */
  static async bulkUserOperations(
    req: AuthenticatedRequest,
    res: JsonResponse,
    next: NextFunction,
  ) {
    try {
      const { action, user_uuids, params } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.error(401, 'Unauthorized');
      }

      const result = await UserManagementService.bulkUserOperations(
        action,
        user_uuids,
        params,
        adminId,
      );
      return res.success('Bulk operation completed successfully', result);
    } catch (err) {
      return next(err);
    }
  }

  /** POST /admin/users/:uuid/reset-password */
  static async resetUserPassword(req: Request, res: JsonResponse, next: NextFunction) {
    try {
      const { uuid } = req.params;
      const result = await UserManagementService.resetUserPassword(uuid, req.body);
      return res.success('Password reset successfully', result);
    } catch (err) {
      return next(err);
    }
  }

  /** POST /admin/users/:uuid/impersonate */
  static async impersonateUser(req: AuthenticatedRequest, res: JsonResponse, next: NextFunction) {
    try {
      const { uuid } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.error(401, 'Unauthorized');
      }

      const { UserImpersonationService } = await import(
        '@/services/user/user-impersonation-service'
      );
      const result = await UserImpersonationService.createImpersonationToken(
        adminId,
        uuid,
        req.body,
      );

      // Generate access token for the target user
      const targetUser = await UserManagementService.getUserByUuid(uuid);
      const accessToken = UserImpersonationService.generateImpersonationAccessToken(targetUser);

      return res.success('Impersonation started successfully', {
        ...result,
        access_token: accessToken,
      });
    } catch (err) {
      return next(err);
    }
  }

  /** GET /admin/users/search */
  static async searchUsers(req: Request, res: JsonResponse, next: NextFunction) {
    try {
      const { UserSearchService } = await import('@/services/user/user-search-service');
      const result = await UserSearchService.searchUsers(req.query);
      return res.success('Users found successfully', result);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /admin/users/search/suggestions */
  static async getSearchSuggestions(req: Request, res: JsonResponse, next: NextFunction) {
    try {
      const { q, limit } = req.query;
      const { UserSearchService } = await import('@/services/user/user-search-service');
      const suggestions = await UserSearchService.getSearchSuggestions(
        q as string,
        Number(limit) || 10,
      );
      return res.success('Search suggestions retrieved successfully', { suggestions });
    } catch (err) {
      return next(err);
    }
  }

  /** GET /admin/users/statistics */
  static async getUserStatistics(req: Request, res: JsonResponse, next: NextFunction) {
    try {
      const { UserSearchService } = await import('@/services/user/user-search-service');
      const statistics = await UserSearchService.getUserStatistics();
      return res.success('User statistics retrieved successfully', { statistics });
    } catch (err) {
      return next(err);
    }
  }
}
