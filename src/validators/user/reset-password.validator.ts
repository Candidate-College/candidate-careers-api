/**
 * ResetPasswordValidator
 *
 * Validates payload for resetting user password via admin endpoint.
 * Supports temporary password generation and email notifications.
 *
 * @module src/validators/user/reset-password.validator
 */

import { body } from 'express-validator';

export const resetPasswordValidator = [
  body('generate_temporary')
    .optional()
    .isBoolean()
    .withMessage('generate_temporary must be a boolean'),

  body('send_email').optional().isBoolean().withMessage('send_email must be a boolean'),

  body('require_change').optional().isBoolean().withMessage('require_change must be a boolean'),

  body('new_password')
    .optional()
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    ),
];
