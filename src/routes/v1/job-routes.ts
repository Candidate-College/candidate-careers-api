/**
 * Job Routes (v1)
 *
 * Exposes endpoints for job posting management. Applies authentication and authorization
 * middleware to ensure only authenticated users with the correct permissions can create jobs.
 *
 * @module src/routes/v1/job-routes
 */

const router = require('express').Router();

const { JobController } = require('@/controllers/job-controller');
const { authorize } = require('@/middlewares/authorization/authorize');
const { accessToken } = require('@/middlewares/auth-middleware');

// Require authentication for all job routes
router.use(accessToken);
// Require jobs.manage permission to create a job posting
router.post('/', authorize('jobs.create'), JobController.createJobPosting);

module.exports = router;
