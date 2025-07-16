/**
 * SearchUsersValidator
 *
 * Validates query parameters for advanced user search functionality.
 * Supports multiple search criteria and complex filtering.
 *
 * @module src/validators/user/search-users.validator
 */

module.exports = {
  // Search query
  q: {
    type: 'string',
    in: 'query',
    optional: true,
    trim: true,
    maxLength: 200,
  },

  // Pagination
  page: { type: 'number', in: 'query', optional: true, min: 1 },
  limit: { type: 'number', in: 'query', optional: true, min: 1, max: 100 },

  // Advanced filters
  filters: {
    type: 'object',
    in: 'query',
    optional: true,
    fields: {
      role_ids: { type: 'array', optional: true },
      statuses: {
        type: 'array',
        optional: true,
        value: { only: ['active', 'inactive', 'suspended'] },
      },
      email_domain: { type: 'string', optional: true },
      created_after: { type: 'date', optional: true },
      created_before: { type: 'date', optional: true },
      last_login_after: { type: 'date', optional: true },
      last_login_before: { type: 'date', optional: true },
      has_verified_email: { type: 'boolean', optional: true },
      login_attempts_greater_than: { type: 'number', optional: true, min: 0 },
    },
  },

  // Sorting
  sort_by: {
    type: 'string',
    in: 'query',
    optional: true,
    value: { only: ['name', 'email', 'created_at', 'last_login_at', 'status'] },
  },
  sort_order: {
    type: 'string',
    in: 'query',
    optional: true,
    value: { only: ['asc', 'desc'] },
  },

  // Search options
  include_deleted: { type: 'boolean', in: 'query', optional: true },
  exact_match: { type: 'boolean', in: 'query', optional: true },
};
