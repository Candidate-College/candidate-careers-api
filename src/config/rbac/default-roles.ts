/**
 * Catalogue of built-in system roles.
 * Additive-only changes — never modify or remove existing keys without a
 * dedicated migration.
 */
import type { SystemPermission } from './system-permissions';
import { SYSTEM_PERMISSIONS } from './system-permissions';

export interface DefaultRole {
  display_name: string;
  description: string;
  permissions: readonly SystemPermission[] | ['*'];
}

export const DEFAULT_ROLES = {
  super_admin: {
    display_name: 'Super Administrator',
    description: 'Full system access and control',
    permissions: ['*'],
  },
  head_of_hr: {
    display_name: 'Head of HR',
    description: 'Strategic HR oversight and team management',
    permissions: [
      'users.view',
      'jobs.view',
      'jobs.create',
      'jobs.update',
      'jobs.publish',
      'applications.view',
      'applications.review',
      'applications.approve',
      'applications.reject',
      'analytics.view',
      'analytics.export',
      'analytics.executive',
    ],
  },
  hr_staff: {
    display_name: 'HR Staff',
    description: 'Day-to-day recruitment operations',
    permissions: [
      'jobs.view',
      'jobs.create',
      'jobs.update',
      'applications.view',
      'applications.review',
      'applications.approve',
      'applications.reject',
      'analytics.view',
    ],
  },
} as const;

export type DefaultRoleKey = keyof typeof DEFAULT_ROLES;

export function isDefaultRole(slug: string): slug is DefaultRoleKey {
  return Object.prototype.hasOwnProperty.call(DEFAULT_ROLES, slug);
}

export function getDefaultRolePermissions(role: DefaultRoleKey): SystemPermission[] {
  const cfg = DEFAULT_ROLES[role];
  if (cfg.permissions.length === 1 && cfg.permissions[0] === '*') {
    return Object.keys(SYSTEM_PERMISSIONS) as SystemPermission[];
  }
  return [...cfg.permissions] as SystemPermission[];
}
