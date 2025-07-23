/**
 * Job Analytics Routes (v1)
 *
 * Mounts endpoints for job, bulk, department, and platform analytics.
 * Integrates RBAC, authentication, and validation middleware.
 *
 * @module routes/v1/job-analytics-routes
 */

const router = require('express').Router();
const { accessToken } = require('../../middlewares/auth-middleware');
const { authorize } = require('../../middlewares/authorization/authorize');
const validate = require('../../middlewares/request-validation-middleware');
const fields = require('../../validators/job-analytics-validator');
const { JobAnalyticsController } = require('../../controllers/job-analytics-controller');

// RBAC: analytics.view required for all endpoints
router.use(accessToken, authorize('analytics.view'));

// GET /api/v1/jobs/:uuid/analytics
router.get(
  '/:uuid/analytics',
  validate(fields, {
    only: [
      'uuid',
      'period',
      'granularity',
      'include_comparisons',
      'metrics',
      'start_date',
      'end_date',
    ],
  }),
  JobAnalyticsController.getJobAnalytics,
);

// GET /api/v1/jobs/analytics/bulk
router.get(
  '/analytics/bulk',
  validate(fields, { only: ['job_uuids', 'period', 'metrics', 'sort_by', 'order'] }),
  JobAnalyticsController.getBulkJobAnalytics,
);

// GET /api/v1/analytics/departments/:department_id
router.get(
  '/analytics/departments/:department_id',
  validate(fields, { only: ['department_id', 'period', 'start_date', 'end_date'] }),
  JobAnalyticsController.getDepartmentAnalytics,
);

// GET /api/v1/analytics/overview
router.get('/analytics/overview', JobAnalyticsController.getPlatformOverview);

// GET /api/v1/analytics/export
router.get('/analytics/export', JobAnalyticsController.exportAnalytics);

module.exports = router;
