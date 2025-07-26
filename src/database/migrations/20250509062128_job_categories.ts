export const config = { transaction: false };

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_category_status') THEN
        CREATE TYPE job_category_status AS ENUM ('active', 'inactive');
      END IF;
    END$$;
  `);

  await knex.schema.createTable('job_categories', table => {
    table.increments('id');
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.text('description');
    table.specificType('status', 'job_category_status').defaultTo('active');
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index(['status'], 'idx_job_categories_status');
    table.index(['name'], 'idx_job_categories_name');
    table.index(['created_at'], 'idx_job_categories_created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('job_categories');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_job_categories_status');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_job_categories_name');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_job_categories_created_at');
}
