/**
 * BulkOperationsValidator
 *
 * Validates payload for bulk user operations via admin endpoint.
 * Supports various bulk actions with appropriate validation.
 *
 * @module src/validators/user/bulk-operations.validator
 */

import { body } from 'express-validator';

export const bulkOperationsValidator = [
  body('action')
    .isIn(['activate', 'deactivate', 'delete', 'change_role', 'suspend'])
    .withMessage('Action must be one of: activate, deactivate, delete, change_role, suspend'),

  body('user_uuids')
    .isArray({ min: 1, max: 1000 })
    .withMessage('user_uuids must be an array with 1-1000 items'),

  body('user_uuids.*').isUUID(4).withMessage('Each user_uuid must be a valid UUID'),

  body('params.role_id')
    .if(body('action').equals('change_role'))
    .isInt({ gt: 0 })
    .withMessage('role_id is required and must be a positive integer for change_role action'),

  body('params.send_notification')
    .optional()
    .isBoolean()
    .withMessage('send_notification must be a boolean'),

  body('params.reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
];
