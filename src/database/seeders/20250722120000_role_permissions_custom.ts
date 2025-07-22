/**
 * Custom Role-Permissions Seeder
 *
 * Mengisi table `role_permissions` dengan semua kombinasi role-permission yang ada di database.
 * Setiap role akan mendapatkan semua permission. Seeder ini idempotent (ON CONFLICT DO NOTHING).
 *
 * @module src/database/seeders/20250722120000_role_permissions_custom
 */
import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Ambil semua role dan permission
  const roles = await knex('roles').select('id', 'name');
  const permissions = await knex('permissions').select('id', 'name');

  // Buat semua kombinasi role-permission
  const mappings: Array<{ role_id: number; permission_id: number }> = [];
  for (const role of roles) {
    for (const perm of permissions) {
      mappings.push({ role_id: role.id, permission_id: perm.id });
    }
  }

  // Insert ke table role_permissions (idempotent)
  for (const mapping of mappings) {
    await knex('role_permissions')
      .insert(mapping)
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }
}
