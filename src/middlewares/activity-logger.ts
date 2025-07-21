/**
 * Activity Logger Middleware
 *
 * Automatically captures request-level events (API calls, authentication
 * attempts, data modifications, permission changes, etc.) and forwards them to
 * the central `ActivityLogService` as part of the audit-logging subsystem.
 *
 * Logging is performed in a fire-and-forget (non-blocking) manner: the request
 * chain is never delayed by logging, regardless of database or service latency.
 * Errors inside the processor are swallowed after being reported to Winston so
 * that logging failures cannot impact the main request lifecycle.
 *
 * @module middlewares/activity-logger
 */

import { Request } from 'express';
import {
  registerMiddleware,
  createMiddleware,
  InputExtractors,
  MiddlewareConfig,
} from '@/factories/middleware-factory';
import ActivityLogService from '@/services/audit/activity-log-service';
import { defaultWinstonLogger as logger } from '@/utilities/winston-logger';
import { ActivityCategory } from '@/constants/activity-log-constants';
import { AuthenticatedRequest } from '@/types/express-extension';

/* -------------------------------------------------------------------------- */
/*                            Helper Determination                            */
/* -------------------------------------------------------------------------- */

/**
 * Determine the resource type based on the request path. The heuristic takes
 * the first non-empty path segment, e.g. `/api/v1/users/123` ⇒ `users`.
 */
const deriveResourceType = (req: Request): string => {
  const segments = req.path.split('/').filter(Boolean);
  if (segments.length === 0) return 'root';

  // Walk through segments and return first business segment (not meta)
  for (const seg of segments) {
    if (seg === 'api') continue; // API prefix
    if (/^v\d+$/i.test(seg)) continue; // version prefix
    return seg;
  }
  // Fallback if everything is filtered out
  return segments[segments.length - 1] || 'root';
};

/** Identify CRUD-like modifiers based on HTTP method → category mapping. */
const deriveCategory = (req: Request): ActivityCategory => {
  switch (req.method) {
    case 'POST':
      return ActivityCategory.DATA_MODIFICATION;
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      return ActivityCategory.DATA_MODIFICATION;
    default:
      return ActivityCategory.SYSTEM; // safe default
  }
};

/* -------------------------------------------------------------------------- */
/*                         Middleware Factory Definition                       */
/* -------------------------------------------------------------------------- */

const ACTIVITY_LOGGER_NAME = 'activityLogger';

const activityLoggerConfig: MiddlewareConfig<Request, void, Request> = {
  name: ACTIVITY_LOGGER_NAME,
  inputExtractor: InputExtractors.fullRequest,
  processor: (req: Request) => {
    // Fire-and-forget: do not await logging, never block the chain
    (async () => {
      try {
        const user = (req as AuthenticatedRequest).user ?? null;
        const userId = user ? user.id ?? null : null;
        const sessionId = (req.headers['x-session-id'] as string) || null;
        const action = `${req.method} ${req.originalUrl}`;
        const resourceType = deriveResourceType(req);
        const description = `Request ${action}`;
        await ActivityLogService.logActivity({
          userId,
          sessionId,
          action,
          resourceType,
          description,
          ipAddress: req.ip,
          userAgent: (req.headers['user-agent'] as string) || null,
          category: deriveCategory(req),
        });
      } catch (error) {
        logger.error('Activity logging failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
    // Always return immediately
    return;
  },
  continueOnSuccess: true,
  skipOnValidationFailure: true,
};

// Register configuration globally so it can be referenced by name elsewhere
registerMiddleware(ACTIVITY_LOGGER_NAME, activityLoggerConfig);

/**
 * Expose a convenience creator so callers can simply `app.use(activityLogger())`.
 */
export const activityLogger = () => createMiddleware(activityLoggerConfig);

// CommonJS compatibility
exports.activityLogger = activityLogger;
