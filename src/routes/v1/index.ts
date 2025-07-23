/**
 * V1 API Main Router
 *
 * Menggabungkan semua sub-router untuk endpoint v1, termasuk job status workflow.
 *
 * @module routes/v1/index
 */
const express = require('express');
const router = express.Router();

const jobRoutes = require('./job-routes');
const userRoutes = require('./user-routes');
const roleRoutes = require('./role-routes');
const rolePermissionRoutes = require('./role-permission-routes');
const userRoleRoutes = require('./user-role-routes');
const eventRoutes = require('./event-routes');
const authRoutes = require('./auth-routes');
const adminRoutes = require('./admin');
const welcomeRoutes = require('./welcome-routes');
const jobStatusWorkflowRoutes = require('./job-status-workflow-routes');

router.use(jobRoutes);
router.use(userRoutes);
router.use(roleRoutes);
router.use(rolePermissionRoutes);
router.use(userRoleRoutes);
router.use(eventRoutes);
router.use(authRoutes);
router.use('/admin', adminRoutes);
router.use(welcomeRoutes);
// Mount job status workflow routes
router.use(jobStatusWorkflowRoutes);

module.exports = router;
