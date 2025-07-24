import { body, param, query } from 'express-validator';

/**
 * Department Validators
 *
 * Validates payload and query for department endpoints.
 *
 * @module src/validators/department-validator
 */

export const createDepartmentValidator = [
  body('name')
    .isString().withMessage('Name must be a string')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

export const updateDepartmentValidator = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

export const departmentIdParamValidator = [
  param('id')
    .isInt({ gt: 0 }).withMessage('Department ID must be a positive integer'),
];

export const listDepartmentsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('search')
    .optional()
    .isString().withMessage('Search must be a string')
    .isLength({ min: 1, max: 255 }).withMessage('Search must be 1-255 characters'),
  query('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  query('sort')
    .optional()
    .isIn(['name', 'created_at']).withMessage('Sort must be name or created_at'),
  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
]; 