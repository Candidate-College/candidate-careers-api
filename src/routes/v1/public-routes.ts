const router = require('express').Router();

const { JobController } = require('@/controllers/job-controller');

router.get('/jobs/:slug', JobController.getPublicJobBySlug);

module.exports = router;
