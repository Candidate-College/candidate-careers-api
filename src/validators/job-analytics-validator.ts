/**
 * Job Analytics Validators
 *
 * Centralized validation schema definitions for all job analytics endpoints.
 * Compatible with request-validation-middleware and express-validator.
 *
 * @module validators/job-analytics-validator
 */

const pagination = {
  page: { type: 'number', in: 'query', optional: true },
  perPage: { type: 'number', in: 'query', optional: true },
};

module.exports = {
  // GET /api/v1/jobs/:uuid/analytics
  uuid: { type: 'string', in: 'param' },
  period: { type: 'string', in: 'query', optional: true },
  granularity: { type: 'string', in: 'query', optional: true },
  include_comparisons: { type: 'boolean', in: 'query', optional: true },
  metrics: { type: 'string', in: 'query', optional: true },
  start_date: { type: 'date', in: 'query', optional: true },
  end_date: { type: 'date', in: 'query', optional: true },

  // GET /api/v1/jobs/analytics/bulk
  job_uuids: { type: 'string', in: 'query', optional: true },
  sort_by: { type: 'string', in: 'query', optional: true },
  order: { type: 'string', in: 'query', optional: true },

  // GET /api/v1/analytics/departments/:department_id
  department_id: { type: 'string', in: 'param' },

  // GET /api/v1/analytics/overview
  // (no additional params)

  // GET /api/v1/analytics/export
  format: { type: 'string', in: 'query', optional: true },
};
