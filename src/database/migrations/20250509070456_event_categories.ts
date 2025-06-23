import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('event_categories', table => {
      table.increments('id');
      table.string('name', 255).notNullable();
      table.timestamps(true, true);
      table.timestamp('deleted_at');
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('event_categories');
}
