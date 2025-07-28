import { body, param, query } from 'express-validator';

/**
 * Department Validators
 *
 * Validates payload and query for department endpoints.
 *
 * @module src/validators/department-validator
 */

/**
 * Helper function to create name validation rule
 * @param isRequired - Whether the name field is required
 * @returns Validation rule for name field
 */
const createNameValidation = (isRequired: boolean = true) => {
  const validation = body('name')
    .isString().withMessage('Name must be a string')
    .trim()
    .isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters');
  
  if (isRequired) {
    return validation.notEmpty().withMessage('Name is required');
  }
  return validation.optional();
};

/**
 * Helper function to create description validation rule
 * @returns Validation rule for description field
 */
const createDescriptionValidation = () => {
  return body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 1000 }).withMessage('Description max 1000 characters');
};

/**
 * Helper function to create status validation rule
 * @returns Validation rule for status field
 */
const createStatusValidation = () => {
  return body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be active or inactive');
};

export const createDepartmentValidator = [
  createNameValidation(true),
  createDescriptionValidation(),
  createStatusValidation(),
];

export const updateDepartmentValidator = [
  createNameValidation(false),
  createDescriptionValidation(),
  createStatusValidation(),
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