const router = require('express').Router();

router.use('/auth', require('./auth-routes'));
// router.use('/users', require('./user-routes'));
router.use('/events', require('./event-routes'));
router.use('/roles', require('./role-routes'));
router.use('/users', require('./user-routes'));
router.use('/admin', require('./admin'));
router.use('/departments', require('./department-routes').default);

module.exports = router;
