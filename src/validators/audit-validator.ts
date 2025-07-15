/**
 * Audit Validators
 *
 * Centralized validation schema definitions for all audit controller endpoints.
 * Mirrors style used in existing validator modules (e.g., `event-validator.ts`).
 *
 * @module validators/audit-validator
 */

// NOTE: This validator object structure is consumed by the generic
// `request-validation-middleware`. Each property can declare where the value
// comes from (`in`) and optional constraints.

const pagination = {
  page: { type: 'number', in: 'query', optional: true },
  perPage: { type: 'number', in: 'query', optional: true },
};

module.exports = {
  // ===== Logs listing (`GET /admin/audit/logs`)
  ...pagination,
  user_id: { type: 'string', in: 'query', optional: true },
  category: { type: 'string', in: 'query', optional: true },
  severity: { type: 'string', in: 'query', optional: true },
  dateFrom: { type: 'timestamp', in: 'query', optional: true },
  dateTo: { type: 'timestamp', in: 'query', optional: true },

  // ===== Single audit log (`GET /admin/audit/logs/:id`)
  id: { type: 'number', in: 'param' },

  // ===== User activity (`GET /admin/audit/users/:uuid/activity`)
  uuid: { type: 'string', in: 'param' },

  // ===== Statistics (`GET /admin/audit/statistics`)
  period: { type: 'string', in: 'query', optional: true },
  groupBy: { type: 'string', in: 'query', optional: true },
};
