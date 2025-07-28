import { Router } from "express";
import { JobPostingsController } from "@/controllers/job-postings-controller";
const { authorize } = require('@/middlewares/authorization/authorize');
const { accessToken } = require('@/middlewares/auth-middleware');

const router = Router();

// Integrate authentication middleware (accessToken) so req.user is available
router.put('/:uuid', accessToken, authorize('jobs.update'), JobPostingsController.updateJobPosting);
router.delete('/:uuid', accessToken, authorize('jobs.delete'), JobPostingsController.deleteJobPosting);
router.post('/:uuid/restore', accessToken, authorize('jobs.restore'), JobPostingsController.restoreJobPosting);

module.exports = router; 