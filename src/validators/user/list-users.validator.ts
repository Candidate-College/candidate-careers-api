/**
 * List Users Validator
 *
 * Defines validation schema for GET /admin/users query parameters. Uses the
 * custom request-validation-middleware already employed elsewhere in the
 * project.
 *
 * @module src/validators/user/list-users.validator
 */

module.exports = {
  // Pagination
  page: { type: 'number', in: 'query', optional: true, min: 1 },
  limit: { type: 'number', in: 'query', optional: true, min: 1, max: 100 },

  // Filters
  search: { type: 'string', in: 'query', optional: true, trim: true },
  role_id: { type: 'number', in: 'query', optional: true },
  status: {
    type: 'string',
    in: 'query',
    optional: true,
    value: { only: ['active', 'inactive', 'suspended'] },
  },
  created_from: { type: 'date', in: 'query', optional: true },
  created_to: { type: 'date', in: 'query', optional: true },

  // Sorting
  sort_by: {
    type: 'string',
    in: 'query',
    optional: true,
    value: { only: ['name', 'email', 'created_at', 'last_login_at'] },
  },
  sort_order: {
    type: 'string',
    in: 'query',
    optional: true,
    value: { only: ['asc', 'desc'] },
  },
};
