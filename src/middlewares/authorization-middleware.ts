/**
 * Authorization Middleware
 *
 * @module middlewares/authorizationMiddleware
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types/express-extension';

export interface RoleSchema {
  only?: string[] | string;
  except?: string[] | string;
};

exports.checkRole = (schema: RoleSchema) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !user.role) {
      return res.status(401).json({ error: 'Unauthorized: missing user or role' });
    }

    const role = user.role.name ?? 'guest';

    // Blocked roles
    if (schema.except?.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: role not allowed' });
    }

    // Allowed roles
    if (schema.only && !schema.only.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: role not permitted' });
    }

    next();
  };
};
