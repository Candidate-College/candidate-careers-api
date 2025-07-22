/**
 * Job Routes (v1)
 *
 * Currently only mount nested user-role assignment routes. Additional user CRUD
 * endpoints to be implemented in future tasks.
 *
 * @module src/routes/v1/jobs
 */

import { Router } from 'express';

import { JobController } from '@/controllers/job-controller';
import { authorize } from '@/middlewares/authorization/authorize';

const router = Router();

router.post('/', authorize('jobs.manage'), JobController.createJobPosting);

module.exports = router;
