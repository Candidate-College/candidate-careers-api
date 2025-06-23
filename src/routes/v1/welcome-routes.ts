const router = require('express').Router();

const welcomeController = require('@/controllers/welcome-controller');

router.get('/', welcomeController.index);

module.exports = router;
