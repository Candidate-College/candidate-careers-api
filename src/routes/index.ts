const router = require('express').Router();

/* API documentation */
router.use('/docs', require('./docs'));

/* v1 routes */
router.use('/v1', require('./v1'));

/* v2 routes */

module.exports = router;
