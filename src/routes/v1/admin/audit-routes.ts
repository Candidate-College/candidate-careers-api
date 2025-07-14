/**
 * Admin Audit Routes (v1)
 *
 * Mounts Super-Admin protected endpoints for audit log access and analytics.
 *
 * URL prefix assumed to be `/api/v1/admin/audit` when registered by parent router.
 *
 * @module routes/v1/admin/audit-routes
 */

const router = require('express').Router();

const { accessToken } = require('@/middlewares/auth-middleware');
const { requireRole } = require('@/middlewares/role-middleware');
const validate = require('@/middlewares/request-validation-middleware');
const fields = require('@/validators/audit-validator');
const auditController = require('@/controllers/audit-controller');

// Require authentication + Super-Admin role for everything below
router.use(accessToken, requireRole('super_admin'));

// GET /admin/audit/logs
router.get('/logs', validate(fields, { only: 'query' }), auditController.listLogs);
// GET /admin/audit/logs/:id
router.get('/logs/:id', validate(fields, { only: 'param' }), auditController.getLogById);
// GET /admin/audit/users/:uuid/activity
router.get('/users/:uuid/activity', validate(fields, { only: 'param' }), auditController.getUserActivity);
// GET /admin/audit/statistics
router.get('/statistics', validate(fields, { only: 'query' }), auditController.getStatistics);
// GET /admin/audit/dashboard
router.get('/dashboard', auditController.getDashboard);

module.exports = router;
