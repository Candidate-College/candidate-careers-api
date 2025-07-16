/**
 * ImpersonateUserValidator
 *
 * Validates payload for user impersonation via admin endpoint.
 * Includes safety checks and duration limits for impersonation sessions.
 *
 * @module src/validators/user/impersonate-user.validator
 */

import { body } from 'express-validator';

export const impersonateUserValidator = [
  body('duration_minutes')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes (8 hours)'),

  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),

  body('notify_user').optional().isBoolean().withMessage('notify_user must be a boolean'),
];
