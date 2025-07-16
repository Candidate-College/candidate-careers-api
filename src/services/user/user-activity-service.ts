/**
 * UserActivityService
 *
 * Provides helper methods to fetch activity history for a single user and to
 * log additional activity entries triggered by higher-level services (e.g.
 * impersonation). Relies on `activity_logs` table which is already used by the
 * audit logging middleware.
 */

import { raw } from 'objection';
import { paginate, PaginatedResult } from '@/utilities/pagination';

export interface ActivityFilters {
  page?: number;
  limit?: number;
  action?: string; // filter by action type (LOGIN, UPDATE_USER, etc.)
  from?: string;   // ISO date from
  to?: string;     // ISO date to
}

export class UserActivityService {
  /**
   * Return paginated activity logs for a user, ordered by created_at desc.
   */
  static async getUserActivity(
    userUuid: string,
    filters: ActivityFilters = {}
  ): Promise<PaginatedResult<any>> {
    const { page, limit, action, from, to } = filters;

    const ActivityLog = (await import('@/models/activity-log-model')).ActivityLog;

    let qb = ActivityLog.query()
      .where('user_uuid', userUuid)
      .orderBy('created_at', 'desc');

    if (action) qb = qb.where('action', action);
    if (from) qb = qb.where('created_at', '>=', new Date(from).toISOString());
    if (to) qb = qb.where('created_at', '<=', new Date(to).toISOString());

    return paginate(qb, { page, pageSize: limit });
  }

  /**
   * Convenience helper to insert a new activity log entry.
   */
  static async logActivity(params: {
    userId?: number;
    userUuid: string;
    actorId: number | null; // admin / system id
    actorType: 'user' | 'admin' | 'system';
    action: string;
    metadata?: Record<string, any>;
  }) {
    const ActivityLog = (await import('@/models/activity-log-model')).ActivityLog;
    await ActivityLog.query().insert({
      ...params,
      created_at: raw('now()'),
    });
  }
}
