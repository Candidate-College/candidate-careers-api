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
import { DEFAULT_ROLES, getDefaultRolePermissions, DefaultRoleKey } from '@/config/rbac/default-roles';
import { SYSTEM_PERMISSIONS } from '@/config/rbac/system-permissions';

interface SeedPermission {
  name: string;
  display_name: string;
  description?: string;
}

const roles = Object.entries(DEFAULT_ROLES).map(([name, cfg]) => ({
  name,
  display_name: cfg.display_name,
  description: cfg.description,
}));

const permissions: SeedPermission[] = Object.entries(SYSTEM_PERMISSIONS).map(([name, display_name]) => ({ name, display_name }));

// Helper: build many-to-many mapping
function buildRolePermissions(): Array<{ role_name: string; perm_name: string }> {
  const mappings: Array<{ role_name: string; perm_name: string }> = [];
  (Object.keys(DEFAULT_ROLES) as DefaultRoleKey[]).forEach((role) => {
    const perms = getDefaultRolePermissions(role);
    perms.forEach((perm) => mappings.push({ role_name: role, perm_name: perm }));
  });
  return mappings;
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
