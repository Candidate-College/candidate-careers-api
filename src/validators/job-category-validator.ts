import { body, param, query } from 'express-validator';

/**
 * JobCategory Validators
 *
 * Validates payload and query for job category endpoints.
 *
 * @module src/validators/job-category-validator
 */

export const createJobCategoryValidator = [
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
  body('color_code')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6})$/)
    .withMessage('Color code must be a valid hex color (e.g., #007bff)'),
];

export const updateJobCategoryValidator = [
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
  body('color_code')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6})$/)
    .withMessage('Color code must be a valid hex color (e.g., #007bff)'),
];

export const jobCategoryIdParamValidator = [
  param('id')
    .isInt({ gt: 0 }).withMessage('Job category ID must be a positive integer'),
];

export const listJobCategoriesValidator = [
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