const router = require('express').Router();

const {
  accessToken,
  refreshToken,
  verificationToken,
} = require('@/middlewares/auth-middleware');
const { checkRole } = require('@/middlewares/authorization-middleware');
const validate = require('@/middlewares/request-validation-middleware');
const fields = require('@/validators/auth-validator');
const authController = require('@/controllers/auth-controller');

// router.use('rate-limit');
router.post(
  '/register',
  accessToken,
  checkRole({ only: 'superadmin' }),
  validate(fields.register, { only: 'body' }),
  authController.register,
);
router.post(
  '/verify-email',
  validate(fields.verifyEmail, { only: 'body' }),
  authController.verifyEmail,
);
// router.post('/resend-verification', verificationToken, authController.resendVerification);

router.post('/login', validate(fields.login), authController.login);
router.post('/refresh', refreshToken, authController.refresh);
router.delete('/logout', refreshToken, authController.logout);

module.exports = router;
