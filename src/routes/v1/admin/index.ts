const router = require('express').Router();

/* Audit routes */
router.use('/audit', require('./audit-routes'));
/* User management routes */
router.use('/users', require('./user-management-routes'));

module.exports = router;
