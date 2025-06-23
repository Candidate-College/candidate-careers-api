const router = require('express').Router();

const { refreshToken } = require('@/middlewares/auth-middleware');
const validate = require('@/middlewares/request-validation-middleware');
const fields = require('@/validators/auth-validator');
const authController = require('@/controllers/auth-controller');

router.post('/register', validate(fields.register), authController.register);
router.post('/login', validate(fields.login), authController.login);
router.post('/refresh', refreshToken, authController.refresh);
router.delete('/logout', refreshToken, authController.logout);

module.exports = router;
