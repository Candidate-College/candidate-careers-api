/**
 * Permissions & Role-Permissions Migration
 *
 * Introduces granular permission management through dedicated `permissions` and
 * `role_permissions` tables. Follows existing conventions (bigIncrements PK,
 * snake_case, timestamp columns) to remain compatible with pre-existing
 * `roles` and `users` schema.
 *
 * @module src/database/migrations/20250715083000_permissions_and_role_permissions
 */

import type { Knex } from 'knex';

/**
 * Run the migration – create `permissions` and `role_permissions` tables.
 *
 * @param knex Knex instance
 */
export async function up(knex: Knex): Promise<void> {
  // Permissions reference table
  await knex.schema.createTable('permissions', (table) => {
    table.bigIncrements('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('display_name', 100).notNullable();
    table.text('description').nullable();

    table.timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  // Junction table mapping many-to-many relationship between roles & permissions
  await knex.schema.createTable('role_permissions', (table) => {
    table.bigIncrements('id').primary();

    table.bigInteger('role_id').unsigned().notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');

    table.bigInteger('permission_id').unsigned().notNullable()
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE');

    table.unique(['role_id', 'permission_id']);
  });

  // Indexes for quicker lookups
  await knex.schema.raw('CREATE INDEX role_permissions_role_id_idx ON role_permissions(role_id)');
  await knex.schema.raw('CREATE INDEX role_permissions_permission_id_idx ON role_permissions(permission_id)');
}

/**
 * Rollback – drop junction first (FK dependent), then permissions.
 *
 * @param knex Knex instance
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
}
