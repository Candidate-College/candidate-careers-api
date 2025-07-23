export const config = { transaction: false };

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_setting_type') THEN
        CREATE TYPE system_setting_type AS ENUM ('string', 'integer', 'boolean', 'json', 'text');
      END IF;
    END$$;
  `);

  await knex.schema.createTable('system_settings', table => {
    table.increments('id');
    table.string('key', 100).notNullable();
    table.text('value');
    table.specificType('type', 'system_setting_type').defaultTo('string');
    table.text('description');
    table.boolean('is_public').defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('system_settings');
  await knex.schema.raw('DROP TYPE IF EXISTS system_setting_type');
}
