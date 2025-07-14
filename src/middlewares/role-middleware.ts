/**
 * Role Authorization Middleware
 *
 * Provides a factory to create Express middleware that enforces a required user
 * role. The middleware assumes that `req.user` is already hydrated by an
 * authentication middleware and that the user object has a `role` property.
 *
 * @module middlewares/role-middleware
 */

import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "@/types/express-extension";
import { defaultWinstonLogger as logger } from "@/utilities/winston-logger";

/**
 * Requires the authenticated user to have a specific role.
 *
 * @param role Required role string (e.g., "super_admin").
 * @returns Express middleware that either forwards or throws 403.
 */
export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      if (userRole !== role) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      return next();
    } catch (err) {
      logger.error("role-middleware@requireRole", { error: err instanceof Error ? err.message : String(err) });
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  };
};

// CommonJS export for compatibility
exports.requireRole = requireRole;
