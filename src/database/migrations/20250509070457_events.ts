import type { Knex } from 'knex';

const foreigns = {
  category: 'category_id',
}

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('events', table => {
      table.increments('id');
      table.integer(foreigns.category).unsigned().notNullable();
      table.string('slug', 255).notNullable().unique();
      table.string('title', 255).notNullable();
      table.string('snippet').nullable();
      table.text('content').nullable();
      table.text('cover').nullable();
      table.date('starts_at').nullable();
      table.date('ends_at').nullable();
      table.timestamps(true, true);
      table.timestamp('deleted_at');

      table.foreign(foreigns.category).references('id').inTable('event_categories').onDelete('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('events', table => {
    Object.values(foreigns).map(key => table.dropForeign(key))
  }).dropTableIfExists('events');
}
