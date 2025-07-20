/**
 * UpdateUserValidator
 *
 * Validates payload for updating a single user via admin endpoint.
 * Supports partial updates with optional fields.
 *
 * @module src/validators/user/update-user.validator
 */

import { body } from 'express-validator';

export const updateUserValidator = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('role_id').optional().isInt({ gt: 0 }).withMessage('role_id must be a positive integer'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be one of: active, inactive, suspended'),

  body('send_notification')
    .optional()
    .isBoolean()
    .withMessage('send_notification must be a boolean'),
];
