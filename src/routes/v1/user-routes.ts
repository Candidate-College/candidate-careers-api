const router = require('express').Router();

const { accessToken } = require('@/middlewares/auth-middleware');
const validate = require('@/middlewares/request-validation-middleware');
const fields = require('@/validators/user-validator');
const userController = require('@/controllers/user-controller');

router.get(
  '/profile',
  accessToken,
  userController.getProfile,
);

router.put(
  '/profile',
  accessToken,
  validate(fields.profile),
  userController.updateProfile,
);

module.exports = router;
