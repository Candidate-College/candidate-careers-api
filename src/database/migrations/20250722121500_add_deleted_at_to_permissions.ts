import type { Knex } from 'knex';

/**
 * Add deleted_at column to permissions table for soft delete support.
 *
 * @module src/database/migrations/20250722121500_add_deleted_at_to_permissions
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('permissions', table => {
    table.timestamp('deleted_at', { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('permissions', table => {
    table.dropColumn('deleted_at');
  });
}
