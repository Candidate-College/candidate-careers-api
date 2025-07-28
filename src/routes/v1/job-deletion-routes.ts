import { Router } from "express";
import { JobDeletionController } from "@/controllers/job-deletion-controller";
import { authorize } from '@/middlewares/authorization/authorize';
import { accessToken } from '@/middlewares/auth-middleware';

const router = Router();

// Integrate authentication middleware (accessToken) so req.user is available
// @ts-ignore - Type mismatch between middleware types
router.delete('/:uuid', accessToken, authorize('jobs.delete'), JobDeletionController.deleteJobPosting);
// @ts-ignore - Type mismatch between middleware types
router.post('/:uuid/restore', accessToken, authorize('jobs.restore'), JobDeletionController.restoreJobPosting);

export default router;  