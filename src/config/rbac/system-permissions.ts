/**
 * Central catalogue of all application permissions.
 *
 * Keys follow `<domain>.<action>` kebab-case; values are human-readable
 * descriptions used for seed data and API documentation.
 *
 * IMPORTANT: Changes here are additive only – never modify existing keys,
 * instead deprecate via migration scripts to preserve referential integrity.
 */
export const SYSTEM_PERMISSIONS = {
  // User Management
  'users.view': 'View user accounts',
  'users.create': 'Create new user accounts',
  'users.update': 'Update user accounts',
  'users.delete': 'Delete user accounts',

  // Role Management
  'roles.view': 'View roles and permissions',
  'roles.create': 'Create new roles',
  'roles.update': 'Update existing roles',
  'roles.delete': 'Delete roles',

  // Job Management
  'jobs.view': 'View job postings',
  'jobs.create': 'Create job postings',
  'jobs.update': 'Update job postings',
  'jobs.delete': 'Delete job postings',
  'jobs.publish': 'Publish job postings',

  // Application Management
  'applications.view': 'View applications',
  'applications.review': 'Review applications',
  'applications.approve': 'Approve applications',
  'applications.reject': 'Reject applications',

  // Analytics & Reports
  'analytics.view': 'View analytics and reports',
  'analytics.export': 'Export reports',
  'analytics.executive': 'View executive dashboard',

  // System Administration
  'system.settings': 'Manage system settings',
  'system.audit': 'View audit logs',
  'system.maintenance': 'Perform system maintenance',
} as const;

export type SystemPermission = keyof typeof SYSTEM_PERMISSIONS;

/**
 * Type-guard utility – checks if a string is a valid `SystemPermission`.
 */
export function isSystemPermission(slug: string): slug is SystemPermission {
  return Object.prototype.hasOwnProperty.call(SYSTEM_PERMISSIONS, slug);
}
