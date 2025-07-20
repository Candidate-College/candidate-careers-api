
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
/**
 * User Routes (v1)
 *
 * Currently only mount nested user-role assignment routes. Additional user CRUD
 * endpoints to be implemented in future tasks.
 *
 * @module src/routes/v1/user-routes
 */

import { Router } from 'express';

const router = Router();

// Nested routes for managing roles of a particular user
router.use('/:id/roles', require('./user-role-routes'));

module.exports = router;
