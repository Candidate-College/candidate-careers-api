const { Router } = require('express');
const JobDeletionController = require('@controllers/job-deletion-controller');
const { authorize } = require('@/middlewares/authorization/authorize');
const { accessToken } = require('@/middlewares/auth-middleware');

const router = Router();

// Integrate authentication middleware (accessToken) so req.user is available
router.delete('/:uuid', accessToken, authorize('jobs.delete'), JobDeletionController.deleteJobPosting);
router.post('/:uuid/restore', accessToken, authorize('jobs.restore'), JobDeletionController.restoreJobPosting);

module.exports = router; 