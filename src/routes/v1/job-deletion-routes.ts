import { Router } from 'express';
import { JobDeletionController } from '@/controllers/job-deletion-controller';
import { accessToken } from '@/middlewares/auth-middleware';
import { authorize } from '@/middlewares/authorization/authorize';

const router = Router();

// Integrate authentication middleware (accessToken) so req.user is available
// @ts-expect-error: Middleware type mismatch is safe at runtime
router.delete('/job-postings/:uuid', accessToken, authorize('job-postings.delete'), JobDeletionController.deleteJobPosting);
// @ts-expect-error: Middleware type mismatch is safe at runtime
router.post('/job-postings/:uuid/restore', accessToken, authorize('job-postings.restore'), JobDeletionController.restoreJobPosting);

export default router; 