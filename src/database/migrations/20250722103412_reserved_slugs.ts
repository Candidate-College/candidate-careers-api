import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reserved_slugs', table => {
    table.bigIncrements('id').primary();
    table.string('slug', 100).notNullable().unique();
    table.string('reason', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reserved_slugs');
}
