const router = require('express').Router();

router.use('/', require('./welcome-routes'));
router.use('/auth', require('./auth-routes'));
router.use('/events', require('./event-routes'));

module.exports = router;
