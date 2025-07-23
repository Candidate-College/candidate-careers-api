/**
 * Job Status Workflow Routes (v1)
 *
 * Exposes endpoints for job posting status workflow management (publish, close, archive, reopen, bulk).
 * Applies authentication and authorization middleware for security.
 *
 * @module routes/v1/job-status-workflow-routes
 */

const express = require('express');
const router = express.Router();
const { JobStatusWorkflowController } = require('@/controllers/job-status-workflow-controller');
const { authorize } = require('@/middlewares/authorization/authorize');
const { accessToken } = require('@/middlewares/auth-middleware');

router.use(accessToken);

// Publish job posting
router.post('/jobs/:uuid/publish', authorize('jobs.publish'), JobStatusWorkflowController.publish);
// Close job posting
router.post('/jobs/:uuid/close', authorize('jobs.publish'), JobStatusWorkflowController.close);
// Archive job posting
router.post('/jobs/:uuid/archive', authorize('jobs.publish'), JobStatusWorkflowController.archive);
// Reopen job posting
router.post('/jobs/:uuid/reopen', authorize('jobs.publish'), JobStatusWorkflowController.reopen);
// Bulk status update
router.post('/jobs/bulk-status', authorize('jobs.publish'), JobStatusWorkflowController.bulkStatus);

module.exports = router;
