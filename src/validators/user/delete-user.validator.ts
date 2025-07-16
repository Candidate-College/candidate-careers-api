/**
 * DeleteUserValidator
 *
 * Validates payload for deleting a single user via admin endpoint.
 * Includes safety checks and confirmation requirements.
 *
 * @module src/validators/user/delete-user.validator
 */

import { body } from 'express-validator';

export const deleteUserValidator = [
  body('confirmation')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Confirmation is required'),

  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),

  body('permanent').optional().isBoolean().withMessage('permanent must be a boolean'),
];
