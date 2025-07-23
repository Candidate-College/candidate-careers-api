export const config = { transaction: false };

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'department_status') THEN
        CREATE TYPE department_status AS ENUM ('active', 'inactive');
      END IF;
    END$$;
  `);

  await knex.schema.createTable('departments', table => {
    table.increments('id');
    table.string('name', 255).notNullable().unique();
    table.text('description');
    table.specificType('status', 'department_status').defaultTo('active');
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });

    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('departments');
  await knex.schema.raw('DROP TYPE IF EXISTS department_status');
}
