/**
 * CreateUserValidator
 *
 * Validates payload for creating a single user via admin endpoint.
 *
 * @module src/validators/user/create-user.validator
 */

import { body } from 'express-validator';

export const createUserValidator = [
  body('email').isEmail().withMessage('Invalid email'),
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('role_id').isInt({ gt: 0 }).withMessage('role_id must be positive integer'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
];
