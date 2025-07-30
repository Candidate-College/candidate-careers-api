/**
 * Job Routes (v1)
 *
 * Exposes endpoints for job posting management. Applies authentication and authorization
 * middleware to ensure only authenticated users with the correct permissions can create jobs.
 *
 * @module src/routes/v1/job-routes
 */

import { accessToken } from '@/middlewares/auth-middleware';

const router = require('express').Router();

const { JobController } = require('@/controllers/job-controller');
const { authorize } = require('@/middlewares/authorization/authorize');

// Require jobs.create permission to create a job posting
router.post('/', accessToken, authorize('jobs.create'), JobController.createJobPosting);

// Require jobs.view permission to get job posting by uuid
router.get('/:uuid', accessToken, authorize('jobs.view'), JobController.getJobByUUID);

module.exports = router;
