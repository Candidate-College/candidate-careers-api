/**
 * Audit Controller
 *
 * Provides admin-only handlers for audit log management and analytics:
 * – list audit logs, single log detail, user activity history
 * – statistics aggregation, dashboard metrics
 *
 * Delegates heavy lifting to the existing ActivityRetrievalService and
 * ActivityAnalyticsService, keeping this controller lightweight and focused on
 * HTTP semantics.
 *
 * @module controllers/audit-controller
 */

import { Request, Response } from 'express';
import { JsonResponse } from '@/types/express-extension';
import { ActivityRetrievalService } from '@/services/audit/activity-retrieval-service';
import { ActivityAnalyticsService } from '@/services/audit/activity-analytics-service';
import { defaultWinstonLogger as logger } from '@/utilities/winston-logger';
import { StatisticsFilters, StatisticsPeriod, GroupByOption } from '@/types/activity-analytics';
import { ActivityCategory, ActivitySeverity } from '@/constants/activity-log-constants';

/**
 * GET /admin/audit/logs
 */
exports.listLogs = async (req: Request, res: Response) => {
  try {
    const data = await ActivityRetrievalService.getActivityLogs({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.perPage ? Number(req.query.perPage) : undefined,
      userId: req.query.user_id ? Number(req.query.user_id) : undefined,
      category: req.query.category as ActivityCategory | undefined,
      severity: req.query.severity as ActivitySeverity | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    });
    return (res as unknown as JsonResponse).success('Successfully fetched audit logs', data);
  } catch (err: any) {
    logger.error('audit-controller@listLogs', err);
    return (res as unknown as JsonResponse).error(500, 'Failed to fetch audit logs');
  }
};

/**
 * GET /admin/audit/logs/:id
 */
exports.getLogById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const log = await ActivityRetrievalService.getActivityById(Number(id));
    if (!log) return (res as unknown as JsonResponse).error(404, 'Audit log not found');
    return (res as unknown as JsonResponse).success('Successfully fetched audit log', log);
  } catch (err: any) {
    logger.error('audit-controller@getLogById', err);
    return (res as unknown as JsonResponse).error(500, 'Failed to fetch audit log');
  }
};

/**
 * GET /admin/audit/users/:uuid/activity
 */
exports.getUserActivity = async (req: Request, res: Response) => {
  const { uuid } = req.params;
  try {
    const data = await ActivityRetrievalService.getUserActivityHistory(Number(uuid), {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.perPage ? Number(req.query.perPage) : undefined,
    });
    return (res as unknown as JsonResponse).success(
      'Successfully fetched user activity history',
      data,
    );
  } catch (err: any) {
    logger.error('audit-controller@getUserActivity', err);
    return (res as unknown as JsonResponse).error(500, 'Failed to fetch user activity');
  }
};

/**
 * GET /admin/audit/statistics
 */
exports.getStatistics = async (req: Request, res: Response) => {
  const filters: StatisticsFilters = {
    period: req.query.period as StatisticsPeriod | undefined,
    groupBy: req.query.groupBy as GroupByOption | undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
  };
  try {
    const result = await ActivityAnalyticsService.getActivityStatistics(filters);
    return result.success
      ? (res as unknown as JsonResponse).success('Successfully generated statistics', result.data)
      : (res as unknown as JsonResponse).error(
          500,
          result.error ?? 'Failed to generate statistics',
        );
  } catch (err: any) {
    logger.error('audit-controller@getStatistics', err);
    return (res as unknown as JsonResponse).error(500, 'Failed to generate statistics');
  }
};

/**
 * GET /admin/audit/dashboard
 */
exports.getDashboard = async (_req: Request, res: Response) => {
  try {
    const result = await ActivityAnalyticsService.getDashboardData();
    return result.success
      ? (res as unknown as JsonResponse).success(
          'Successfully generated dashboard data',
          result.data,
        )
      : (res as unknown as JsonResponse).error(
          500,
          result.error ?? 'Failed to generate dashboard data',
        );
  } catch (err: any) {
    logger.error('audit-controller@getDashboard', err);
    return (res as unknown as JsonResponse).error(500, 'Failed to generate dashboard data');
  }
};
