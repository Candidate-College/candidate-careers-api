/**
 * Authorization Middleware Factory
 *
 * Provides `authorize(permission: string)` that returns an Express middleware
 * ensuring the authenticated user has the specified permission via
 * `RolePermissionService`. It relies on previous authentication middleware to
 * populate `req.user` with at minimum an `id` field.
 *
 * Design notes:
 * - Guard-clause style for early exit (401/403) to minimise nesting.
 * - Uses Winston logger for audit trail.
 * - Injects `RolePermissionService` class for easier mocking in tests. Default
 *   param keeps public API simple (`authorize('perm')`).
 * - File size kept < 300 LoC including docs.
 *
 * @module middlewares/authorization/authorize
 */

import { NextFunction, Response } from 'express';
import { RolePermissionService } from '@/services/rbac/role-permission-service';
import { defaultLogger as logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/types/express-extension';

/** Custom 401/403 responses helper */
const sendError = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, message });

/**
 * Factory producing Express middleware that checks for a specific permission.
 *
 * @param permission Required permission slug to access the endpoint.
 * @param service    Optional RolePermissionService override for testing.
 */
export const authorize = (
  permission: string,
  service: typeof RolePermissionService = RolePermissionService,
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        logger.warn('authorize: unauthenticated access', { permission });
        return sendError(res, 401, 'Unauthenticated');
      }

            // Ensure user.id is present; strict equality guards against undefined/null explicitly.
            if (user.id === null || user.id === undefined) {
        logger.warn('authorize: user id missing', { permission });
        return sendError(res, 401, 'Unauthenticated');
      }

      const allowed = await service.hasPermission(user.id, permission);
      if (!allowed) {
        logger.info('authorize: forbidden', { userId: user.id, permission });
        return sendError(res, 403, 'Forbidden');
      }

      return next();
    } catch (err) {
      logger.error('authorize: server error', {
        error: err instanceof Error ? err.message : String(err),
      });
      return sendError(res, 500, 'Server Error');
    }
  };
};

// CommonJS default export for legacy require()
module.exports = { authorize };
