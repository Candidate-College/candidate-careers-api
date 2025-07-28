import { Router } from "express";
import { JobPostingController } from "@/controllers/job-posting-controller";
const { authorize } = require('@/middlewares/authorization/authorize');
const { accessToken } = require('@/middlewares/auth-middleware');

const router = Router();

// Integrate authentication middleware (accessToken) so req.user is available
router.put('/:uuid', accessToken, authorize('jobs.update'), JobPostingController.updateJobPosting);
router.delete('/:uuid', accessToken, authorize('jobs.delete'), JobPostingController.deleteJobPosting);
router.post('/:uuid/restore', accessToken, authorize('jobs.restore'), JobPostingController.restoreJobPosting);

module.exports = router; 