import { body, param, query } from 'express-validator';

/**
 * Job Update Validators
 *
 * Validates payload and query for job update endpoints.
 *
 * @module src/validators/job-update-validator
 */

export const updateJobValidator = [
    // Title validation
    body('title')
        .optional()
        .trim()
        .isString()
        .withMessage('Title must be a string')
        .isLength({ min: 5, max: 255 })
        .withMessage('Title must be between 5 and 255 characters'),

    // Department ID validation
    body('department_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Department ID must be a valid positive integer'),

    // Job Category ID validation
    body('job_category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Job category ID must be a valid positive integer'),

    // Job Type validation
    body('job_type')
        .optional()
        .isIn(['internship', 'staff', 'freelance', 'contract'])
        .withMessage('Job type must be one of: internship, staff, freelance, contract'),

    // Employment Level validation
    body('employment_level')
        .optional()
        .isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'head', 'co_head'])
        .withMessage('Employment level must be one of: entry, junior, mid, senior, lead, head, co_head'),

    // Priority Level validation
    body('priority_level')
        .optional()
        .isIn(['normal', 'urgent'])
        .withMessage('Priority level must be either normal or urgent'),

    // Description validation
    body('description')
        .optional()
        .trim()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ min: 50, max: 10000 })
        .withMessage('Description must be between 50 and 10000 characters'),

    // Requirements validation
    body('requirements')
        .optional()
        .trim()
        .isString()
        .withMessage('Requirements must be a string')
        .isLength({ min: 20, max: 5000 })
        .withMessage('Requirements must be between 20 and 5000 characters'),

    // Responsibilities validation
    body('responsibilities')
        .optional()
        .trim()
        .isString()
        .withMessage('Responsibilities must be a string')
        .isLength({ min: 20, max: 5000 })
        .withMessage('Responsibilities must be between 20 and 5000 characters'),

    // Benefits validation
    body('benefits')
        .optional()
        .trim()
        .isString()
        .withMessage('Benefits must be a string')
        .isLength({ max: 3000 })
        .withMessage('Benefits must not exceed 3000 characters'),

    // Team Info validation
    body('team_info')
        .optional()
        .trim()
        .isString()
        .withMessage('Team info must be a string')
        .isLength({ max: 2000 })
        .withMessage('Team info must not exceed 2000 characters'),

    // Application Deadline validation
    body('application_deadline')
        .optional()
        .isISO8601()
        .withMessage('Application deadline must be a valid ISO 8601 date')
        .custom((value) => {
            if (value) {
                const deadline = new Date(value);
                const now = new Date();
                if (deadline <= now) {
                    throw new Error('Application deadline must be a future date');
                }
            }
            return true;
        }),

    // Max Applications validation
    body('max_applications')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Max applications must be between 1 and 10000'),

    // Version validation (required for optimistic locking)
    body('version')
        .exists() 
        .withMessage('Version field is required')
        .notEmpty()
        .withMessage('Version field cannot be empty')
        .isInt({ min: 1 })
        .withMessage('Version is required and must be a positive integer for optimistic locking'),
]