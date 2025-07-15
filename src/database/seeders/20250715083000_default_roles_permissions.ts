/**
 * Default Roles & Permissions Seeder
 *
 * Populates the `roles`, `permissions`, and `role_permissions` tables with
 * initial data for the CC Career platform. The seeder is idempotent – it will
 * not insert duplicates if it is executed multiple times. It relies on the
 * `ON CONFLICT DO NOTHING` clause available in PostgreSQL.
 *
 * @module src/database/seeders/20250715083000_default_roles_permissions
 */

import type { Knex } from 'knex';

interface SeedRole {
  name: string;
  display_name: string;
  description?: string;
}

interface SeedPermission {
  name: string;
  display_name: string;
  description?: string;
}

const roles: SeedRole[] = [
  {
    name: 'super_admin',
    display_name: 'Super Administrator',
    description: 'Full system access with elevated privileges.',
  },
  {
    name: 'recruiter',
    display_name: 'Recruiter',
    description: 'Manage job postings and candidate applications.',
  },
  {
    name: 'candidate',
    display_name: 'Candidate',
    description: 'Standard user applying for jobs.',
  },
];

const permissions: SeedPermission[] = [
  // Job Posting
  {
    name: 'job.create',
    display_name: 'Create Job Posting',
  },
  {
    name: 'job.update',
    display_name: 'Update Job Posting',
  },
  {
    name: 'job.delete',
    display_name: 'Delete Job Posting',
  },
  // User management
  {
    name: 'user.read',
    display_name: 'Read User',
  },
  {
    name: 'user.update',
    display_name: 'Update User',
  },
];

// Helper: build many-to-many mapping
function buildRolePermissions(): Array<{ role_name: string; perm_name: string }> {
  return [
    // Super admin gets all permissions
    ...permissions.map((p) => ({ role_name: 'super_admin', perm_name: p.name })),
    // Recruiter job permissions
    { role_name: 'recruiter', perm_name: 'job.create' },
    { role_name: 'recruiter', perm_name: 'job.update' },
    { role_name: 'recruiter', perm_name: 'job.delete' },
  ];
}

export async function seed(knex: Knex): Promise<void> {
  // Roles
  for (const role of roles) {
    await knex('roles')
      .insert(role)
      .onConflict('name')
      .ignore();
  }

  // Permissions
  for (const perm of permissions) {
    await knex('permissions')
      .insert(perm)
      .onConflict('name')
      .ignore();
  }

  // Role-Permissions junction
  const rolePerms = buildRolePermissions();

  // Resolve role and permission ids via sub-selects to keep idempotent behaviour
  for (const mapping of rolePerms) {
    await knex.raw(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.id, p.id
       FROM roles r, permissions p
       WHERE r.name = ? AND p.name = ?
       ON CONFLICT (role_id, permission_id) DO NOTHING`,
      [mapping.role_name, mapping.perm_name]
    );
  }
}
